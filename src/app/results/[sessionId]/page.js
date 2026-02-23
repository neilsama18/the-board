"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Shell from "@/components/Shell";
import Link from "next/link";

const S = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ringDraw { from { stroke-dashoffset: 339; } }

  .results-page { max-width: 680px; margin: 0 auto; padding: 48px 32px 80px; }
  .results-eyebrow { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .results-title { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text-bright); margin-bottom: 32px; }

  .verdict-card { background: var(--panel); border: 1px solid var(--border); padding: 44px 32px; text-align: center; margin-bottom: 24px; position: relative; overflow: hidden; }
  .verdict-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .verdict-card.pass::before { background: var(--emerald-light); }
  .verdict-card.fail::before { background: var(--danger); }

  .ring-wrap { display: inline-flex; position: relative; margin-bottom: 22px; }
  .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-num { font-family: var(--font-display); font-size: 38px; font-weight: 700; line-height: 1; }
  .ring-lbl { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); margin-top: 5px; }
  .verdict-text { font-family: var(--font-display); font-size: 32px; font-weight: 700; margin-bottom: 8px; }
  .verdict-sub { font-size: 17px; color: var(--text-dim); font-style: italic; }

  .stats-row { display: flex; border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden; }
  .stat-cell { flex: 1; padding: 22px 12px; text-align: center; background: var(--panel); border-right: 1px solid var(--border); }
  .stat-cell:last-child { border-right: none; }
  .stat-num { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: var(--gold); display: block; }
  .stat-lbl { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); display: block; margin-top: 5px; }

  .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .act-btn { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; padding: 16px; border: 1px solid var(--border); background: var(--panel); color: var(--text-dim); text-align: center; display: block; transition: all 0.18s ease; }
  .act-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-2px); box-shadow: 0 4px 16px var(--gold-glow); }
  .act-btn.primary { background: var(--gold); border-color: var(--gold); color: var(--ink); }
  .act-btn.primary:hover { filter: brightness(1.12); box-shadow: var(--shadow-gold); transform: translateY(-2px); }
  .act-btn-full { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; padding: 16px; border: 1px solid var(--border); background: var(--panel); color: var(--text-dim); text-align: center; display: block; transition: all 0.18s ease; width: 100%; cursor: pointer; }
  .act-btn-full:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-2px); }

  .meta-box { background: var(--panel); border: 1px solid var(--border); padding: 18px 22px; margin-top: 20px; }
  .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-soft); }
  .meta-row:last-child { border-bottom: none; }
  .meta-key { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
  .meta-val { font-family: var(--font-mono); font-size: var(--mono-sm); color: var(--text); }
`;

export default function ResultsPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("exam_sessions").select("*").eq("id", sessionId).single()
      .then(({ data }) => { if (data) setSession(data); setLoading(false); });
  }, [sessionId]);

  if (loading || !session) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"var(--ink)", color:"var(--text-dim)", fontFamily:"var(--font-mono)", fontSize:"var(--mono-md)", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      <div style={{ width:36, height:36, border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      Loading Results…
    </div>
  );

  const pct = session.total_questions > 0 ? Math.round((session.score / session.total_questions) * 100) : 0;
  const passed = pct >= 75;
  const C = 2 * Math.PI * 54;
  const offset = C - (pct / 100) * C;
  const ringColor = passed ? "var(--emerald-light)" : "#e57373";

  return (
    <Shell backHref="/" backLabel="Home">
      <style>{S}</style>
      <div className="results-page anim-fade-up">
        <div className="results-eyebrow">Exam Complete</div>
        <h1 className="results-title">Your Results</h1>

        <div className={`verdict-card anim-scale-in ${passed ? "pass" : "fail"}`}>
          <div className="ring-wrap">
            <svg width="148" height="148" viewBox="0 0 148 148">
              <circle cx="74" cy="74" r="54" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="74" cy="74" r="54" fill="none" stroke={ringColor} strokeWidth="10"
                strokeDasharray={C} strokeDashoffset={offset}
                transform="rotate(-90 74 74)"
                style={{ animation:`ringDraw 1.2s 0.3s ease both`, animationFillMode:"both" }}
              />
            </svg>
            <div className="ring-center">
              <div className="ring-num" style={{ color: ringColor }}>{pct}%</div>
              <div className="ring-lbl">Score</div>
            </div>
          </div>
          <div className="verdict-text" style={{ color: ringColor }}>{passed ? "✓ Passed" : "✗ Failed"}</div>
          <div className="verdict-sub">{passed ? `Excellent work, ${session.display_name}!` : `Keep practicing, ${session.display_name}. You'll get there.`}</div>
        </div>

        <div className="stats-row anim-fade-up-1">
          <div className="stat-cell"><span className="stat-num">{session.score}</span><span className="stat-lbl">Correct</span></div>
          <div className="stat-cell"><span className="stat-num">{session.total_questions - session.score}</span><span className="stat-lbl">Wrong</span></div>
          <div className="stat-cell"><span className="stat-num">{session.total_questions}</span><span className="stat-lbl">Total</span></div>
          <div className="stat-cell"><span className="stat-num">{pct}%</span><span className="stat-lbl">Score</span></div>
        </div>

        <div className="action-grid anim-fade-up-2">
          <Link href={`/review/session/${sessionId}`} className="act-btn primary">📖 Review Answers</Link>
          <Link href={`/exam/${session.document_id}/setup`} className="act-btn">↺ Retake Exam</Link>
        </div>
        <Link href={`/review/session/${sessionId}?filter=wrong`} className="act-btn-full anim-fade-up-3">
          ⚡ Retake with Wrong Answers Only
        </Link>

        <div className="meta-box anim-fade-up-4">
          <div className="meta-row"><span className="meta-key">Examinee</span><span className="meta-val">{session.display_name}</span></div>
          <div className="meta-row"><span className="meta-key">Completed</span><span className="meta-val">{session.completed_at ? new Date(session.completed_at).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</span></div>
          <div className="meta-row"><span className="meta-key">Passing Score</span><span className="meta-val">75%</span></div>
        </div>
      </div>
    </Shell>
  );
}
