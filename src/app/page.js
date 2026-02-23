"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Shell from "@/components/Shell";

const S = `
  .home-wrap { max-width: 860px; margin: 0 auto; padding: 0 32px; }
  .home-hero { padding: 56px 0 44px; text-align: center; }
  .eyebrow {
    font-family: var(--font-mono); font-size: var(--mono-sm);
    letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold);
    margin-bottom: 18px; display: flex; align-items: center; justify-content: center; gap: 14px;
  }
  .eyebrow::before, .eyebrow::after { content:''; width:36px; height:1px; background:var(--gold-dim); }
  .home-title {
    font-family: var(--font-display); font-size: clamp(38px,6vw,64px);
    font-weight: 700; color: var(--text-bright); line-height: 1.1;
    letter-spacing: -1px; margin-bottom: 16px;
  }
  .home-title em { color: var(--gold); font-style: italic; }
  .home-desc { font-size: 18px; color: var(--text-dim); font-style: italic; max-width: 420px; margin: 0 auto; }

  .stats-bar { display: flex; border: 1px solid var(--border); background: var(--panel); margin-bottom: 28px; overflow: hidden; }
  .stat-cell { flex: 1; padding: 22px 16px; text-align: center; border-right: 1px solid var(--border); }
  .stat-cell:last-child { border-right: none; }
  .stat-num { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--gold); display: block; }
  .stat-lbl { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); display: block; margin-top: 5px; }

  .search-wrap { position: relative; margin-bottom: 12px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; pointer-events: none; }
  .search-input {
    font-family: var(--font-body); font-size: 16px;
    background: var(--panel); border: 1px solid var(--border);
    color: var(--text-bright); padding: 13px 14px 13px 40px;
    width: 100%; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-glow); }
  .search-input::placeholder { color: var(--muted); font-style: italic; }

  .doc-panel { border: 1px solid var(--border); overflow: hidden; }
  .doc-panel-hdr { background: var(--surface); border-bottom: 1px solid var(--border); padding: 13px 20px; display: flex; align-items: center; gap: 8px; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 6px var(--gold); animation: pulse 2s infinite; flex-shrink: 0; }
  .hdr-text { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }

  .doc-row {
    border-bottom: 1px solid var(--border-soft); padding: 20px;
    display: flex; align-items: center; gap: 16px;
    background: var(--panel); transition: all 0.18s ease; position: relative;
  }
  .doc-row:last-child { border-bottom: none; }
  .doc-row::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--gold); transform: scaleY(0); transition: transform 0.2s;
  }
  .doc-row:hover { background: var(--panel-hover); transform: translateX(3px); }
  .doc-row:hover::before { transform: scaleY(1); }
  .doc-idx { font-family: var(--font-mono); font-size: var(--mono-sm); color: var(--muted); min-width: 28px; flex-shrink: 0; }
  .doc-info { flex: 1; min-width: 0; }
  .doc-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
  .doc-meta-row { display: flex; align-items: center; gap: 10px; }
  .doc-date { font-family: var(--font-mono); font-size: var(--mono-xs); color: var(--text-dim); }
  .best-badge { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; }
  .best-pass { color: var(--emerald-light); border-color: var(--emerald); background: rgba(45,106,79,0.12); }
  .best-fail { color: #e57373; border-color: var(--danger); background: var(--danger-soft); }
  .doc-actions { display: flex; gap: 8px; flex-shrink: 0; }

  .btn-start {
    font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--ink); background: var(--gold); border: 1px solid var(--gold);
    padding: 10px 20px; transition: all 0.18s ease; white-space: nowrap; display: inline-block;
  }
  .btn-start:hover {
    filter: brightness(1.12); box-shadow: var(--shadow-gold);
    transform: translateY(-2px);
  }
  .btn-lb {
    font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-dim); background: var(--surface); border: 1px solid var(--border);
    padding: 10px 20px; transition: all 0.18s ease; white-space: nowrap; display: inline-block;
  }
  .btn-lb:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-2px); }

  .skel-row { border-bottom: 1px solid var(--border-soft); padding: 20px; display: flex; align-items: center; gap: 16px; background: var(--panel); }
  .skel { background: var(--border); animation: pulse 1.5s infinite; }

  .empty-box { padding: 64px 24px; text-align: center; background: var(--panel); }
  .empty-icon { font-size: 36px; margin-bottom: 14px; opacity: 0.4; }
  .empty-title { font-family: var(--font-display); font-size: 22px; color: var(--text); margin-bottom: 6px; }
  .empty-sub { font-size: 16px; color: var(--text-dim); font-style: italic; }

  .home-footer { padding: 36px 0 56px; text-align: center; border-top: 1px solid var(--border-soft); margin-top: 40px; }
  .footer-quote { font-family: var(--font-body); font-style: italic; font-size: 16px; color: var(--text-dim); margin-bottom: 10px; }
  .footer-meta { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }

  @media (max-width:580px) {
    .doc-actions { flex-direction:column; gap:6px; }
    .stats-bar { flex-wrap:wrap; }
    .stat-cell { min-width:50%; border-right:none; border-bottom:1px solid var(--border); }
    .doc-row:hover { transform: none; }
  }
`;

