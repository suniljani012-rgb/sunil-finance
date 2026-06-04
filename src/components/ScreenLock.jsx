import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Lock, ShieldAlert, Check } from 'lucide-react';

export const ScreenLock = ({ user, onUnlock, forceSetup = false }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(forceSetup || !localStorage.getItem('app_lock_pin'));
  const [setupStep, setSetupStep] = useState(1); // 1 = enter pin, 2 = confirm pin
  const [tempPin, setTempPin] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(!!localStorage.getItem('biometric_credential_id'));

  useEffect(() => {
    // Check if platform biometrics are supported
    const checkBiometrics = async () => {
      if (window.PublicKeyCredential && 
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricsAvailable(available);
        } catch (e) {
          console.error("Biometrics check failed", e);
        }
      }
    };
    checkBiometrics();

    // Auto-trigger biometrics if already enrolled and not in setup mode
    if (!isSetupMode && localStorage.getItem('biometric_credential_id')) {
      handleBiometricUnlock();
    }
  }, [isSetupMode]);

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        // Auto submit
        setTimeout(() => handlePinSubmit(newPin), 250);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handlePinSubmit = (enteredPin) => {
    if (isSetupMode) {
      if (setupStep === 1) {
        setTempPin(enteredPin);
        setPin('');
        setSetupStep(2);
      } else {
        if (enteredPin === tempPin) {
          localStorage.setItem('app_lock_pin', enteredPin);
          localStorage.setItem('app_lock_enabled', 'true');
          
          // Ask if they want to enroll biometrics if available
          if (biometricsAvailable) {
            enrollBiometrics(enteredPin);
          } else {
            setIsSetupMode(false);
            if (onUnlock) onUnlock();
          }
        } else {
          setError('PINs do not match. Restarting...');
          setPin('');
          setSetupStep(1);
          setTempPin('');
        }
      }
    } else {
      const savedPin = localStorage.getItem('app_lock_pin');
      if (enteredPin === savedPin) {
        if (onUnlock) onUnlock();
      } else {
        setError('Incorrect security PIN. Please try again.');
        setPin('');
      }
    }
  };

  const enrollBiometrics = async (enteredPin) => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "FinAura Finance" },
          user: {
            id: userId,
            name: user.email,
            displayName: user.username
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 30000
        }
      });
      
      if (credential) {
        const rawId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
        localStorage.setItem('biometric_credential_id', rawId);
        setBiometricsEnrolled(true);
        setError('Biometrics (FaceID/Fingerprint) enrolled successfully!');
        setTimeout(() => {
          setIsSetupMode(false);
          if (onUnlock) onUnlock();
        }, 1500);
      }
    } catch (e) {
      console.warn("Biometrics enrollment failed/cancelled", e);
      // Fail gracefully and complete PIN setup
      setIsSetupMode(false);
      if (onUnlock) onUnlock();
    }
  };

  const handleBiometricUnlock = async () => {
    const rawIdBase64 = localStorage.getItem('biometric_credential_id');
    if (!rawIdBase64) return;
    
    try {
      setError('Verifying biometrics...');
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const rawId = Uint8Array.from(atob(rawIdBase64), c => c.charCodeAt(0));
      
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: rawId,
            type: 'public-key'
          }],
          userVerification: "required",
          timeout: 30000
        }
      });
      
      if (assertion) {
        setError('');
        if (onUnlock) onUnlock();
      }
    } catch (e) {
      console.error("Biometric verification failed", e);
      setError('Biometric authentication failed. Enter PIN instead.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(30px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, color: '#fff', userSelect: 'none'
    }}>
      <div style={{
        width: '100%', maxWidth: '360px', padding: '24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '24px', textAlign: 'center'
      }}>
        {/* Title / Icon */}
        <div>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.1)',
            border: '1px solid rgba(10, 132, 255, 0.2)', display: 'flex', alignItems: 'center',
            justify: 'center', marginBottom: '16px', color: 'rgb(var(--apple-blue))', margin: '0 auto 16px auto'
          }}>
            <Lock size={28} style={{ margin: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>
            {isSetupMode ? 'Create App Lock' : 'App Locked'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isSetupMode 
              ? (setupStep === 1 ? 'Set a 4-digit security PIN' : 'Confirm your 4-digit security PIN')
              : 'Enter PIN to unlock your vault'}
          </p>
        </div>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', gap: '16px', margin: '12px 0' }}>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: pin.length > index ? 'rgb(var(--apple-blue))' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid',
              borderColor: pin.length > index ? 'rgb(var(--apple-blue))' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: pin.length > index ? '0 0 10px rgba(10, 132, 255, 0.5)' : 'none',
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          ))}
        </div>

        {/* Status / Errors */}
        {error && (
          <div style={{
            fontSize: '13px', 
            color: error.includes('Incorrect') || error.includes('not match') ? 'rgb(var(--apple-red))' : 'rgb(var(--apple-green))',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {error.includes('Incorrect') || error.includes('not match') ? <ShieldAlert size={14} /> : <Check size={14} />}
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px', width: '100%',
          marginTop: '16px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => handleKeyPress(num.toString())} style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff', fontSize: '24px', fontWeight: '500', cursor: 'pointer',
              outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', transition: 'background 0.1s'
            }} onMouseDown={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
               onMouseUp={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}>
              {num}
            </button>
          ))}
          
          {/* Bottom Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isSetupMode && biometricsEnrolled && (
              <button onClick={handleBiometricUnlock} style={{
                background: 'none', border: 'none', color: 'rgb(var(--apple-blue))',
                cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '4px'
              }}>
                <Fingerprint size={28} />
              </button>
            )}
          </div>
          
          <button onClick={() => handleKeyPress('0')} style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff', fontSize: '24px', fontWeight: '500', cursor: 'pointer',
            outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', transition: 'background 0.1s'
          }} onMouseDown={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
             onMouseUp={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}>
            0
          </button>
          
          <button onClick={handleDelete} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer', outline: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
};
