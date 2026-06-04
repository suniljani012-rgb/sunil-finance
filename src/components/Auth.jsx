import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Key, Eye, EyeOff, AlertTriangle, Smartphone } from 'lucide-react';

export const Auth = () => {
  const { login, verifyLoginOTP, register, verifyRegisterOTP } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  
  // Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [devOtp, setDevOtp] = useState(null); // Local dev fallback OTP

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setDevOtp(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Send login credentials
        const res = await login(email, password);
        setInfoMessage('A login verification OTP has been sent to your email.');
        if (res.mockOtp) {
          setDevOtp(res.mockOtp);
          setOtp(res.mockOtp); // Auto-fill for dev ease
        }
        setStep('otp');
      } else {
        // Register user
        const res = await register(username, email, password);
        setInfoMessage('An account verification OTP has been sent to your email.');
        if (res.mockOtp) {
          setDevOtp(res.mockOtp);
          setOtp(res.mockOtp); // Auto-fill for dev ease
        }
        setStep('otp');
      }
    } catch (err) {
      if (err.message.includes('not verified') || err.message.includes('unverified')) {
        // User registered but not verified
        setError('Your account is registered but not verified. Requesting new OTP...');
        try {
          const res = await register(username || 'User', email, password);
          setInfoMessage('A new verification OTP has been sent to your email.');
          if (res.mockOtp) {
            setDevOtp(res.mockOtp);
            setOtp(res.mockOtp);
          }
          setStep('otp');
        } catch (e2) {
          setError(e2.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await verifyLoginOTP(email, otp);
      } else {
        await verifyRegisterOTP(email, otp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setStep('credentials');
    setError('');
    setInfoMessage('');
    setDevOtp(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setOtp('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <img src="logo.png" alt="Logo" style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '50%' }} />
            <h1 style={{ fontSize: '24px', fontWeight: '800' }}>
              Sunil <span style={{ color: 'hsl(var(--accent-indigo))' }}>Fin</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 'otp' ? 'Enter verification code' : (isLogin ? 'Log in to your dashboard' : 'Create a new account')}
          </p>
        </div>

        {/* Error / Alert */}
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'hsl(var(--accent-rose))', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>Error:</div>
            <div>{error}</div>
          </div>
        )}

        {/* Info Message */}
        {infoMessage && !error && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'hsl(var(--accent-emerald))', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
            {infoMessage}
          </div>
        )}

        {/* Local Dev Mode OTP Notice */}
        {devOtp && (
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'hsl(var(--accent-amber))', padding: '14px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '4px' }}>
              <AlertTriangle size={16} /> Dev Mode OTP (Apps Script URL not set)
            </div>
            Use OTP: <strong style={{ letterSpacing: '2px', fontSize: '16px', color: '#fff' }}>{devOtp}</strong> (autofilled)
          </div>
        )}

        {step === 'credentials' ? (
          /* Credentials Form */
          <form onSubmit={handleCredentialsSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="input-field"
                    style={{ paddingLeft: '44px', width: '100%' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field"
                  style={{ paddingLeft: '44px', width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '44px', paddingRight: '44px', width: '100%' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              {loading ? 'Processing...' : (isLogin ? 'Send Login OTP' : 'Send Verification OTP')}
            </button>
          </form>
        ) : (
          /* OTP Entry Form */
          <form onSubmit={handleOtpSubmit}>
            <div className="input-group" style={{ textAlign: 'center' }}>
              <label className="input-label" style={{ marginBottom: '12px' }}>6-Digit Code</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  className="input-field"
                  style={{ paddingLeft: '44px', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              {loading ? 'Verifying...' : 'Verify OTP & Enter App'}
            </button>

            <button type="button" onClick={() => setStep('credentials')} className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }}>
              Back to Edit Email
            </button>
          </form>
        )}

        {/* Mode Switch Footer */}
        {step === 'credentials' && (
          <>
            <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={toggleAuthMode}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-indigo))', fontWeight: '700', cursor: 'pointer' }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
            
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <a
                href="/FinAura.apk"
                download="FinAura.apk"
                className="btn btn-secondary"
                style={{ 
                  background: 'rgba(48, 209, 88, 0.1)', 
                  color: 'rgb(var(--apple-green))', 
                  border: '1px solid rgba(48, 209, 88, 0.15)', 
                  width: '100%',
                  textDecoration: 'none',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Smartphone size={14} />
                <span>Download Native Android APK</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
