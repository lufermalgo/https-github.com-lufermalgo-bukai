
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { useAuth, useAgent } from '../lib/state';
import { HRAgent } from '../lib/presets/agents';
import { parseJwt } from '../lib/utils';
import SummanLogo from './SummanLogo';

// TODO: PASTE YOUR CLIENT ID HERE FROM GOOGLE CLOUD CONSOLE
const GOOGLE_CLIENT_ID = "36072227238-u72uom2ciaktets6q1rldcc2msv4m7io.apps.googleusercontent.com";

// Optional: Restrict to specific corporate domain
const ALLOWED_DOMAIN = ""; // e.g. "buk.cl", leave empty to allow any google account

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginScreen() {
  const { loginWithGoogle, loginAsAdmin } = useAuth();
  const { setCurrent } = useAgent();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminLogin && window.google && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'pill',
          width: 300
        });
      } catch (err) {
        console.error("Google Auth Initialization Error:", err);
        setError("Error initializing Google Sign-In");
      }
    }
  }, [isAdminLogin]);

  const handleGoogleCallback = (response: any) => {
    try {
      const payload = parseJwt(response.credential);
      
      // Domain Restriction Check
      if (ALLOWED_DOMAIN && payload.hd !== ALLOWED_DOMAIN) {
        setError(`Access restricted to ${ALLOWED_DOMAIN} accounts.`);
        return;
      }

      setCurrent(HRAgent);
      
      loginWithGoogle({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        hd: payload.hd
      });

    } catch (e) {
      console.error("Auth Error", e);
      setError("Authentication failed.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAsAdmin(password);
    if (success) {
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="logo-container">
           <div className="logo-pill login-mode">
             <SummanLogo 
               className="app-logo"
               style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
             />
           </div>
        </div>
        
        <h1>BukAI - Tú amigo virtual</h1>
        <p className="subtitle">Sistema inteligente que te acompaña</p>

        {!isAdminLogin ? (
          <div className="role-selection">
            <div className="google-container">
              <p className="instruction">Inicia sesión con tu cuenta corporativa</p>
              <div ref={googleBtnRef} className="google-btn-wrapper"></div>
              
              {error && <div className="error-box">
                <span className="icon">error</span>
                <p>{error}</p>
              </div>}
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <button className="role-button admin" onClick={() => setIsAdminLogin(true)}>
              <span className="icon">admin_panel_settings</span>
              <div className="text">
                <h3>HR Admin Access</h3>
                <p>Solo para el equipo de RRHH</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminLogin} className="admin-form">
            <button type="button" className="back-link" onClick={() => setIsAdminLogin(false)}>
              <span className="icon">arrow_back</span> Back
            </button>
            <h2>Admin Access</h2>
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="button primary">Login</button>
            <p className="hint">Hint: password is "admin123"</p>
          </form>
        )}
      </div>

      <style>{`
        .login-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--gray-900);
          color: white;
          padding: 20px;
          position: relative;
          flex-direction: column;
        }
        .login-card {
          background: var(--gray-800);
          padding: 40px;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border: 1px solid var(--gray-700);
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-container {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        .login-card h1 {
          margin-bottom: 10px;
          font-weight: 700;
        }
        .subtitle {
          color: var(--gray-500);
          margin-bottom: 40px;
        }
        .role-selection {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .google-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          background: var(--Neutral-10);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--gray-700);
        }
        .google-btn-wrapper {
          height: 44px; /* Prevent layout shift */
          min-width: 200px;
        }
        .instruction {
          font-size: 14px;
          color: var(--gray-300);
        }
        .divider {
          display: flex;
          align-items: center;
          color: var(--gray-600);
          font-size: 12px;
          margin: 10px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gray-700);
        }
        .divider span {
          padding: 0 10px;
        }
        .role-button {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 15px 20px;
          width: 100%;
          background: transparent;
          border: 1px solid var(--gray-700);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .role-button:hover {
          border-color: var(--gray-500);
          background: var(--Neutral-10);
        }
        .role-button .icon {
          font-size: 24px;
          color: var(--gray-500);
        }
        .role-button h3 {
          margin: 0 0 2px 0;
          font-size: 16px;
          color: var(--gray-300);
        }
        .role-button p {
          margin: 0;
          color: var(--gray-600);
          font-size: 12px;
        }
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          align-items: center;
          width: 100%;
        }
        .admin-form input {
          width: 100%;
          padding: 15px;
          background: var(--gray-900);
        }
        .back-link {
          align-self: flex-start;
          color: var(--gray-500);
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .back-link:hover {
          color: white;
        }
        .error-msg {
          color: var(--Red-500);
          font-size: 14px;
        }
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 70, 0, 0.1);
          border: 1px solid var(--Red-500);
          padding: 10px;
          border-radius: 8px;
          color: var(--Red-400);
          font-size: 13px;
          max-width: 100%;
        }
        .hint {
          font-size: 12px;
          color: var(--gray-600);
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
