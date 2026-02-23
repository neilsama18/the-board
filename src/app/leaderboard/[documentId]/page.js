"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Shell from "@/components/Shell";

const MEDALS = ["🥇","🥈","🥉"];

const S = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .lb-page { max-width: 840px; margin: 0 auto; padding: 48px 32px 80px; }
  .lb-eyebrow { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .lb-title { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }
  .lb-doc { font-size: 17px; color: var(--text-dim); font-style: italic; margin-bottom: 32px; }

  .podium { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 24px; }
  .podium-card { background: var(--panel); border: 1px solid var(--border); padding: 26px 16px; text-align: center; transition: all 0.18s ease; }
  .podium-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .podium-card.first { border-color: var(--gold); background: var(--gold-glow); }
  .podium-card.first:hover { box-shadow: var(--shadow-gold); }
  .podium-card.second { border-color: var(--muted); }
  .podium-medal { font-size: 30px; margin-bottom: 10px; }
  .podium-name { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--text-bright); margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .podium-pct { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--gold); }
  .podium-card:not(.first) .podium-pct { color: var(--text-dim); }
  .podium-score { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.08em; color: var(--text-dim); margin-top: 4px; }

  .lb-panel { border: 1px solid var(--border); overflow: hidden; }
  .lb-panel-hdr { background: var(--surface); border-bottom: 1px solid var(--border); padding: 13px 22px; display: flex; align-items: center; gap: 16px; }
  .lb-col-hdr { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); }

  .lb-row { display: flex; align-items: center; padding: 16px 22px; gap: 16px; border-bottom: 1px solid var(--border-soft); background: var(--panel); transition: all 0.18s ease; position: relative; }
  .lb-row:last-child { border-bottom: none; }
  .lb-row:hover { background: var(--panel-hover); transform: translateX(3px); }
  .lb-row.is-me { background: var(--gold-glow); }
  .lb-row.is-me::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--gold); }
  .lb-row:hover.is-me { background: rgba(201,168,76,0.18); }

  .rank { font-family: var(--font-mono); font-size: var(--mono-md); color: var(--muted); min-width: 44px; flex-shrink: 0; }
  .rank.medal { font-size: 22px; }
  .lb-info { flex: 1; min-width: 0; }
  .lb-name { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lb-name.me { color: var(--gold); }
  .lb-date { font-family: var(--font-mono); font-size: var(--mono-xs); color: var(--text-dim); margin-top: 3px; }
  .lb-score-col { flex-shrink: 0; min-width: 170px; }
  .lb-score-txt { font-family: var(--font-mono); font-size: var(--mono-sm); color: var(--text-dim); margin-bottom: 6px; display: flex; justify-content: space-between; }
  .lb-pct { color: var(--gold); font-weight: 500; }
  .lb-bar-track { height: 5px; background: var(--border); }
  .lb-bar-fill { height: 100%; transition: width 0.8s ease; }
  .lb-bar-fill.pass { background: var(--emerald-light); }
  .lb-bar-fill.fail { background: var(--danger); }

  .empty-state { padding: 72px 24px; text-align: center; background: var(--panel); }
  .empty-icon { font-size: 40px; margin-bottom: 14px; opacity: 0.4; }
  .empty-title { font-family: var(--font-display); font-size: 24px; color: var(--text); margin-bottom: 8px; }
  .empty-sub { font-size: 16px; color: var(--text-dim); font-style: italic; }

  @media (max-width:560px) { .podium{grid-template-columns:1fr} .lb-score-col{min-width:110px} .lb-row:hover{transform:none} }
`;

export default function LeaderboardPage() {
  const { documentId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: docData }, { data: sessionData }, { data: userData }] = await Promise.all([
        supabase.from("documents").select("title").eq("id", documentId).single(),
        supabase.from("exam_sessions").select("*").eq("document_id", documentId).not("score","is",null).order("score",{ ascending:false }),
        supabase.auth.getUser(),
      ]);
      if (docData) setDoc(docData);
      setSessions(sessionData || []);
      setCurrentUserId(userData?.user?.id || null);
      setLoading(false);
    }
    load();
  }, [documentId]);

  const maxScore = sessions[0]?.total_questions || 1;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"var(--ink)", color:"var(--text-dim)", fontFamily:"var(--font-mono)", fontSize:"var(--mono-md)", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      <div style={{ width:36, height:36, border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      Loading Leaderboard…
    </div>
  );

  return (
    <Shell backHref="/" backLabel="Home">
      <style>{S}</style>
      <div className="lb-page anim-fade-up">
        <div className="lb-eyebrow">Rankings</div>
        <h1 className="lb-title">Leaderboard</h1>
        <p className="lb-doc">{doc?.title}</p>

        {sessions.length >= 3 && (
          <div className="podium anim-fade-up-1">
            {sessions.slice(0,3).map((s,i) => {
              const pct = s.total_questions > 0 ? Math.round((s.score/s.total_questions)*100) : 0;
              return (
                <div key={s.id} className={`podium-card ${i===0?"first":i===1?"second":"third"}`}>
                  <div className="podium-medal">{MEDALS[i]}</div>
                  <div className="podium-name">{s.display_name}</div>
                  <div className="podium-pct">{pct}%</div>
                  <div className="podium-score">{s.score}/{s.total_questions}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="lb-panel anim-fade-up-2">
          <div className="lb-panel-hdr" style={{ gap:16 }}>
            <div className="lb-col-hdr" style={{ minWidth:44 }}>Rank</div>
            <div className="lb-col-hdr" style={{ flex:1 }}>Name</div>
            <div className="lb-col-hdr" style={{ minWidth:170 }}>Score</div>
          </div>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <div className="empty-title">No scores yet.</div>
              <div className="empty-sub">Be the first to take this exam!</div>
            </div>
          ) : (
            sessions.map((s,i) => {
              const pct = s.total_questions > 0 ? Math.round((s.score/s.total_questions)*100) : 0;
              const isMe = currentUserId && s.user_id === currentUserId;
              return (
                <div key={s.id} className={`lb-row ${isMe?"is-me":""}`}>
                  <div className={`rank ${i<3?"medal":""}`}>{i<3 ? MEDALS[i] : `#${i+1}`}</div>
                  <div className="lb-info">
                    <div className={`lb-name ${isMe?"me":""}`}>{s.display_name}{isMe?" ★":""}</div>
                    <div className="lb-date">{new Date(s.completed_at||s.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                  </div>
                  <div className="lb-score-col">
                    <div className="lb-score-txt"><span>{s.score}/{s.total_questions}</span><span className="lb-pct">{pct}%</span></div>
                    <div className="lb-bar-track"><div className={`lb-bar-fill ${pct>=75?"pass":"fail"}`} style={{ width:`${(s.score/maxScore)*100}%` }} /></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Shell>
  );
}
