import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, SwitchCamera, FlipHorizontal, Sparkles, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import Avatar from './Avatar';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { 
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  { 
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  { 
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

const CallOverlay = ({
  socket,
  user,
  callState,
  otherUser,
  acceptedSignal,
  incomingSignal,
  iceCandidates,
  onHangUp,
  onAcceptCall,
  onDeclineCall,
  role,
  callType: initialCallType = 'audio'
}) => {
  const { notifications } = useSettings();
  const [callType, setCallType] = useState(initialCallType);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [isMirrored, setIsMirrored] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioFailed, setAudioFailed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting'

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const isRemoteDescriptionSet = useRef(false);
  const processedCandidates = useRef(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Manage Synthetic Ringtone / Dial-tone
  useEffect(() => {
    if (callState === 'outgoing') {
      startTone('dial');
    } else if (callState === 'incoming') {
      startTone('ring');
    } else {
      stopTone();
    }
    return () => stopTone();
  }, [callState, notifications]);

  // 2. Timer for active call
  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // 3. Setup WebRTC peer connection
  useEffect(() => {
    if (callState === 'outgoing') {
      setupWebRTCAsCaller();
    } else if (callState === 'connected' && incomingSignal && !peerConnectionRef.current) {
      setupWebRTCAsCallee();
    }
  }, [callState]);

  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, []);

  // 4. Handle accepted signal
  useEffect(() => {
    if (acceptedSignal && peerConnectionRef.current && !isRemoteDescriptionSet.current) {
      console.log("Setting remote description on caller side");
      peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(acceptedSignal))
        .then(() => {
          isRemoteDescriptionSet.current = true;
          iceCandidateQueue.current.forEach(candidate => {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(err => console.error("Error adding queued ICE on caller:", err));
          });
          iceCandidateQueue.current = [];
        })
        .catch(err => console.error("Error setting remote description on caller:", err));
    }
  }, [acceptedSignal]);

  // 5. Handle incoming ICE candidates
  useEffect(() => {
    if (iceCandidates && iceCandidates.length > 0) {
      iceCandidates.forEach((candidateObj, index) => {
        if (!processedCandidates.current.has(index)) {
          if (peerConnectionRef.current && isRemoteDescriptionSet.current) {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateObj))
              .catch(err => console.error("Error adding ICE candidate:", err));
          } else {
            iceCandidateQueue.current.push(candidateObj);
          }
          processedCandidates.current.add(index);
        }
      });
    }
  }, [iceCandidates]);

  // --- Sound Synthesizer ---
  const startTone = (type) => {
    try {
      stopTone();
      if (notifications?.calls === false) return;
      const vol = typeof notifications?.soundVolume === 'number' ? notifications.soundVolume : 80;
      if (vol <= 0) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime((vol / 100) * 0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === 'dial') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const toneGain = ctx.createGain();
        toneGain.gain.setValueAtTime(0, ctx.currentTime);
        osc1.frequency.setValueAtTime(350, ctx.currentTime);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        osc1.connect(toneGain);
        osc2.connect(toneGain);
        toneGain.connect(masterGain);
        osc1.start();
        osc2.start();

        let time = ctx.currentTime;
        for (let i = 0; i < 30; i++) {
          toneGain.gain.setValueAtTime(0.25, time);
          toneGain.gain.setValueAtTime(0, time + 1.2);
          time += 4.0;
        }
      } else if (type === 'ring') {
        const ringStyle = notifications?.callSound || 'classic';
        if (ringStyle === 'none') return;

        let time = ctx.currentTime;
        if (ringStyle === 'marimba') {
          for (let cycle = 0; cycle < 15; cycle++) {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, time + idx * 0.12);
              gain.gain.setValueAtTime(0.7, time + idx * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.12 + 0.25);
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(time + idx * 0.12);
              osc.stop(time + idx * 0.12 + 0.26);
            });
            time += 2.5;
          }
        } else if (ringStyle === 'digital') {
          for (let cycle = 0; cycle < 15; cycle++) {
            [0, 0.08, 0.16, 0.24].forEach((offset, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(i % 2 === 0 ? 980 : 1300, time + offset);
              gain.gain.setValueAtTime(0.5, time + offset);
              gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.06);
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(time + offset);
              osc.stop(time + offset + 0.07);
            });
            time += 2.0;
          }
        } else if (ringStyle === 'soft') {
          for (let cycle = 0; cycle < 12; cycle++) {
            [523.25, 659.25, 783.99].forEach(freq => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, time);
              gain.gain.setValueAtTime(0.01, time);
              gain.gain.linearRampToValueAtTime(0.4, time + 0.15);
              gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(time);
              osc.stop(time + 0.92);
            });
            time += 3.0;
          }
        } else {
          // Classic
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const toneGain = ctx.createGain();
          toneGain.gain.setValueAtTime(0, ctx.currentTime);
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          osc1.connect(toneGain);
          osc2.connect(toneGain);
          toneGain.connect(masterGain);
          osc1.start();
          osc2.start();

          for (let i = 0; i < 20; i++) {
            toneGain.gain.setValueAtTime(0.35, time);
            toneGain.gain.setValueAtTime(0, time + 2.0);
            time += 5.0;
          }
        }
      }
    } catch (err) {
      console.error("Synthesizer failed to initialize:", err);
    }
  };

  const stopTone = () => {
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  // Helper for resilient mobile userMedia acquisition
  const getMediaStreamWithFallback = async (preferVideo) => {
    const audioConstraints = {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true }
    };

    if (preferVideo) {
      try {
        // Mobile optimized video constraints
        const videoConstraints = {
          facingMode: facingMode === 'environment' ? { ideal: 'environment' } : 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          frameRate: { ideal: 30, max: 30 }
        };
        return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: videoConstraints });
      } catch (err) {
        console.warn("High-spec video capture failed, trying basic video constraints:", err);
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (videoErr) {
          console.warn("Video failed completely on this device, falling back to audio only:", videoErr);
          setCallType('audio');
          return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        }
      }
    } else {
      return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
    }
  };

  // --- WebRTC Logic ---
  const createPeerConnection = (otherUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          to: otherUser.id || otherUser._id,
          candidate: event.candidate,
          from: user.id || user._id
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      setConnectionStatus('connected');
      
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);

      // Bind to remote video element if video
      if (remoteVideoRef.current && (event.track.kind === 'video' || callType === 'video')) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(e => {
          console.log("Remote video play deferred:", e);
          setAudioFailed(true);
        });
      }

      // Bind to remote audio element
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => {
          console.log("Remote audio play deferred on mobile:", e);
          setAudioFailed(true);
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionStatus('connecting');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        onHangUp();
      }
    };

    return pc;
  };

  const setupWebRTCAsCaller = async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await getMediaStreamWithFallback(callType === 'video');
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.log("Local video play notice:", e));
      }

      const pc = createPeerConnection(otherUser.id || otherUser._id);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall: otherUser.id || otherUser._id,
        signalData: offer,
        from: user.id || user._id,
        name: user.username,
        callType: callType
      });
    } catch (err) {
      console.error("Failed to setup WebRTC as caller:", err);
      alert("Could not access camera/microphone. Please ensure permissions are granted in site settings.");
      onHangUp();
    }
  };

  const setupWebRTCAsCallee = async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await getMediaStreamWithFallback(callType === 'video');
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.log("Local video play notice:", e));
      }

      const pc = createPeerConnection(otherUser.id || otherUser._id);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
      isRemoteDescriptionSet.current = true;
      
      iceCandidateQueue.current.forEach(candidate => {
        pc.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(err => console.error("Error adding queued ICE on callee:", err));
      });
      iceCandidateQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        to: otherUser.id || otherUser._id,
        signal: answer
      });
    } catch (err) {
      console.error("Failed to setup WebRTC as callee:", err);
      alert("Could not access camera/microphone. Please ensure permissions are granted in site settings.");
      onHangUp();
    }
  };

  const cleanupWebRTC = () => {
    stopTone();
    if (socket && otherUser && (otherUser.id || otherUser._id)) {
      socket.emit('end_call', { to: otherUser.id || otherUser._id });
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    isRemoteDescriptionSet.current = false;
    iceCandidateQueue.current = [];
    processedCandidates.current.clear();
  };

  const handleDecline = () => {
    socket.emit('decline_call', { to: otherUser.id });
    socket.emit('save_call_history', {
      caller_id: otherUser.id,
      callee_id: user.id,
      status: 'declined',
      duration_seconds: 0,
      callType: callType
    });
    onDeclineCall();
  };

  const handleHangUp = () => {
    socket.emit('end_call', { to: otherUser.id || otherUser._id });
    if (role === 'caller') {
      socket.emit('save_call_history', {
        caller_id: user.id || user._id,
        callee_id: otherUser.id || otherUser._id,
        status: callState === 'connected' ? 'completed' : 'missed',
        duration_seconds: duration,
        callType: callType
      });
    }
    onHangUp();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      tracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getVideoTracks();
      if (tracks.length > 0) {
        const nextEnabled = !tracks[0].enabled;
        tracks.forEach(track => {
          track.enabled = nextEnabled;
        });
        setIsVideoOff(!nextEnabled);
      }
    }
  };

  const switchCamera = async () => {
    if (!localStreamRef.current || callType !== 'video') return;
    try {
      const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextFacingMode } }
        });
      } catch (e) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextFacingMode } }
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        if (oldVideoTrack) localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack);

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        setFacingMode(nextFacingMode);
        if (nextFacingMode === 'environment') {
          setIsMirrored(false);
        }
      }
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  };

  const toggleSpeaker = async () => {
    const el = remoteAudioRef.current || remoteVideoRef.current;
    if (!el) return;
    if (typeof el.setSinkId === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        if (audioOutputs.length > 1) {
          const currentId = el.sinkId;
          const nextIndex = (audioOutputs.findIndex(d => d.deviceId === currentId) + 1) % audioOutputs.length;
          await el.setSinkId(audioOutputs[nextIndex].deviceId);
          setIsSpeakerOn(!isSpeakerOn);
        }
      } catch (err) {}
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${seconds}`;
  };

  return (
    <div className={`call-overlay-modern ${callType === 'video' ? 'video-active' : 'audio-active'}`}>
      {/* Background Remote Media */}
      {callType === 'video' ? (
        <div className="call-video-viewport">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            webkit-playsinline="true"
            className="remote-full-video"
          />

          {/* Floating Picture-in-Picture Local Video */}
          <div 
            className={`local-pip-container ${isVideoOff ? 'video-muted' : ''}`}
            onClick={() => setIsMirrored(prev => !prev)}
            title="Tap to toggle mirror view"
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              webkit-playsinline="true"
              muted 
              className={`local-pip-video ${isMirrored ? 'mirrored' : ''}`}
              style={{ display: isVideoOff ? 'none' : 'block' }}
            />
            {isVideoOff && (
              <div className="local-pip-disabled">
                <VideoOff size={22} color="#94a3b8" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="local-pip-badge">You</div>
          </div>
        </div>
      ) : (
        <div className="call-audio-ambient-backdrop">
          <div className="ambient-orb orb-1" />
          <div className="ambient-orb orb-2" />
        </div>
      )}

      {/* Hidden robust remote audio element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Floating Info Island */}
      <div className="call-top-island">
        <div className="call-top-content">
          <div className="call-top-avatar">
            <Avatar userId={otherUser?.id || otherUser?._id} username={otherUser?.username} size={38} />
          </div>
          <div className="call-top-meta">
            <div className="call-top-name">{otherUser?.username || 'Xorachat User'}</div>
            <div className="call-top-status">
              {callState === 'outgoing' && <span className="status-badge calling">Calling...</span>}
              {callState === 'incoming' && <span className="status-badge incoming">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</span>}
              {callState === 'connected' && (
                <span className="status-badge connected">
                  <span className="live-pulse-dot" /> {formatTime(duration)}
                </span>
              )}
            </div>
          </div>
          <div className="call-top-chip">
            <ShieldCheck size={14} color="#22c55e" />
            <span>{callType === 'video' ? 'HD Video' : 'HD Voice'}</span>
          </div>
        </div>
      </div>

      {/* Center Body for Audio & Calling States */}
      {(!callType || callType !== 'video' || callState !== 'connected') && (
        <div className="call-center-stage">
          <div className="call-avatar-stage">
            <div className={`avatar-aura-ring ${callState === 'incoming' || callState === 'outgoing' ? 'pulsing-ring' : 'steady-ring'}`}>
              <div className="aura-wave wave-1" />
              <div className="aura-wave wave-2" />
              <div className="aura-wave wave-3" />
              <div className="avatar-core-circle">
                <Avatar userId={otherUser?.id || otherUser?._id} username={otherUser?.username} size={110} />
              </div>
            </div>
          </div>

          <h2 className="call-recipient-name">{otherUser?.username || 'User'}</h2>
          
          <div className="call-subtitle-indicator">
            {callState === 'outgoing' && 'Waiting for response...'}
            {callState === 'incoming' && 'Xorachat Call Request'}
            {callState === 'connected' && `Call in progress • ${formatTime(duration)}`}
          </div>

          {audioFailed && (
            <button 
              className="audio-unlock-btn"
              onClick={() => {
                remoteAudioRef.current?.play().then(() => setAudioFailed(false)).catch(console.error);
                if (remoteVideoRef.current) remoteVideoRef.current.play().catch(console.error);
              }}
            >
              <Volume2 size={16} /> Tap to Enable Audio
            </button>
          )}
        </div>
      )}

      {/* Bottom Floating Control Dock */}
      <div className="call-bottom-dock">
        {callState === 'incoming' ? (
          <div className="incoming-actions-row">
            <button 
              type="button"
              className="call-dock-btn accept-btn" 
              onClick={onAcceptCall} 
              title="Accept Call"
            >
              <Phone size={28} />
              <span className="btn-label">Accept</span>
            </button>

            <button 
              type="button"
              className="call-dock-btn decline-btn" 
              onClick={handleDecline} 
              title="Decline Call"
            >
              <PhoneOff size={28} />
              <span className="btn-label">Decline</span>
            </button>
          </div>
        ) : (
          <div className="connected-actions-row">
            {callState === 'connected' && (
              <>
                <button 
                  type="button"
                  className={`call-dock-btn icon-btn ${isMuted ? 'active-mute' : ''}`} 
                  onClick={toggleMute} 
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  <span className="dock-subtext">{isMuted ? "Muted" : "Mic"}</span>
                </button>
                
                {callType === 'video' && (
                  <>
                    <button 
                      type="button"
                      className={`call-dock-btn icon-btn ${isVideoOff ? 'active-mute' : ''}`} 
                      onClick={toggleVideo} 
                      title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                      {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                      <span className="dock-subtext">{isVideoOff ? "Off" : "Cam"}</span>
                    </button>

                    <button 
                      type="button"
                      className="call-dock-btn icon-btn" 
                      onClick={switchCamera} 
                      title={`Flip Camera (${facingMode === 'user' ? 'Front' : 'Back'})`}
                    >
                      <SwitchCamera size={22} />
                      <span className="dock-subtext">Flip</span>
                    </button>

                    <button 
                      type="button"
                      className={`call-dock-btn icon-btn ${isMirrored ? 'active-tint' : ''}`} 
                      onClick={() => setIsMirrored(prev => !prev)} 
                      title="Toggle Mirror"
                    >
                      <FlipHorizontal size={22} />
                      <span className="dock-subtext">Mirror</span>
                    </button>
                  </>
                )}

                {callType !== 'video' && (
                  <button 
                    type="button"
                    className={`call-dock-btn icon-btn ${isSpeakerOn ? 'active-tint' : ''}`} 
                    onClick={toggleSpeaker} 
                    title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                  >
                    {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                    <span className="dock-subtext">Speaker</span>
                  </button>
                )}
              </>
            )}

            {/* End / Cancel Call Button */}
            <button 
              type="button"
              className="call-dock-btn hangup-pill" 
              onClick={handleHangUp} 
              title={callState === 'connected' ? "End Call" : "Cancel Call"}
            >
              <PhoneOff size={26} />
              <span className="btn-label">{callState === 'connected' ? "End" : "Cancel"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
