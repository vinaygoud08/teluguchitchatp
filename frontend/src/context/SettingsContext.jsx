import React, { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const MESSAGE_SOUNDS = [
  { id: 'pop', name: 'Modern Pop' },
  { id: 'chime', name: 'Glass Chime' },
  { id: 'beep', name: 'Crisp Beep' },
  { id: 'bubble', name: 'Water Bubble' },
  { id: 'arcade', name: 'Retro Ping' },
  { id: 'none', name: 'None (Silent)' }
];

export const CALL_SOUNDS = [
  { id: 'classic', name: 'Classic Phone' },
  { id: 'marimba', name: 'Marimba Melody' },
  { id: 'digital', name: 'Digital Pulse' },
  { id: 'soft', name: 'Soft Ambient' },
  { id: 'none', name: 'None (Silent)' }
];

// Helper to synthesize sounds using Web Audio API
const synthesizeSound = (type, soundName, volumeLevel = 80) => {
  if (soundName === 'none' || volumeLevel <= 0) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    const normalizedVol = Math.max(0, Math.min(1, volumeLevel / 100));
    masterGain.gain.setValueAtTime(normalizedVol * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'messages') {
      const tone = soundName || 'pop';
      if (tone === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (tone === 'chime') {
        [880, 1318.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.7, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.36);
        });
      } else if (tone === 'beep') {
        [1046.5, 1318.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.6, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.1);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.11);
        });
      } else if (tone === 'bubble') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (tone === 'arcade') {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.3, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.09);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.1);
        });
      }
    } else if (type === 'calls') {
      const tone = soundName || 'classic';
      if (tone === 'classic') {
        // Dual-tone telephone pulse
        [0, 0.4].forEach(offset => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now + offset);
          osc2.frequency.setValueAtTime(480, now + offset);
          gain.gain.setValueAtTime(0.4, now + offset);
          gain.gain.setValueAtTime(0.4, now + offset + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.3);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);
          osc1.start(now + offset);
          osc2.start(now + offset);
          osc1.stop(now + offset + 0.31);
          osc2.stop(now + offset + 0.31);
        });
      } else if (tone === 'marimba') {
        // Pentatonic sequence
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.7, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.26);
        });
      } else if (tone === 'digital') {
        // Electronic rapid pulses
        [0, 0.08, 0.16, 0.24].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 980 : 1300, now + offset);
          gain.gain.setValueAtTime(0.5, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + offset);
          osc.stop(now + offset + 0.07);
        });
      } else if (tone === 'soft') {
        // Warm ambient ring
        const chord = [523.25, 659.25, 783.99];
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.72);
        });
      }
    } else if (type === 'randomChat') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.6, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.31);
      });
    }

    // Auto close context after sound ends
    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {}
    }, 1500);
  } catch (err) {
    console.error('Synthesize sound error:', err);
  }
};

export const SettingsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('appSettings_notifications');
      return saved ? JSON.parse(saved) : {
        messages: true,
        calls: true,
        randomChat: true,
        messageSound: 'pop',
        callSound: 'classic',
        soundVolume: 80
      };
    } catch (e) {
      return {
        messages: true,
        calls: true,
        randomChat: true,
        messageSound: 'pop',
        callSound: 'classic',
        soundVolume: 80
      };
    }
  });

  const [chatSettings, setChatSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('appSettings_chats');
      return saved ? JSON.parse(saved) : {
        enterToSend: true,
        mediaAutoDownload: true
      };
    } catch (e) {
      return {
        enterToSend: true,
        mediaAutoDownload: true
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('appSettings_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('appSettings_chats', JSON.stringify(chatSettings));
  }, [chatSettings]);

  const updateNotificationSetting = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const updateChatSetting = (key, value) => {
    setChatSettings(prev => ({ ...prev, [key]: value }));
  };

  const playNotificationSound = (type) => {
    if (!notifications[type]) return;
    
    const soundChoice = type === 'messages' 
      ? (notifications.messageSound || 'pop')
      : type === 'calls'
      ? (notifications.callSound || 'classic')
      : 'celebration';

    const volume = typeof notifications.soundVolume === 'number' ? notifications.soundVolume : 80;
    synthesizeSound(type, soundChoice, volume);
  };

  const testNotificationSound = (type, soundChoice, volumeLevel) => {
    const vol = typeof volumeLevel === 'number' ? volumeLevel : (notifications.soundVolume || 80);
    const sound = soundChoice || (type === 'messages' ? notifications.messageSound : notifications.callSound);
    synthesizeSound(type, sound, vol);
  };

  return (
    <SettingsContext.Provider value={{ 
      notifications, 
      updateNotificationSetting, 
      playNotificationSound,
      testNotificationSound,
      chatSettings,
      updateChatSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
