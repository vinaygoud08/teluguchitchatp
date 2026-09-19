import React from 'react';
import { useSettings, MESSAGE_SOUNDS, CALL_SOUNDS } from '../context/SettingsContext';
import { Volume2, Play, Bell, Phone, Radio, HelpCircle } from 'lucide-react';
import './SettingsMenu.css';

function NotificationsMenu({ onClose }) {
  const { notifications, updateNotificationSetting, testNotificationSound } = useSettings();

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support system notifications.");
      return;
    }
    
    if (Notification.permission === 'granted') {
      alert("Notifications are already enabled on this device!");
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert("Notifications successfully enabled!");
      } else {
        alert("Notification permission denied. Please allow it in your browser settings.");
      }
    } else {
      alert("Notifications are currently blocked. Please tap the lock icon in your browser's address bar (or go to site settings) and allow notifications.");
    }
  };

  const currentVolume = typeof notifications.soundVolume === 'number' ? notifications.soundVolume : 80;
  const currentMsgSound = notifications.messageSound || 'pop';
  const currentCallSound = notifications.callSound || 'classic';

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <button className="settings-back-btn" onClick={onClose} title="Back">
            ←
          </button>
          <h2 className="settings-title">Notifications & Sounds</h2>
        </div>

        <div className="settings-list">
          {/* Master Volume */}
          <div className="settings-group">
            <div className="settings-group-title">Notification Volume</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Volume2 size={18} color="#7c6ff7" /> Alert Volume
                    </div>
                    <div className="settings-item-subtitle">Adjust loudness for all alerts and ringtones</div>
                  </div>
                </div>
                <div className="volume-slider-container">
                  <div className="volume-slider-row">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={currentVolume} 
                      onChange={(e) => updateNotificationSetting('soundVolume', parseInt(e.target.value, 10))}
                      className="volume-slider"
                    />
                    <span className="volume-label">{currentVolume}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Notifications */}
          <div className="settings-group">
            <div className="settings-group-title">Message Notifications</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bell size={18} color="#25d366" /> Message Sounds
                    </div>
                    <div className="settings-item-subtitle">Play audio alert when new messages arrive</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="settings-toggle" 
                    checked={notifications.messages !== false} 
                    onChange={(e) => updateNotificationSetting('messages', e.target.checked)} 
                  />
                </div>

                {notifications.messages !== false && (
                  <div className="settings-sound-controls">
                    <select 
                      className="settings-select"
                      value={currentMsgSound}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateNotificationSetting('messageSound', val);
                        testNotificationSound('messages', val, currentVolume);
                      }}
                    >
                      {MESSAGE_SOUNDS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="sound-play-btn"
                      onClick={() => testNotificationSound('messages', currentMsgSound, currentVolume)}
                      title="Test message sound"
                    >
                      <Play size={13} fill="currentColor" /> Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calls Notifications */}
          <div className="settings-group">
            <div className="settings-group-title">Call Ringtones</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={18} color="#00c9a7" /> Incoming & Outgoing Calls
                    </div>
                    <div className="settings-item-subtitle">Play ringtone on voice and video calls</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="settings-toggle" 
                    checked={notifications.calls !== false} 
                    onChange={(e) => updateNotificationSetting('calls', e.target.checked)} 
                  />
                </div>

                {notifications.calls !== false && (
                  <div className="settings-sound-controls">
                    <select 
                      className="settings-select"
                      value={currentCallSound}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateNotificationSetting('callSound', val);
                        testNotificationSound('calls', val, currentVolume);
                      }}
                    >
                      {CALL_SOUNDS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="sound-play-btn"
                      onClick={() => testNotificationSound('calls', currentCallSound, currentVolume)}
                      title="Test call ringtone"
                    >
                      <Play size={13} fill="currentColor" /> Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match & Events */}
          <div className="settings-group">
            <div className="settings-group-title">Other Alerts</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Radio size={18} color="#ec4899" /> Random Chat Match
                    </div>
                    <div className="settings-item-subtitle">Play sound when matched with a stranger</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="settings-toggle" 
                    checked={notifications.randomChat !== false} 
                    onChange={(e) => updateNotificationSetting('randomChat', e.target.checked)} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting */}
          <div className="settings-group">
            <div className="settings-group-box">
              <div className="settings-group-item" onClick={handleRequestPermission} style={{ cursor: 'pointer' }}>
                <div className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HelpCircle size={18} color="#f59e0b" /> Notification Permissions
                </div>
                <div className="settings-item-subtitle" style={{ lineHeight: '1.4', marginTop: '6px' }}>
                  Click here to request or verify browser system notification permissions for Xorachat.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsMenu;
