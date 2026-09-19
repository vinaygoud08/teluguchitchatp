import React from 'react';

const WelcomeScreen = ({ onSignUp, onLogin }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo.png"
            alt="Xorachat"
            style={{
              width: '180px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 24px rgba(139, 92, 246, 0.45))'
            }}
          />
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
          Free voice & video calls
        </h2>
        <p className="warning-text" style={{ marginBottom: '32px', fontSize: '0.95rem' }}>
          Join Xorachat to connect with friends and the community.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn-primary" onClick={onSignUp} style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}>
            Sign up
          </button>
          
          <button className="btn-cancel" onClick={onLogin} style={{ width: '100%', padding: '14px', fontSize: '1.05rem', background: 'var(--neutral-100)', color: 'var(--neutral-800)', borderRadius: 'var(--radius-md)' }}>
            Log in
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
          By continuing, you agree to the Terms and acknowledge the Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
