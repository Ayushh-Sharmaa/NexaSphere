import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/auth';
import { adminPath } from '../utils/adminBasePath';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await auth.login(email, password);
      if (result.requiresTwoFactor || result.requiresTwoFactorSetup) {
        setTwoFactor(result);
        setVerificationCode('');
        return;
      }
      navigate(adminPath('/dashboard'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (twoFactor.requiresTwoFactorSetup) {
        await auth.verifyTwoFactorSetup(twoFactor.setupToken, verificationCode);
      } else {
        await auth.verifyTwoFactor(twoFactor.challengeToken, verificationCode);
      }
      navigate(adminPath('/dashboard/security'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="brand-dot lg" />
        </div>
        <h1 className="login-title">NexaSphere Admin</h1>
        <p className="login-sub">GL Bajaj Group of Institutions</p>
        {twoFactor ? (
          <form onSubmit={handleTwoFactorSubmit} className="form">
            {twoFactor.requiresTwoFactorSetup && (
              <div className="two-factor-setup">
                <img src={twoFactor.qrCodeDataUrl} alt="Authenticator QR code" />
                <div className="backup-codes" aria-label="Backup codes">
                  {twoFactor.backupCodes?.map((code) => (
                    <code key={code}>{code}</code>
                  ))}
                </div>
              </div>
            )}
            {twoFactor.suspicious && (
              <div className="form-error">Additional verification required for this login.</div>
            )}
            <div className="form-row">
              <label>Authenticator code</label>
              <input
                type="text"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                required
                autoFocus
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify and continue'}
            </button>
            <button
              type="button"
              className="btn-secondary full-width"
              onClick={() => setTwoFactor(null)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexasphere.in"
                required
                autoFocus
              />
            </div>
            <div className="form-row">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--t3)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
