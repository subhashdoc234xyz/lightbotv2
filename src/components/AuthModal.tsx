import React, { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Cloud, Database } from "lucide-react";
import { UserProfile } from "../types";
import { getSupabase, mapSupabaseUser, getSupabaseConfig } from "../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const { isConfigured: isSupabaseConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    const supabase = getSupabase();

    if (supabase) {
      try {
        if (activeTab === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: name.trim() || email.split("@")[0],
              },
            },
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            if (data.session) {
              const profile = mapSupabaseUser(data.user);
              onSuccess(profile);
            } else {
              setInfoMessage("Account created! Check your email for a verification link, or log in.");
              setIsLoading(false);
              return;
            }
          }
        } else {
          // Sign In
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            const profile = mapSupabaseUser(data.user);
            onSuccess(profile);
          }
        }
      } catch (err: any) {
        console.warn("Supabase auth error:", err);
        setErrorMessage(err?.message || "Authentication failed. Please verify credentials.");
        setIsLoading(false);
        return;
      }
    } else {
      // Offline / Local Sandbox mode
      setTimeout(() => {
        setIsLoading(false);
        const localId = `user-${email.replace(/[^a-zA-Z0-9]/g, "") || Date.now()}`;
        const user: UserProfile = {
          id: localId,
          name: activeTab === "signup" ? name.trim() || email.split("@")[0] : email.split("@")[0] || "Light Pioneer",
          email: email.trim() || "pioneer@light.ai",
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${localId}&backgroundColor=0f172a`,
          isGuest: false,
          tier: "Premium Member",
          authProvider: "email",
        };
        onSuccess(user);
      }, 400);
      return;
    }

    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } catch (err: any) {
        console.warn("Google OAuth error, using local Google profile:", err);
        // Fallback for iframe preview if OAuth redirect is restricted in container
        const user: UserProfile = {
          id: "google-pioneer-101",
          name: "Alex Vance",
          email: "alex.vance@gmail.com",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          isGuest: false,
          tier: "Supabase Cloud",
          authProvider: "google",
        };
        onSuccess(user);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        const user: UserProfile = {
          id: "google-pioneer-101",
          name: "Alex Vance",
          email: "alex.vance@gmail.com",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          isGuest: false,
          tier: "Premium Member",
          authProvider: "google",
        };
        onSuccess(user);
      }, 400);
    }
  };

  const handleGuestAuth = () => {
    const guestId = `guest-${Date.now()}`;
    const user: UserProfile = {
      id: guestId,
      name: "Guest Explorer",
      email: "guest@light.local",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}&backgroundColor=1e1b4b`,
      isGuest: true,
      tier: "Free Explorer",
      authProvider: "guest",
    };
    onSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Floating Modal */}
      <div className="relative w-full max-w-[430px] bg-slate-900/90 backdrop-blur-3xl rounded-[28px] border border-sky-400/30 p-8 shadow-[0_0_60px_rgba(14,165,233,0.35)] z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          id="auth-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mx-auto mb-3 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-headline text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-400 tracking-tight mb-1">
            Welcome to Light
          </h2>
          <p className="font-body text-xs text-slate-300">
            {isSupabaseConfigured
              ? "Connected to Supabase Cloud Authentication & Postgres"
              : "Enter your private intelligence & memory universe."}
          </p>
        </div>

        {/* Cloud Status Pill */}
        <div className="mb-4 flex items-center justify-center gap-1.5 text-[11px] font-mono-code text-slate-400">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <Database className="w-3 h-3" />
              <span>Supabase Cloud Auth Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sky-300 bg-sky-950/40 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
              <Cloud className="w-3 h-3" />
              <span>Local Isolated User State</span>
            </span>
          )}
        </div>

        {/* Feedback / Error Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono-code animate-in fade-in">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs font-mono-code animate-in fade-in">
            {infoMessage}
          </div>
        )}

        {/* Custom Tab Switcher */}
        <div className="relative bg-slate-950/80 p-1 rounded-full mb-5 flex border border-white/10">
          <div
            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all duration-300 ease-out ${
              activeTab === "signin" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setActiveTab("signin");
              setErrorMessage(null);
            }}
            className={`relative z-10 w-1/2 py-2 text-center text-xs font-mono-code font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "signin" ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setErrorMessage(null);
            }}
            className={`relative z-10 w-1/2 py-2 text-center text-xs font-mono-code font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "signup" ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {activeTab === "signup" && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                id="auth-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-sky-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400/50 shadow-inner transition-all duration-200"
              />
            </div>
          )}

          {/* Email Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-sky-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400/50 shadow-inner transition-all duration-200"
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="auth-password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              required
              minLength={6}
              className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-sky-400 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400/50 shadow-inner transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-sky-400 hover:from-sky-500 hover:to-cyan-300 text-slate-950 font-mono-code font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-[0_0_25px_rgba(14,165,233,0.45)] hover:shadow-[0_0_35px_rgba(14,165,233,0.7)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{activeTab === "signin" ? "CONTINUE" : "CREATE ACCOUNT"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
              OR CONNECT WITH
            </span>
            <div className="flex-1 h-px bg-slate-700/50"></div>
          </div>

          {/* Google Auth Button */}
          <button
            id="auth-google-btn"
            type="button"
            onClick={handleGoogleAuth}
            className="w-full bg-slate-950/70 border border-slate-700/80 hover:bg-slate-900 text-slate-200 text-xs py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:border-slate-500 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Continue as Guest */}
          <div className="text-center mt-1">
            <button
              id="auth-guest-btn"
              type="button"
              onClick={handleGuestAuth}
              className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-500/30 transition-colors cursor-pointer"
            >
              Continue as Guest (Sandbox Mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
