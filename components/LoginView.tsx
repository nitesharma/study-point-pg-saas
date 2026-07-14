"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Building2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Key 
} from "lucide-react";

export default function LoginView() {
  const { login, signup, resetPassword } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cleanErrorMessage = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    const msg = err.code || err.message || "";
    if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
      return "Invalid email address or password.";
    }
    if (msg.includes("auth/email-already-in-use")) {
      return "An account with this email address already exists.";
    }
    if (msg.includes("auth/weak-password")) {
      return "Password should be at least 6 characters long.";
    }
    if (msg.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    return err.message?.replace("Firebase: ", "") || "Failed to authenticate. Please check your network or credentials.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (isForgotPassword) {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccess(`Password reset instructions sent to ${email}`);
      } catch (err: any) {
        setError(cleanErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        if (!name.trim()) {
          setError("Please provide your full name.");
          setLoading(false);
          return;
        }
        await signup(email, password, name.trim());
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(cleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 mb-4">
            <div className="w-full h-full bg-[#121215] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Serenity Stayz
          </h1>
          <p className="text-sm text-zinc-400 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure PG Management Portal</span>
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#18181b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isForgotPassword 
                  ? "Reset Password" 
                  : isSignup 
                  ? "Create Admin Account" 
                  : "Welcome Back"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isForgotPassword
                  ? "Enter your email to receive recovery instructions"
                  : isSignup
                  ? "Register as an administrator to manage rooms & tenants"
                  : "Sign in to access live properties, billing & security logs"}
              </p>
            </div>
            {!isForgotPassword && (
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-400">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
            )}
          </div>

          {/* Status Alerts */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-sm text-rose-300 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-sm text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && !isForgotPassword && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abhishek Singh"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@serenitystayz.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Password</label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isForgotPassword ? (
                <span>Send Recovery Email</span>
              ) : isSignup ? (
                <>
                  <span>Register & Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up / Forgot Password */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                ← Back to Sign In
              </button>
            ) : isSignup ? (
              <div>
                Already have an admin account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div>
                Need a new staff/admin access?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                >
                  Create Admin Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          © {new Date().getFullYear()} Serenity Stayz PG Operations • Production v2.0
        </p>
      </div>
    </div>
  );
}
