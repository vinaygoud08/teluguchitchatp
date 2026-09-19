import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, Copy, Check, Share2, Sparkles, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import './SettingsMenu.css';

function InviteModal({ onClose }) {
  const { user, token } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [copied, setCopied] = useState(false);

  const senderName = user?.username || 'A friend';
  const siteUrl = window.location.origin;
  const inviteLink = `${siteUrl}/register?ref=${encodeURIComponent(senderName)}`;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const res = await axios.post('/api/users/invite', {
        email: email.trim(),
        senderName
      }, config);

      if (res.data?.success) {
        setStatus({
          type: 'success',
          message: `🎉 Invitation sent to ${email.trim()}! They will receive an email with instructions to create an ID and start chatting for free.`
        });
        setEmail('');
      } else {
        setStatus({
          type: 'error',
          message: res.data?.msg || 'Failed to send invitation. Please try again.'
        });
      }
    } catch (err) {
      console.error("Invite error:", err);
      setStatus({
        type: 'error',
        message: err.response?.data?.msg || 'Failed to send invitation email. Please check the address.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(inviteLink);
    } else {
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `Hey! Join me on Xorachat — chat, voice & video call for free with encrypted messaging! Sign up here: ${inviteLink}`;

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleEmailClientShare = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(`${senderName} invited you to Xorachat!`)}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailto;
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content invite-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="settings-header">
          <button className="settings-back-btn" onClick={onClose} title="Back">
            ←
          </button>
          <h2 className="settings-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#818cf8" /> Invite a Friend
          </h2>
        </div>

        <div className="settings-list" style={{ padding: '4px 0' }}>
          {/* Hero Banner */}
          <div className="invite-hero-card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>💌 ✨</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>
              Invite Friends to Xorachat
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Send an email invitation to your friend. They'll receive a notification link to create a free ID and start chatting & calling with you immediately!
            </p>
          </div>

          {/* Email Invite Form */}
          <div className="settings-group">
            <div className="settings-group-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={15} color="#818cf8" /> Send Email Invitation
            </div>
            <div className="settings-group-box" style={{ padding: '16px' }}>
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: '600' }}>
                    Friend's Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="settings-text-input"
                      placeholder="e.g. friend@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '10px',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {status && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    background: status.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: status.type === 'success' ? '#4ade80' : '#f87171'
                  }}>
                    {status.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
                    <span>{status.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={16} />
                  {loading ? 'Sending Email Notification...' : 'Send Invitation Email'}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Share / Direct Link */}
          <div className="settings-group" style={{ marginTop: '16px' }}>
            <div className="settings-group-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={15} color="#38bdf8" /> Or Share Direct Invite Link
            </div>
            <div className="settings-group-box" style={{ padding: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '12px'
              }}>
                <span style={{
                  flex: 1,
                  fontSize: '0.82rem',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {inviteLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: copied ? '#22c55e' : 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: copied ? '#ffffff' : '#a5b4fc',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Share buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    color: '#25d366',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleEmailClientShare}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✉️ Email App
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
