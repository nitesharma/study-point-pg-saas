"use client";

import React, { useState, useEffect } from "react";
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
  Key,
  Phone
} from "lucide-react";

export default function LoginView() {
  const { login, signup, resetPassword, setupRecaptcha, requestPhoneOtp } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"admin" | "tenant">("admin");

  // Admin State
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Tenant State
  const [phoneNumber, setPhoneNumber] = useState(""); // E.g., +919876543210
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when switching tabs
    setError(null);
    setSuccess(null);
    setConfirmationResult(null);
    
    if (activeTab === "tenant") {
      // Setup Recaptcha when tenant tab is opened
      setupRecaptcha("recaptcha-container");
    }
  }, [activeTab]);

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
    if (msg.includes("auth/invalid-phone-number")) {
      return "Please enter a valid phone number with country code (e.g. +91).";
    }
    if (msg.includes("auth/invalid-verification-code")) {
      return "Invalid OTP code entered.";
    }
    return err.message?.replace("Firebase: ", "") || "Failed to authenticate. Please check your network or credentials.";
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);
    try {
      // Ensure there's a + sign for international format
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await requestPhoneOtp(formattedPhone, appVerifier);
      setConfirmationResult(result);
      setSuccess("OTP sent successfully via SMS.");
    } catch (err: any) {
      setError(cleanErrorMessage(err));
      // Reset recaptcha on error so user can try again
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Success will automatically trigger AuthContext state update and redirect in page.tsx
    } catch (err: any) {
      setError(cleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      
      

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="/" aria-label="Back to home" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4 overflow-hidden">
            <img src="/images/logo.jpeg" alt="" className="w-full h-full object-cover" />
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Study Point Group
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure PG Management Portal</span>
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white border border-slate-200 shadow-sm p-1 rounded-2xl mb-6 border border-slate-200">
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "admin" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            Admin Access
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "tenant" 
                ? "bg-purple-600 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("tenant")}
          >
            Tenant Portal
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {activeTab === "tenant"
                  ? "Tenant Login"
                  : isForgotPassword 
                  ? "Reset Password" 
                  : isSignup 
                  ? "Create Admin Account" 
                  : "Welcome Back"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === "tenant"
                  ? "Sign in using your registered phone number"
                  : isForgotPassword
                  ? "Enter your email to receive recovery instructions"
                  : isSignup
                  ? "Register as an administrator to manage rooms & tenants"
                  : "Sign in to access live properties, billing & security logs"}
              </p>
            </div>
            {activeTab === "admin" && !isForgotPassword && (
              <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500">
                <Key className="w-5 h-5 text-indigo-600" />
              </div>
            )}
            {activeTab === "tenant" && (
              <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
            )}
          </div>

          {/* Status Alerts */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-sm text-rose-700 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-sm text-emerald-700 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ADMIN FORM */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {isSignup && !isForgotPassword && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abhishek Singh"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Password</label>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all duration-200 disabled:opacity-50"
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
          )}

          {/* TENANT FORM */}
          {activeTab === "tenant" && (
            <form onSubmit={!confirmationResult ? handleSendOtp : handleVerifyOtp} className="space-y-4">
              <div id="recaptcha-container"></div>
              
              {!confirmationResult ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Registered Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Include country code (e.g. +91)</p>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-medium text-slate-700">Enter OTP</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : !confirmationResult ? (
                  <>
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {confirmationResult && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationResult(null);
                    setOtp("");
                    setSuccess(null);
                    setError(null);
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Change phone number
                </button>
              )}
            </form>
          )}

          {/* Toggle between Sign In / Sign Up / Forgot Password (Admin only) */}
          {activeTab === "admin" && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
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
                    className="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
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
                    className="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
                  >
                    Create Admin Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <a
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          <Building2 className="w-4 h-4" /> Looking for a PG? Browse our properties
        </a>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Study Point Group
        </p>
      </div>
    </div>
  );
}
