"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Shell from "@/components/Shell";

const S = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .review-page { max-width: 820px; margin: 0 auto; padding: 48px 32px 80px; }
  .review-eyebrow { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .review-title { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text-bright); margin-bottom: 28px; }

  .filter-tabs { display: flex; border: 1px solid var(--border); margin-bottom: 24px; overflow: hidden; }
  .filter-tab { flex: 1; font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 8px; background: var(--panel); border: none; border-right: 1px solid var(--border); color: var(--text-dim); cursor: pointer; transition: all 0.18s ease; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .filter-tab:last-child { border-right: none; }
  .filter-tab:hover:not(.active) { background: var(--gold-glow); color: var(--gold); border-color: var(--gold-dim); transform: translateY(-1px); }
  .filter-tab.active { background: var(--gold); color: var(--ink); }
  .tab-count { font-family: var(--font-display); font-size: 22px; font-weight: 700; }
  .filter-tab.active .tab-count { color: var(--ink); }
  .tab-label { font-size: var(--mono-xs); letter-spacing: 0.12em; }

  .retake-bar { background: var(--panel); border: 1px solid var(--border); padding: 18px 22px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .retake-label { font-family: var(--font-mono); font-size: var(--mono-md); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
  .retake-btns { display: flex; gap: 8px; }
  .retake-btn { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 18px; border: 1px solid var(--border); background: var(--surface); color: var(--text-dim); cursor: pointer; transition: all 0.18s ease; }
  .retake-btn:hover { border-color: var(--muted); color: var(--text); background: var(--panel-hover); transform: translateY(-1px); }
  .retake-btn.gold { background: var(--gold); border-color: var(--gold); color: var(--ink); }
  .retake-btn.gold:hover { filter: brightness(1.12); box-shadow: var(--shadow-gold); transform: translateY(-1px); }

  .q-review { background: var(--panel); border: 1px solid var(--border); margin-bottom: 10px; overflow: hidden; transition: border-color 0.18s ease; }
  .q-review:hover { border-color: var(--muted); }
  .q-review-hdr { padding: 18px 22px; display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: background 0.18s ease; }
  .q-review-hdr:hover { background: var(--panel-hover); }
  .q-status { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
  .q-review-info { flex: 1; }
  .q-num { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 5px; }
  .conf-tag { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border: 1px solid; display: inline; margin-left: 8px; }
  .conf-sure { border-color: var(--emerald); color: var(--emerald-light); }
  .conf-unsure { border-color: var(--danger); color: #e57373; }
  .q-preview { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--text-bright); line-height: 1.4; }
  .expand-icon { font-size: 13px; color: var(--muted); flex-shrink: 0; margin-top: 4px; transition: transform 0.2s; }
  .expand-icon.open { transform: rotate(180deg); }

  .q-review-body { padding: 16px 22px 22px; border-top: 1px solid var(--border-soft); }
  .answer-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
  .answer-opt { padding: 12px 16px; border: 1px solid var(--border); background: var(--surface); font-size: 15px; color: var(--text); line-height: 1.5; display: flex; align-items: flex-start; gap: 12px; }
  .answer-opt.correct { border-color: var(--emerald); background: rgba(45,106,79,0.12); color: var(--emerald-light); }
  .answer-opt.wrong-pick { border-color: var(--danger); background: var(--danger-soft); color: #e57373; }
  .opt-icon { font-size: 13px; flex-shrink: 0; padding-top: 1px; }

  .explanation-box { background: var(--surface); border: 1px solid var(--border-soft); border-left: 3px solid var(--gold-dim); padding: 16px 18px; }
  .explanation-label { font-family: var(--font-mono); font-size: var(--mono-xs); letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold-dim); margin-bottom: 8px; }
  .explanation-text { font-size: 15px; color: var(--text); line-height: 1.65; }

  .empty-state { padding: 64px 24px; text-align: center; background: var(--panel); border: 1px solid var(--border); }
  .empty-icon { font-size: 36px; margin-bottom: 14px; opacity: 0.4; }
  .empty-title { font-family: var(--font-display); font-size: 22px; color: var(--text); }
`;

export default function ReviewPage() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      const { data: sd } = await supabase.from("exam_sessions").select("*").eq("id", sessionId).single();
      if (!sd) return;
      setSession(sd);
      const { data: qd } = await supabase.from("questions").select("*").in("id", sd.question_ids);
      const ordered = sd.question_ids.map(id => qd?.find(q => q.id === id)).filter(Boolean);
      const { data: ad } = await supabase.from("exam_answers").select("*").eq("session_id", sessionId);
      setQuestions(ordered); setAnswers(ad || []); setLoading(false);
    }
    load();
  }, [sessionId]);

  const ua = (q) => answers.find(a => a.question_id === q.id);
  const correct = (q) => ua(q)?.selected_choice === q.correct_choice;
  const counts = {
    all: questions.length,
    correct: questions.filter(q => correct(q)).length,
    wrong: questions.filter(q => !correct(q)).length,
    skipped: questions.filter(q => !ua(q)?.selected_choice).length,
  };
  const filtered = questions.filter(q => {
    if (filter === "correct") return correct(q);
    if (filter === "wrong") return !correct(q);
    if (filter === "skipped") return !ua(q)?.selected_choice;
    return true;
  });

  async function startRetake(onLeaderboard) {
    const wrongQs = questions.filter(q => !correct(q));
    if (!wrongQs.length) { alert("No wrong answers!"); return; }
    const { data: userData } = await supabase.auth.getUser();
    const { data: ns, error } = await supabase.from("exam_sessions").insert([{
      document_id: session.document_id,
      display_name: onLeaderboard ? session.display_name : "Private Retry",
      user_id: onLeaderboard ? (userData?.user?.id || null) : null,
      settings: { questionLimit: wrongQs.length, randomize: true, isRetake: true },
      total_questions: wrongQs.length, time_limit_seconds: session.time_limit_seconds,
      question_ids: wrongQs.map(q => q.id),
    }]).select().single();
    if (error || !ns) { alert("Error creating retake."); return; }
    router.push(`/exam/${session.document_id}?session=${ns.id}`);
  }

  if (loading || !session) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"var(--ink)", color:"var(--text-dim)", fontFamily:"var(--font-mono)", fontSize:"var(--mono-md)", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      <div style={{ width:36, height:36, border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      Loading Review…
    </div>
  );

  return (
    <Shell backHref={`/results/${sessionId}`} backLabel="Results">
      <style>{S}</style>
      <div className="review-page anim-fade-up">
        <div className="review-eyebrow">Exam Review</div>
        <h1 className="review-title">Answer Review</h1>

        <div className="filter-tabs anim-fade-up-1">
          {[{key:"all",label:"All"},{key:"correct",label:"Correct"},{key:"wrong",label:"Wrong"},{key:"skipped",label:"Skipped"}].map(f => (
            <button key={f.key} className={`filter-tab ${filter===f.key?"active":""}`} onClick={() => setFilter(f.key)}>
              <span className="tab-count">{counts[f.key]}</span>
              <span className="tab-label">{f.label}</span>
            </button>
          ))}
        </div>

        {counts.wrong > 0 && (
          <div className="retake-bar anim-fade-up-2">
            <div className="retake-label">⚡ {counts.wrong} wrong — retake these?</div>
            <div className="retake-btns">
              <button className="retake-btn" onClick={() => startRetake(false)}>Private Retry</button>
              <button className="retake-btn gold" onClick={() => startRetake(true)}>Add to Leaderboard</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{filter==="correct"?"✓":filter==="wrong"?"✗":"—"}</div>
            <div className="empty-title">No {filter} answers.</div>
          </div>
        ) : (
          <div className="anim-fade-up-3">
            {filtered.map(q => {
              const a = ua(q);
              const isOpen = expanded[q.id];
              return (
                <div key={q.id} className="q-review">
                  <div className="q-review-hdr" onClick={() => setExpanded(e => ({...e, [q.id]: !e[q.id]}))}>
                    <div className="q-status">{correct(q) ? "✅" : a?.selected_choice ? "❌" : "⬜"}</div>
                    <div className="q-review-info">
                      <div className="q-num">
                        Question {questions.indexOf(q)+1}
                        {a?.confidence && <span className={`conf-tag ${a.confidence==="sure"?"conf-sure":"conf-unsure"}`}>{a.confidence}</span>}
                      </div>
                      <div className="q-preview">{q.question}</div>
                    </div>
                    <div className={`expand-icon ${isOpen?"open":""}`}>▼</div>
                  </div>
                  {isOpen && (
                    <div className="q-review-body">
                      <div className="answer-list">
                        {q.choices.map((choice, i) => {
                          const letter = choice.charAt(0);
                          const isCorrect = q.correct_choice === letter;
                          const isWrong = a?.selected_choice === letter && !isCorrect;
                          return (
                            <div key={i} className={`answer-opt ${isCorrect?"correct":""} ${isWrong?"wrong-pick":""}`}>
                              <span className="opt-icon">{isCorrect?"✓":isWrong?"✗":""}</span>{choice}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div className="explanation-box">
                          <div className="explanation-label">Explanation</div>
                          <p className="explanation-text">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
