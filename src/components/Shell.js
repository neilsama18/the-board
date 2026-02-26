"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "./ThemeProvider";
import MosaicBackground from "./MosaicBackground";

export default function Shell({ children, backHref, backLabel }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;

  return (
    <>
      <style>{`
        /* ─────────────────────────────────────────
           Mosaic sits behind everything.
           UI elements block pointer events to canvas
           so ripple only fires on empty background.
        ───────────────────────────────────────── */
        .mosaic-layer {
          position: fixed; inset: 0; z-index: 0;
          pointer-events: none; /* wrapper never intercepts */
        }
        .mosaic-layer canvas {
          pointer-events: auto; /* canvas itself catches mouse */
          width: 100vw !important;
          height: 100vh !important;
        }

        /* Everything above the canvas */
        .shell-frame {
          position: relative; z-index: 1;
          /* Isolate pointer events so hovering UI doesn't reach canvas */
          pointer-events: none;
        }
        .shell-frame > * { pointer-events: auto; }

        /* ── Sticky header — glassy, lets mosaic peek ── */
        .shell-header {
          position: sticky; top: 0; z-index: 200;
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--ink) 82%, transparent);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          pointer-events: auto;
        }
        .shell-inner {
          max-width: 960px; margin: 0 auto; padding: 0 32px;
          height: 68px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .shell-left { display: flex; align-items: center; }

        .shell-logo {
          font-family: var(--font-display); font-size: 22px; font-weight: 900;
          color: var(--text-bright); letter-spacing: -0.5px;
          white-space: nowrap; padding-right: 20px; transition: opacity 0.2s;
        }
        .shell-logo:hover { opacity: 0.8; }
        .shell-logo span { color: var(--gold); }

        .shell-back {
          font-family: var(--font-mono); font-size: 14px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-dim); display: flex; align-items: center; gap: 8px;
          border-left: 1px solid var(--border); padding: 8px 0 8px 20px;
          transition: all 0.18s ease; position: relative;
        }
        .shell-back::after {
          content: ''; position: absolute; bottom: -1px; left: 20px; right: 0;
          height: 2px; background: var(--gold);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.22s ease;
        }
        .shell-back:hover { color: var(--gold); }
        .shell-back:hover::after { transform: scaleX(1); }

        .shell-right { display: flex; align-items: center; gap: 8px; }

        .theme-btn {
          width: 38px; height: 38px; border: 1px solid var(--border);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          color: var(--text-dim); cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s ease;
        }
        .theme-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: scale(1.08); }

        .user-menu-wrap { position: relative; }
        .user-btn {
          font-family: var(--font-mono); font-size: var(--mono-sm);
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-dim);
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          padding: 9px 16px; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: all 0.18s ease;
        }
        .user-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-1px); }
        .user-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: pulse 2s infinite; flex-shrink: 0; }

        .user-dropdown {
          position: absolute; right: 0; top: calc(100% + 6px);
          min-width: 210px; background: var(--panel);
          border: 1px solid var(--border); box-shadow: var(--shadow); z-index: 300;
          animation: fadeUp 0.2s ease both;
        }
        .user-dropdown-item {
          display: block; width: 100%; padding: 12px 18px;
          font-family: var(--font-mono); font-size: var(--mono-sm);
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-dim); border: none; background: none;
          cursor: pointer; text-align: left; transition: all 0.15s;
          border-bottom: 1px solid var(--border-soft);
        }
        .user-dropdown-item:last-child { border-bottom: none; }
        .user-dropdown-item:hover { background: var(--panel-hover); color: var(--text); padding-left: 22px; }
        .user-dropdown-item.danger:hover { color: #e57373; }

        .auth-link {
          font-family: var(--font-mono); font-size: var(--mono-sm);
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--ink); background: var(--gold); border: 1px solid var(--gold);
          padding: 9px 18px; transition: all 0.18s ease; display: inline-block;
        }
        .auth-link:hover { filter: brightness(1.12); box-shadow: var(--shadow-gold); transform: translateY(-1px); }

        /* ── Page content panels get opaque bg so mosaic stays as background ── */
        .shell-content {
          position: relative; z-index: 1; pointer-events: auto;
        }

        /* ── Side ornaments ── */
        .margin-left, .margin-right {
          position: fixed; top: 0; bottom: 0; width: 80px;
          z-index: 2; pointer-events: none;
          display: flex; flex-direction: column; align-items: center;
          padding: 120px 0 60px; overflow: hidden;
        }
        .margin-left  { left: calc(50% - 530px); }
        .margin-right { right: calc(50% - 530px); }
        @media (max-width: 1120px) { .margin-left, .margin-right { display: none; } }

        .margin-text {
          font-family: var(--font-mono); font-size: 10px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--border); writing-mode: vertical-rl;
          white-space: nowrap; user-select: none;
        }
        .margin-text.right { transform: rotate(180deg); }
        .margin-ornament {
          width: 1px; flex: 1;
          background: linear-gradient(to bottom, transparent, var(--border-soft) 20%, var(--border-soft) 80%, transparent);
          margin: 16px 0;
        }
        .margin-diamond { width: 5px; height: 5px; background: var(--gold-dim); transform: rotate(45deg); opacity: 0.5; flex-shrink: 0; }
        .margin-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border); flex-shrink: 0; margin: 6px 0; }
      `}</style>

      {/* ── Mosaic canvas (z:0, behind everything) ── */}
      <div className="mosaic-layer">
        <MosaicBackground />
      </div>

      {/* ── Side ornaments (z:2) ── */}
      <div className="margin-left" aria-hidden="true">
        <div className="margin-diamond" /><div className="margin-dot" />
        <div className="margin-ornament" />
        <div className="margin-text">The Board · Est. 2025</div>
        <div className="margin-ornament" />
        <div className="margin-dot" /><div className="margin-diamond" />
      </div>
      <div className="margin-right" aria-hidden="true">
        <div className="margin-diamond" /><div className="margin-dot" />
        <div className="margin-ornament" />
        <div className="margin-text right">Board Exam Simulator</div>
        <div className="margin-ornament" />
        <div className="margin-dot" /><div className="margin-diamond" />
      </div>

      {/* ── Shell frame (z:1) — header + content ── */}
      <div className="shell-frame">
        <header className="shell-header">
          <div className="shell-inner">
            <div className="shell-left">
              <Link href="/" className="shell-logo">The <span>Board</span></Link>
              {backHref && (
                <Link href={backHref} className="shell-back">← {backLabel || "Back"}</Link>
              )}
            </div>
            <div className="shell-right">
              <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
                {theme === "dark" ? "☀" : "☾"}
              </button>
              {user ? (
                <div className="user-menu-wrap">
                  <button className="user-btn" onClick={() => setMenuOpen(o => !o)}>
                    <span className="user-dot" />{displayName}<span>▾</span>
                  </button>
                  {menuOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-item" style={{ color:"var(--text-bright)", cursor:"default" }}>
                        {user.email}
                      </div>
                      <button className="user-dropdown-item danger" onClick={handleSignOut}>Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth" className="auth-link">Sign In</Link>
              )}
            </div>
          </div>
        </header>

        <div className="shell-content">{children}</div>
      </div>
    </>
  );
}
