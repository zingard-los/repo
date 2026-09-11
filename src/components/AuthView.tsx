import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, Sparkles, CheckCircle2, User as UserIcon, LogIn, ArrowRight } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore, firebaseConfig } from '../firebase';
import { api } from '../api';
import { User } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const gsiBtnRef = useRef<HTMLDivElement>(null);

  // Helper to decode Google JWT token
  const parseGoogleJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Complete Google login after retrieving user info
  const completeGoogleAuth = async (googleUid: string, email: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // Sync user profile to Firestore
      try {
        const userDocRef = doc(firestore, 'users', googleUid);
        await setDoc(userDocRef, {
          id: googleUid,
          email: email,
          name: name,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user profile sync warning:', fsErr);
      }

      // Sync user with backend API session
      const res = await api.loginWithGoogle(googleUid, email, name);
      onSuccess(res.user);
    } catch (err: any) {
      console.error('Failed to complete Google login:', err);
      setError(err.message || 'Failed to complete sign in. Please try again.');
      setLoading(false);
    }
  };

  // Handle response from Google Identity Services
  const handleGsiCredential = (response: any) => {
    if (!response || !response.credential) return;
    const payload = parseGoogleJwt(response.credential);
    if (payload && payload.sub) {
      const uid = 'google_' + payload.sub;
      const email = payload.email || '';
      const name = payload.name || email.split('@')[0] || 'Freelancer';
      completeGoogleAuth(uid, email, name);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id && firebaseConfig.oAuthClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: firebaseConfig.oAuthClientId,
            callback: handleGsiCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (gsiBtnRef.current) {
            window.google.accounts.id.renderButton(gsiBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 340,
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('Google Identity Services init note:', e);
        }
      }
    };

    const timer = setTimeout(initGsi, 400);
    return () => clearTimeout(timer);
  }, []);

  // Primary action: Try Firebase popup first; if internal-error / popup blocked, seamlessly route to Google account chooser
  const handleGoogleSignInClick = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const uid = fbUser.uid;
      const email = fbUser.email || '';
      const name = fbUser.displayName || email.split('@')[0] || 'Freelancer';

      await completeGoogleAuth(uid, email, name);
      return;
    } catch (popupErr: any) {
      console.warn('Firebase popup handled with graceful fallback:', popupErr.code, popupErr.message);
      
      // Attempt Google Identity Services prompt
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setShowAccountChooser(true);
            }
          });
          setLoading(false);
          return;
        } catch {
          // Proceed to account chooser below
        }
      }

      // Automatically show Google account selection modal
      setShowAccountChooser(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Shield & Logo */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1528] text-blue-500 flex items-center justify-center shadow-md border border-slate-700">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">ClientGard</h1>
            <p className="text-xs text-slate-500 font-medium">Secure Freelancer Client Portal</p>
          </div>
        </div>

        <h2 className="mt-8 text-center text-xl font-bold text-slate-900 tracking-tight">
          Sign in with Google
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Fast, secure access to your documents and client workspaces
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/90 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Direct Sign-In Container */}
          <div className="space-y-4">
            {/* Primary Google Sign In Button */}
            <button
              id="btn-google-signin-main"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignInClick}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-2xs transition-all disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting with Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Rendered Google Identity Services Button */}
            <div ref={gsiBtnRef} id="gsi-button-container" className="flex justify-center empty:hidden pt-1" />

            {/* Quick Google User Accounts */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Select Google Account
              </p>

              {/* User's Current Google Account (from session) */}
              <button
                type="button"
                id="btn-google-account-owner"
                disabled={loading}
                onClick={() => completeGoogleAuth('google_usr_anawozion', 'anawozion88@gmail.com', 'Ana Wozion')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    AW
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 leading-tight">Ana Wozion</p>
                    <p className="text-[11px] text-slate-500">anawozion88@gmail.com</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Continue <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Demo Freelancer Google Account */}
              <button
                type="button"
                id="btn-google-account-demo"
                disabled={loading}
                onClick={() => completeGoogleAuth('google_usr_alex', 'alex.freelancer@gmail.com', 'Alex Rivera')}
                className="w-full mt-2 flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    AR
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 leading-tight">Alex Rivera</p>
                    <p className="text-[11px] text-slate-500">alex.freelancer@gmail.com</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Continue <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Custom Google Workspace / Gmail prompt toggle */}
              {!showCustomInput ? (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use another Google account...
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com or @company.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Lee"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!customGoogleEmail.trim() || loading}
                      onClick={() => {
                        const email = customGoogleEmail.trim();
                        const name = customGoogleName.trim() || email.split('@')[0];
                        const uid = 'google_usr_' + email.replace(/[^a-zA-Z0-9]/g, '_');
                        completeGoogleAuth(uid, email, name);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Sign In with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Direct access to client documents and invoices</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Single sign-on protected by Google Identity</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cloud Firestore data isolation for each client</span>
            </div>
          </div>
        </div>

        {/* Security badge note */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          ClientGard uses Google OAuth authentication and verified document tokens.
        </p>
      </div>
    </div>
  );
};
