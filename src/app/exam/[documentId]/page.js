"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const S = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

  .exam-wrap { min-height:100vh; display:flex; flex-direction:column; background:var(--ink); color:var(--text); font-family:var(--font-body); }

  .exam-topbar { position:sticky; top:0; z-index:100; border-bottom:1px solid var(--border); background:var(--ink); }
  .exam-topbar-inner { max-width:900px; margin:0 auto; padding:0 24px; height:64px; display:flex; align-items:center; gap:14px; }
  .exam-logo { font-family:var(--font-display); font-size:20px; font-weight:900; color:var(--text-bright); white-space:nowrap; flex-shrink:0; }
  .exam-logo span { color:var(--gold); }
  .progress-group { flex:1; }
  .progress-labels { font-family:var(--font-mono); font-size:var(--mono-xs); letter-spacing:0.12em; text-transform:uppercase; color:var(--text-dim); display:flex; justify-content:space-between; margin-bottom:5px; }
  .progress-track { height:3px; background:var(--border); }
  .progress-fill { height:100%; background:var(--gold); transition:width 0.4s ease; }
  .timer { font-family:var(--font-mono); font-size:var(--mono-md); color:var(--gold); padding:7px 14px; border:1px solid var(--gold-dim); background:var(--gold-glow); white-space:nowrap; flex-shrink:0; }
  .timer.urgent { color:#e57373; border-color:var(--danger); background:var(--danger-soft); animation:pulse 1s infinite; }
  .topbar-btn { width:38px; height:38px; border:1px solid var(--border); background:var(--panel); color:var(--text-dim); cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:all 0.18s ease; flex-shrink:0; }
  .topbar-btn:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); transform:scale(1.08); }
  .topbar-btn.active { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); }

  .pause-overlay { position:fixed; inset:0; z-index:500; background:rgba(13,13,18,0.97); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px; animation:fadeUp 0.2s ease; }
  .pause-icon { font-size:56px; }
  .pause-title { font-family:var(--font-display); font-size:40px; font-weight:700; color:var(--text-bright); }
  .pause-sub { font-family:var(--font-mono); font-size:var(--mono-md); letter-spacing:0.15em; text-transform:uppercase; color:var(--text-dim); }
  .resume-btn { font-family:var(--font-mono); font-size:var(--mono-lg); letter-spacing:0.15em; text-transform:uppercase; background:var(--gold); border:none; color:var(--ink); padding:15px 44px; cursor:pointer; font-weight:500; transition:all 0.18s ease; margin-top:8px; }
  .resume-btn:hover { filter:brightness(1.12); box-shadow:var(--shadow-gold); transform:translateY(-2px); }

  .nav-overlay { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.6); }
  .nav-drawer { position:fixed; right:0; top:0; bottom:0; z-index:400; width:min(360px,90vw); background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; animation:slideIn 0.22s ease; }
  .nav-hdr { padding:20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .nav-hdr-title { font-family:var(--font-display); font-size:20px; font-weight:600; color:var(--text-bright); }
  .nav-close { width:34px; height:34px; border:1px solid var(--border); background:var(--panel); color:var(--text-dim); cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:all 0.18s ease; }
  .nav-close:hover { border-color:var(--danger); color:#e57373; background:var(--danger-soft); }
  .nav-stats { padding:13px 20px; display:flex; gap:16px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
  .nav-stat { font-family:var(--font-mono); font-size:var(--mono-xs); letter-spacing:0.1em; text-transform:uppercase; color:var(--text-dim); display:flex; align-items:center; gap:6px; }
  .nav-stat-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .nav-dots { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-wrap:wrap; gap:6px; align-content:flex-start; }
  .nav-dot { width:38px; height:38px; border:1px solid var(--border); background:var(--panel); color:var(--muted); cursor:pointer; font-family:var(--font-mono); font-size:var(--mono-sm); display:flex; align-items:center; justify-content:center; transition:all 0.15s ease; }
  .nav-dot:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); transform:scale(1.08); }
  .nav-dot.answered { background:var(--gold-glow); border-color:var(--gold-dim); color:var(--gold); }
  .nav-dot.flagged  { background:var(--danger-soft); border-color:var(--danger); color:#e57373; }
  .nav-dot.current  { background:var(--gold); border-color:var(--gold); color:var(--ink); }

  .exam-main { flex:1; max-width:900px; margin:0 auto; width:100%; padding:28px 24px 100px; }
  .q-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; }
  .q-counter { font-family:var(--font-mono); font-size:var(--mono-md); letter-spacing:0.14em; text-transform:uppercase; color:var(--text-dim); }
  .flag-btn { font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.1em; text-transform:uppercase; padding:9px 16px; border:1px solid var(--border); background:var(--panel); color:var(--text-dim); cursor:pointer; transition:all 0.18s ease; display:flex; align-items:center; gap:6px; }
  .flag-btn:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); transform:translateY(-1px); }
  .flag-btn.flagged { border-color:var(--danger); color:#e57373; background:var(--danger-soft); }
  .flag-btn.flagged:hover { border-color:#e57373; color:#fff; background:var(--danger); }

  .q-card { background:var(--panel); border:1px solid var(--border); padding:36px; animation:fadeUp 0.3s ease both; }
  .situation-box { margin-bottom:22px; padding:16px 18px; background:var(--surface); border:1px solid var(--border-soft); border-left:3px solid var(--gold-dim); }
  .situation-label { font-family:var(--font-mono); font-size:var(--mono-xs); letter-spacing:0.16em; text-transform:uppercase; color:var(--gold-dim); margin-bottom:7px; }
  .situation-text { font-size:15px; color:var(--text); line-height:1.6; }
  .q-text { font-family:var(--font-display); font-size:21px; font-weight:600; color:var(--text-bright); line-height:1.4; margin-bottom:26px; }
  .choices { display:flex; flex-direction:column; gap:10px; }
  .choice-btn { width:100%; text-align:left; padding:15px 20px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; font-family:var(--font-body); font-size:16px; line-height:1.5; transition:all 0.18s ease; display:flex; align-items:flex-start; gap:14px; }
  .choice-btn:hover { border-color:var(--gold); background:var(--gold-glow); color:var(--text-bright); transform:translateX(4px); }
  .choice-btn.selected { border-color:var(--gold); background:var(--gold-glow); color:var(--text-bright); }
  .choice-letter { font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.1em; color:var(--muted); padding-top:2px; flex-shrink:0; }
  .choice-btn.selected .choice-letter, .choice-btn:hover .choice-letter { color:var(--gold); }

  .conf-section { margin-top:26px; padding-top:20px; border-top:1px solid var(--border); }
  .conf-label { font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.14em; text-transform:uppercase; color:var(--text-dim); margin-bottom:12px; }
  .conf-btns { display:flex; gap:8px; }
  .conf-btn { flex:1; padding:12px; border:1px solid var(--border); background:var(--panel); font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.1em; text-transform:uppercase; color:var(--text-dim); cursor:pointer; transition:all 0.18s ease; }
  .conf-btn:hover { border-color:var(--muted); color:var(--text); transform:translateY(-1px); }
  .conf-btn.sure   { border-color:var(--emerald); color:var(--emerald-light); background:rgba(45,106,79,0.12); }
  .conf-btn.unsure { border-color:var(--danger); color:#e57373; background:var(--danger-soft); }
  .conf-btn:not(.sure):not(.unsure):hover.sure-hover { border-color:var(--emerald); color:var(--emerald-light); }

  .nav-footer { position:fixed; bottom:0; left:0; right:0; border-top:1px solid var(--border); background:var(--ink); padding:14px 24px; z-index:50; }
  .nav-footer-inner { max-width:900px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .nav-btn { font-family:var(--font-mono); font-size:var(--mono-md); letter-spacing:0.1em; text-transform:uppercase; padding:11px 22px; border:1px solid var(--border); background:var(--panel); color:var(--text-dim); cursor:pointer; transition:all 0.18s ease; }
  .nav-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); transform:translateY(-1px); }
  .nav-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .nav-center { font-family:var(--font-mono); font-size:var(--mono-md); letter-spacing:0.1em; color:var(--text-dim); }
  .submit-btn { font-family:var(--font-mono); font-size:var(--mono-md); letter-spacing:0.12em; text-transform:uppercase; padding:11px 26px; background:var(--gold); border:1px solid var(--gold); color:var(--ink); cursor:pointer; font-weight:500; transition:all 0.18s ease; }
  .submit-btn:hover { filter:brightness(1.12); box-shadow:var(--shadow-gold); transform:translateY(-1px); }
  .submit-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .modal-overlay { position:fixed; inset:0; z-index:600; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; padding:24px; animation:fadeUp 0.2s ease; }
  .modal { background:var(--panel); border:1px solid var(--border); padding:40px; max-width:440px; width:100%; box-shadow:var(--shadow); }
  .modal-title { font-family:var(--font-display); font-size:28px; font-weight:700; color:var(--text-bright); margin-bottom:10px; }
  .modal-body { font-size:16px; color:var(--text-dim); margin-bottom:22px; line-height:1.65; }
  .modal-stats { background:var(--surface); border:1px solid var(--border); padding:18px; margin-bottom:26px; display:flex; gap:24px; }
  .modal-stat { font-family:var(--font-mono); font-size:var(--mono-xs); letter-spacing:0.1em; text-transform:uppercase; color:var(--text-dim); }
  .modal-stat strong { display:block; font-family:var(--font-display); font-size:26px; color:var(--gold); margin-bottom:3px; }
  .modal-actions { display:flex; gap:10px; }
  .modal-cancel { flex:1; font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.1em; text-transform:uppercase; padding:13px; border:1px solid var(--border); background:var(--panel); color:var(--text-dim); cursor:pointer; transition:all 0.18s ease; }
  .modal-cancel:hover { border-color:var(--muted); color:var(--text); background:var(--panel-hover); }
  .modal-submit { flex:1; font-family:var(--font-mono); font-size:var(--mono-sm); letter-spacing:0.1em; text-transform:uppercase; padding:13px; background:var(--gold); border:1px solid var(--gold); color:var(--ink); cursor:pointer; font-weight:500; transition:all 0.18s ease; }
  .modal-submit:hover { filter:brightness(1.12); box-shadow:var(--shadow-gold); transform:translateY(-1px); }
  .modal-submit:disabled { opacity:0.5; cursor:not-allowed; }

  @media (max-width:600px) { .q-card{padding:22px} .q-text{font-size:18px} .exam-main{padding:20px 16px 100px} .choice-btn:hover{transform:none} }
`;

export default function ExamPage() {
  const { documentId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [confidence, setConfidence] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const hasSubmitted = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    const onVis = () => { if (document.hidden) { setPaused(true); pausedRef.current = true; } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    async function loadExam() {
      if (!sessionId) return;
      const { data: sd } = await supabase.from("exam_sessions").select("*").eq("id", sessionId).single();
      if (!sd) { alert("Session not found."); return; }
      setTimeLeft(sd.time_limit_seconds);
      const { data: qd } = await supabase.from("questions").select("*").in("id", sd.question_ids);
      if (!qd?.length) { alert("No questions found."); return; }
      const ordered = sd.question_ids.map(id => qd.find(q => q.id === id)).filter(Boolean);
      setQuestions(ordered);
      const { data: ea } = await supabase.from("exam_answers").select("*").eq("session_id", sessionId);
      if (ea?.length) {
        const ans = {}, conf = {};
        ea.forEach(a => { ans[a.question_id] = a.selected_choice; if (a.confidence) conf[a.question_id] = a.confidence; });
        setAnswers(ans); setConfidence(conf);
      }
      setLoading(false);
    }
    loadExam();
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0 && !hasSubmitted.current) { submitExam(); return; }
    const iv = setInterval(() => { if (!pausedRef.current) setTimeLeft(p => p - 1); }, 1000);
    return () => clearInterval(iv);
  }, [timeLeft]);

  function fmt(s) { if (s === null) return "0:00"; return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }

  async function saveAnswer(qId, sel) {
    setAnswers(p => ({...p, [qId]: sel}));
    await supabase.from("exam_answers").upsert([{ session_id:sessionId, question_id:qId, selected_choice:sel, confidence:confidence[qId]||null }]);
  }
  async function saveConf(qId, level) {
    setConfidence(p => ({...p, [qId]: level}));
    await supabase.from("exam_answers").upsert([{ session_id:sessionId, question_id:qId, selected_choice:answers[qId]||null, confidence:level }]);
  }
  function toggleFlag(qId) { setFlags(p => ({...p, [qId]: !p[qId]})); }

  const submitExam = useCallback(async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true; setSubmitting(true);
    const { data: sa } = await supabase.from("exam_answers").select("*").eq("session_id", sessionId);
    let score = 0;
    questions.forEach(q => { const ua = sa?.find(a => a.question_id === q.id); if (ua?.selected_choice === q.correct_choice) score++; });
    await supabase.from("exam_sessions").update({ score, completed_at: new Date().toISOString() }).eq("id", sessionId);
    router.push(`/results/${sessionId}`);
  }, [questions, sessionId, router]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"var(--ink)", color:"var(--text-dim)", fontFamily:"var(--font-mono)", fontSize:"var(--mono-md)", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      <div style={{ width:36, height:36, border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      Loading Examination…
    </div>
  );

  const q = questions[currentIndex];
  const answered = Object.keys(answers).length;
  const flagged = Object.values(flags).filter(Boolean).length;
  const isUrgent = timeLeft !== null && timeLeft < 120;

  function dotClass(item, i) {
    if (i === currentIndex) return "current";
    if (flags[item.id]) return "flagged";
    if (answers[item.id]) return "answered";
    return "";
  }

  return (
    <>
      <style>{S}</style>
      <div className="exam-wrap">
        <div className="exam-topbar">
          <div className="exam-topbar-inner">
            <div className="exam-logo">The <span>Board</span></div>
            <div className="progress-group">
              <div className="progress-labels"><span>{answered} answered</span><span>{questions.length - answered} remaining</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width:`${(answered/questions.length)*100}%` }} /></div>
            </div>
            <div className={`timer ${isUrgent ? "urgent" : ""}`}>{fmt(timeLeft)}</div>
            <button className="topbar-btn" onClick={() => setPaused(p => !p)} title="Pause">⏸</button>
            <button className={`topbar-btn ${showNav ? "active" : ""}`} onClick={() => setShowNav(v => !v)} title="Navigator">⊞</button>
          </div>
        </div>

        {paused && (
          <div className="pause-overlay">
            <div className="pause-icon">⏸</div>
            <div className="pause-title">Exam Paused</div>
            <div className="pause-sub">Your timer is frozen</div>
            <button className="resume-btn" onClick={() => setPaused(false)}>Resume Exam →</button>
          </div>
        )}

        {showNav && (
          <>
            <div className="nav-overlay" onClick={() => setShowNav(false)} />
            <div className="nav-drawer">
              <div className="nav-hdr">
                <div className="nav-hdr-title">Navigator</div>
                <button className="nav-close" onClick={() => setShowNav(false)}>✕</button>
              </div>
              <div className="nav-stats">
                <div className="nav-stat"><div className="nav-stat-dot" style={{ background:"var(--gold)" }} />{answered} Answered</div>
                <div className="nav-stat"><div className="nav-stat-dot" style={{ background:"#e57373" }} />{flagged} Flagged</div>
                <div className="nav-stat"><div className="nav-stat-dot" style={{ background:"var(--border)" }} />{questions.length - answered} Left</div>
              </div>
              <div className="nav-dots">
                {questions.map((item, i) => (
                  <button key={item.id} className={`nav-dot ${dotClass(item,i)}`} onClick={() => { setCurrentIndex(i); setShowNav(false); }}>{i+1}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">Submit Exam?</div>
              <p className="modal-body">Once submitted, you cannot change your answers.</p>
              <div className="modal-stats">
                <div className="modal-stat"><strong>{answered}</strong>Answered</div>
                <div className="modal-stat"><strong>{questions.length - answered}</strong>Unanswered</div>
                <div className="modal-stat"><strong>{flagged}</strong>Flagged</div>
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowConfirm(false)}>Review More</button>
                <button className="modal-submit" onClick={() => { setShowConfirm(false); submitExam(); }} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="exam-main">
          <div className="q-header">
            <span className="q-counter">Question {currentIndex + 1} of {questions.length}</span>
            <button className={`flag-btn ${flags[q?.id] ? "flagged" : ""}`} onClick={() => toggleFlag(q?.id)}>
              ⚑ {flags[q?.id] ? "Flagged" : "Flag"}
            </button>
          </div>
          {q && (
            <div className="q-card" key={q.id}>
              {q.situation && (
                <div className="situation-box">
                  <div className="situation-label">Situation</div>
                  <p className="situation-text">{q.situation}</p>
                </div>
              )}
              <h2 className="q-text">{currentIndex + 1}. {q.question}</h2>
              <div className="choices">
                {q.choices.map((choice, idx) => {
                  const letter = choice.charAt(0);
                  return (
                    <button key={idx} className={`choice-btn ${answers[q.id] === letter ? "selected" : ""}`} onClick={() => saveAnswer(q.id, letter)}>
                      <span className="choice-letter">{letter}.</span>
                      <span>{choice.slice(2).trim()}</span>
                    </button>
                  );
                })}
              </div>
              {answers[q.id] && (
                <div className="conf-section">
                  <div className="conf-label">How confident are you?</div>
                  <div className="conf-btns">
                    <button className={`conf-btn ${confidence[q.id] === "sure" ? "sure" : ""}`} onClick={() => saveConf(q.id, "sure")}>✓ Sure</button>
                    <button className={`conf-btn ${confidence[q.id] === "unsure" ? "unsure" : ""}`} onClick={() => saveConf(q.id, "unsure")}>? Unsure</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-footer">
          <div className="nav-footer-inner">
            <button className="nav-btn" onClick={() => setCurrentIndex(p => p > 0 ? p-1 : p)} disabled={currentIndex === 0}>← Previous</button>
            <div className="nav-center">{currentIndex + 1} / {questions.length}</div>
            {currentIndex === questions.length - 1
              ? <button className="submit-btn" onClick={() => setShowConfirm(true)} disabled={submitting}>Submit Exam</button>
              : <button className="nav-btn" onClick={() => setCurrentIndex(p => p + 1)}>Next →</button>
            }
          </div>
        </div>
      </div>
    </>
  );
}