export default function HomePage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [bestScores, setBestScores] = useState({});

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data?.user || null)); }, []);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      const { data } = await supabase.from("documents").select("id,title,created_at").order("created_at", { ascending: false });
      setDocs(data || []);
      if (data?.length && user) {
        const { data: sessions } = await supabase.from("exam_sessions").select("document_id,score,total_questions").eq("user_id", user.id).not("score","is",null);
        if (sessions) {
          const bests = {};
          sessions.forEach(s => {
            const pct = s.total_questions > 0 ? Math.round((s.score / s.total_questions) * 100) : 0;
            if (!bests[s.document_id] || pct > bests[s.document_id]) bests[s.document_id] = pct;
          });
          setBestScores(bests);
        }
      }
      setLoading(false);
    }
    loadDocs();
  }, [user]);

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Shell>
      <style>{S}</style>
      <main>
        <div className="home-wrap">
          <section className="home-hero anim-fade-up">
            <div className="eyebrow">Reviewer Sets</div>
            <h1 className="home-title">Prepare for<br /><em>what matters most.</em></h1>
            <p className="home-desc">Upload a PDF via Telegram. Your exam is ready in minutes.</p>
          </section>

          <div className="stats-bar anim-fade-up-1">
            <div className="stat-cell"><span className="stat-num">{loading ? "—" : docs.length}</span><span className="stat-lbl">Reviewer Sets</span></div>
            <div className="stat-cell"><span className="stat-num">PDF</span><span className="stat-lbl">Source Format</span></div>
            <div className="stat-cell"><span className="stat-num">∞</span><span className="stat-lbl">Practice Attempts</span></div>
            <div className="stat-cell"><span className="stat-num">{user ? Object.keys(bestScores).length : "—"}</span><span className="stat-lbl">Sets Attempted</span></div>
          </div>

          <div className="search-wrap anim-fade-up-2">
            <span className="search-icon">⌕</span>
            <input className="search-input" type="text" placeholder="Search reviewer sets…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="doc-panel anim-fade-up-3">
            <div className="doc-panel-hdr">
              <div className="live-dot" />
              <span className="hdr-text">{search ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "All Documents — newest first"}</span>
            </div>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="skel-row">
                  <div className="skel" style={{ width:28, height:15 }} />
                  <div style={{ flex:1 }}>
                    <div className="skel" style={{ height:17, marginBottom:9, maxWidth:280 }} />
                    <div className="skel" style={{ height:13, maxWidth:140 }} />
                  </div>
                  <div className="skel" style={{ width:100, height:38 }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">{search ? "⌕" : "📬"}</div>
                <div className="empty-title">{search ? "No results found." : "No documents yet."}</div>
                <div className="empty-sub">{search ? `Nothing matching "${search}"` : "Send a PDF via Telegram to get started."}</div>
              </div>
            ) : (
              <ul style={{ listStyle:"none" }}>
                {filtered.map((d, i) => {
                  const best = bestScores[d.id];
                  return (
                    <li key={d.id} className="doc-row">
                      <span className="doc-idx">{String(i+1).padStart(2,"0")}</span>
                      <div className="doc-info">
                        <div className="doc-title">{d.title}</div>
                        <div className="doc-meta-row">
                          <span className="doc-date">{new Date(d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                          {best !== undefined && <span className={`best-badge ${best >= 75 ? "best-pass" : "best-fail"}`}>Best: {best}%</span>}
                        </div>
                      </div>
                      <div className="doc-actions">
                        <Link href={`/exam/${d.id}/setup`} className="btn-start">Start Exam</Link>
                        <Link href={`/leaderboard/${d.id}`} className="btn-lb">Leaderboard</Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="home-footer anim-fade-up-4">
            <p className="footer-quote">"Excellence is not a destination but a continuous journey."</p>
            <p className="footer-meta">The Board · Board Exam Simulator · PDF to Exam via Telegram</p>
          </footer>
        </div>
      </main>
    </Shell>
  );
}
