"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/components/ThemeProvider";

export default function AuthPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) router.replace("/");
    });
  }, []);

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) { setError(error.message); }
      else { setMessage("Check your email to confirm your account, then sign in."); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); }
      else { router.replace("/"); }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/` },
    });
    if (error) setError(error.message);
  }

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          z-index: 1;
        }
        .auth-glow {
          position: fixed;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 500px;
          background: radial-gradient(ellipse, var(--gold-glow2) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--panel);
          border: 1px solid var(--border);
          padding: 40px;
          position: relative;
          z-index: 1;
          animation: scaleIn 0.4s ease both;
        }
        .auth-top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(13,13,18,0.92);
          backdrop-filter: blur(12px);
          z-index: 100;
        }
        [data-theme="light"] .auth-top-bar {
          background: rgba(245,240,232,0.92);
        }
        .auth-logo {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 900;
          color: var(--text-bright);
          letter-spacing: -0.5px;
        }
        .auth-logo span { color: var(--gold); }
        .theme-btn {
          width: 34px; height: 34px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }
        .theme-btn:hover { border-color: var(--gold); color: var(--gold); }
        .auth-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .auth-eyebrow::before {
          content: '';
          width: 24px; height: 1px;
          background: var(--gold-dim);
        }
        .auth-title {
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 700;
          color: var(--text-bright);
          margin-bottom: 6px;
        }
        .auth-sub {
          font-size: 14px;
          color: var(--text-dim);
          font-style: italic;
          margin-bottom: 32px;
        }
        .auth-tabs {
          display: flex;
          border: 1px solid var(--border);
          margin-bottom: 28px;
          overflow: hidden;
        }
        .auth-tab {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: var(--gold);
          color: var(--ink);
        }
        .auth-tab:not(.active):hover { background: var(--panel-hover); color: var(--text); }
        .form-group { margin-bottom: 16px; }
        .form-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-dim);
          display: block;
          margin-bottom: 8px;
        }
        .form-input {
          font-family: var(--font-body);
          font-size: 15px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-bright);
          padding: 10px 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: var(--gold); }
        .form-input::placeholder { color: var(--muted); }
        .auth-btn {
          width: 100%;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 13px;
          background: var(--gold);
          border: 1px solid var(--gold);
          color: var(--ink);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .auth-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: var(--shadow-gold); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 20px 0;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }
        .google-btn {
          width: 100%;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .google-btn:hover { border-color: var(--muted); color: var(--text); background: var(--panel-hover); }
        .auth-error {
          background: var(--danger-soft);
          border: 1px solid var(--danger);
          color: #e57373;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .auth-message {
          background: rgba(45,106,79,0.12);
          border: 1px solid var(--emerald);
          color: var(--emerald-light);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .auth-corner {
          position: absolute;
          top: 0; left: 0;
          width: 32px; height: 32px;
          border-top: 2px solid var(--gold);
          border-left: 2px solid var(--gold);
        }
        .auth-corner-br {
          position: absolute;
          bottom: 0; right: 0;
          width: 32px; height: 32px;
          border-bottom: 2px solid var(--gold-dim);
          border-right: 2px solid var(--gold-dim);
        }
      `}</style>

      <div className="auth-glow" />

      <div className="auth-top-bar">
        <a href="/" className="auth-logo">The <span>Board</span></a>
        <button className="theme-btn" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
      </div>

      <div className="auth-page" style={{ paddingTop: "80px" }}>
        <div className="auth-card">
          <div className="auth-corner" />
          <div className="auth-corner-br" />

          <div className="auth-eyebrow">Exam Simulator</div>
          <h1 className="auth-title">
            {mode === "signin" ? "Welcome back." : "Join The Board."}
          </h1>
          <p className="auth-sub">
            {mode === "signin"
              ? "Sign in to track your progress and scores."
              : "Create an account to save your records."}
          </p>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "signin" ? "active" : ""}`} onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>
              Sign In
            </button>
            <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <form onSubmit={handleEmailAuth}>
            {mode === "signup" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Juan dela Cruz" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <button className="google-btn" onClick={handleGoogle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </>
  );
}
