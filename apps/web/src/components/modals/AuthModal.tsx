import React, { useState, useEffect, useRef } from 'react';
import { X, User, Lock, Mail, Globe, Zap, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(authModalMode === 'login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('US');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLogin(authModalMode === 'login');
  }, [authModalMode]);

  // Load Google Client Config and GIS script
  useEffect(() => {
    if (!isAuthModalOpen) return;

    api.getGoogleConfig()
      .then((cfg) => {
        if (cfg.clientId) {
          setGoogleClientId(cfg.clientId);

          // Load Google Identity Services script if not already present
          if (!window.google && !document.getElementById('google-client-script')) {
            const script = document.createElement('script');
            script.id = 'google-client-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => initializeGoogleSignIn(cfg.clientId!);
            document.body.appendChild(script);
          } else if (window.google) {
            initializeGoogleSignIn(cfg.clientId);
          }
        }
      })
      .catch(() => {});
  }, [isAuthModalOpen]);

  const initializeGoogleSignIn = (clientId: string) => {
    if (!window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'pill',
          width: 320,
        });
      }
    } catch (e) {
      console.warn('Google Identity Services initialization notice:', e);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setIsGoogleLoading(true);
    setError(null);

    try {
      const res = await api.googleLogin({ credential: response.credential });
      setAuth(res.token, res.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleManualGoogleClick = () => {
    if (googleClientId && window.google) {
      try {
        window.google.accounts.id.prompt();
      } catch {
        triggerOAuthRedirect();
      }
    } else if (googleClientId) {
      triggerOAuthRedirect();
    } else {
      setShowGoogleSetup((prev) => !prev);
    }
  };

  const triggerOAuthRedirect = () => {
    if (!googleClientId) return;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
    window.location.href = oauthUrl;
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ usernameOrEmail: username, password });
        setAuth(res.token, res.user);
        closeAuthModal();
      } else {
        const res = await api.register({ username, email, password, country });
        setAuth(res.token, res.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.guest();
      setAuth(res.token, res.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Guest session initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (u: string, p: string) => {
    setIsLogin(true);
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#262522] border border-[#3c3934] rounded-2xl p-6 shadow-chess-lg max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#312e2b] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-[#312e2b] mb-5">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              isLogin ? 'border-[#81b64c] text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              !isLogin ? 'border-[#81b64c] text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Continue with Google Official Button */}
        <div className="space-y-3 mb-4">
          <div ref={googleButtonRef} className="flex justify-center" />

          <button
            type="button"
            onClick={handleManualGoogleClick}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 bg-[#1e1d1a] hover:bg-[#2c2a26] text-white font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-3 transition-all shadow-sm"
          >
            {/* Official Google Multicolor SVG Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="flex-1 text-center">
              {isGoogleLoading
                ? 'Connecting to Google...'
                : `${isLogin ? 'Log in' : 'Sign up'} with Google`}
            </span>
            {!googleClientId && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                Setup Info
              </span>
            )}
          </button>

          {/* Expandable Google OAuth Setup Guide */}
          {!googleClientId && showGoogleSetup && (
            <div className="p-3 bg-[#1e1d1a] border border-amber-500/30 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Google OAuth 2.0 Setup (100% Free - $0)
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                NeoChess uses standard Google Identity Services (GIS). To enable live one-click login:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-gray-300 text-[11px]">
                <li>
                  Go to{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 underline hover:text-sky-300 font-medium"
                  >
                    Google Cloud Console
                  </a>.
                </li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                <li>
                  Add Authorized JS origin:{' '}
                  <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px]">
                    {window.location.origin}
                  </code>
                </li>
                <li>
                  Add to your project <code className="bg-black/50 px-1 rounded font-mono text-[10px]">.env</code>:
                  <div className="mt-1 bg-black/60 p-1.5 rounded font-mono text-[10px] text-amber-300 break-all select-all">
                    GOOGLE_CLIENT_ID=&quot;your-client-id.apps.googleusercontent.com&quot;
                  </div>
                </li>
              </ol>
              <div className="text-[10px] text-gray-400 pt-1">
                See <span className="text-gray-200 font-mono">.env.example</span> for complete documentation.
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[#312e2b]" />
          <span className="absolute bg-[#262522] px-2 text-[10px] text-gray-400 uppercase tracking-wider">
            Or with Username
          </span>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mb-4 p-3 bg-[#1e1d1a] rounded-xl border border-[#312e2b]">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#81b64c]" /> Quick Demo Accounts:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin', 'AdminPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-amber-400 font-semibold rounded border border-[#3c3934] transition-all truncate text-[11px]"
            >
              Admin GM
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('magnus_test', 'ChessPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-sky-400 font-semibold rounded border border-[#3c3934] transition-all truncate text-[11px]"
            >
              Magnus
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('alex_club', 'ChessPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-emerald-400 font-semibold rounded border border-[#3c3934] transition-all truncate text-[11px]"
            >
              Alex (Club)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? 'admin or email' : 'Choose username'}
                required
                className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c] transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c] transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Country</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="US, NO, GB, etc."
                  maxLength={3}
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c] transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-xs rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{isLogin ? 'Log In' : 'Create Free Account'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="w-full border-t border-[#312e2b]" />
          <span className="absolute bg-[#262522] px-2 text-[10px] text-gray-400 uppercase tracking-wider">
            Or
          </span>
        </div>

        {/* Instant Guest Play Button */}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-2 px-4 bg-[#1e1d1a] hover:bg-[#2e2c28] text-gray-200 font-semibold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
        >
          <Zap size={14} className="text-amber-400" />
          <span>Play Instantly as Guest</span>
        </button>
      </div>
    </div>
  );
};
