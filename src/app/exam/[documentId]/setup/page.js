"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Shell from "@/components/Shell";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const S = `
  .setup-page { max-width: 560px; margin: 0 auto; padding: 48px 32px 80px; }
  .setup-eyebrow { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .setup-title { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }
  .setup-docname { font-size: 17px; color: var(--text-dim); font-style: italic; margin-bottom: 36px; }
  .section-label { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 10px; }
  .section-block { margin-bottom: 28px; }
  .divider { height: 1px; background: var(--border); margin: 28px 0; }
  .setup-input {
    font-family: var(--font-body); font-size: 16px;
    background: var(--panel); border: 1px solid var(--border);
    color: var(--text-bright); padding: 13px 14px;
    width: 100%; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .setup-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-glow); }
  .setup-input::placeholder { color: var(--muted); font-style: italic; }
  .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .preset-btn {
    padding: 18px; border: 1px solid var(--border); background: var(--panel);
    cursor: pointer; text-align: left; transition: all 0.18s ease;
    display: flex; flex-direction: column; gap: 6px;
  }
  .preset-btn:hover { border-color: var(--gold); background: var(--gold-glow); transform: translateY(-2px); box-shadow: 0 4px 16px var(--gold-glow); }
  .preset-btn.active { border-color: var(--gold); background: var(--gold-glow); }
  .preset-name { font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
  .preset-btn.active .preset-name, .preset-btn:hover .preset-name { color: var(--gold); }
  .preset-count { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--muted); }
  .preset-btn.active .preset-count, .preset-btn:hover .preset-count { color: var(--gold); }
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px; border: 1px solid var(--border); background: var(--panel);
    cursor: pointer; transition: all 0.18s ease; user-select: none;
  }
  .toggle-row:hover { background: var(--panel-hover); border-color: var(--muted); }
  .toggle-info { display: flex; flex-direction: column; gap: 4px; }
  .toggle-name { font-family: var(--font-mono); font-size: var(--mono-md); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text); }
  .toggle-desc { font-size: 15px; color: var(--text-dim); font-style: italic; }
  .toggle-sw { width: 44px; height: 25px; border-radius: 13px; border: 1px solid var(--border); background: var(--surface); position: relative; transition: all 0.2s; flex-shrink: 0; }
  .toggle-sw.on { background: var(--gold); border-color: var(--gold); }
  .toggle-knob { width: 17px; height: 17px; border-radius: 50%; background: var(--muted); position: absolute; top: 3px; left: 3px; transition: left 0.2s; }
  .toggle-sw.on .toggle-knob { left: 22px; background: var(--ink); }
  .time-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 8px; }
  .time-btn {
    padding: 13px 8px; border: 1px solid var(--border); background: var(--panel);
    color: var(--text-dim); cursor: pointer; text-align: center;
    font-family: var(--font-mono); font-size: var(--mono-sm); letter-spacing: 0.08em;
    transition: all 0.18s ease;
  }
  .time-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-2px); }
  .time-btn.active { border-color: var(--gold); background: var(--gold-glow); color: var(--gold); }
  .error-box { background: var(--danger-soft); border: 1px solid var(--danger); color: #e57373; font-family: var(--font-mono); font-size: var(--mono-sm); padding: 11px 14px; margin-bottom: 16px; }
  .start-btn {
    width: 100%; font-family: var(--font-mono); font-size: var(--mono-lg); letter-spacing: 0.14em; text-transform: uppercase;
    padding: 17px; background: var(--gold); border: 1px solid var(--gold); color: var(--ink);
    cursor: pointer; font-weight: 500; transition: all 0.18s ease;
  }
  .start-btn:hover:not(:disabled) { filter: brightness(1.12); box-shadow: var(--shadow-gold); transform: translateY(-2px); }
  .start-btn:disabled { opacity: 0.45; cursor: not-allowed; }
`;

export default function ExamSetupPage() {
  const { documentId } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [questionLimit, setQuestionLimit] = useState("all");
  const [customLimit, setCustomLimit] = useState("");
  const [randomize, setRandomize] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const [{ data: docData }, { count }, { data: userData }] = await Promise.all([
        supabase.from("documents").select("title").eq("id", documentId).single(),
        supabase.from("questions").select("*", { count:"exact", head:true }).eq("document_id", documentId),
        supabase.auth.getUser(),
      ]);
      if (docData) setDoc(docData);
      setTotalQuestions(count || 0);
      const name = userData?.user?.user_metadata?.full_name || userData?.user?.email?.split("@")[0] || "";
      if (name) setDisplayName(name);
    }
    init();
  }, [documentId]);

  const presets = [
    { value:"all", label:"All Questions", count: totalQuestions },
    { value:"10",  label:"Quick Quiz",    count: 10 },
    { value:"25",  label:"Half Set",      count: 25 },
    { value:"50",  label:"Full Practice", count: 50 },
    { value:"custom", label:"Custom",     count: null },
  ];

  async function startExam() {
    setError("");
    if (!totalQuestions) { setError("No questions available."); return; }
    setLoading(true);
    let finalLimit;
    if (questionLimit === "custom") {
      const parsed = parseInt(customLimit);
      if (!parsed || parsed <= 0) { setError("Enter a valid number."); setLoading(false); return; }
      finalLimit = Math.min(parsed, totalQuestions);
    } else if (questionLimit === "all") {
      finalLimit = totalQuestions;
    } else {
      finalLimit = Math.min(parseInt(questionLimit), totalQuestions);
    }
    const { data: allQs, error: qErr } = await supabase.from("questions").select("id,question_number").eq("document_id", documentId).order("question_number", { ascending:true });
    if (qErr || !allQs?.length) { setError("Failed to load questions."); setLoading(false); return; }
    let selected = randomize ? shuffleArray([...allQs]) : [...allQs];
    selected = selected.slice(0, finalLimit);
    const { data: userData } = await supabase.auth.getUser();
    const { data: sessionRow, error: sErr } = await supabase.from("exam_sessions").insert([{
      document_id: documentId, display_name: displayName || "Anonymous",
      user_id: userData?.user?.id || null,
      settings: { questionLimit: finalLimit, randomize },
      total_questions: finalLimit, time_limit_seconds: Number(timeLimit) * 60,
      question_ids: selected.map(q => q.id),
    }]).select().single();
    if (sErr || !sessionRow) { setError("Error starting exam."); setLoading(false); return; }
    router.push(`/exam/${documentId}?session=${sessionRow.id}`);
  }

  return (
    <Shell backHref="/" backLabel="Home">
      <style>{S}</style>
      <div className="setup-page anim-fade-up">
        <div className="setup-eyebrow">Exam Configuration</div>
        <h1 className="setup-title">Setup Your Exam</h1>
        <p className="setup-docname">{doc?.title || "Loading…"}</p>

        <div className="section-block">
          <label className="section-label">Your Name (for leaderboard)</label>
          <input className="setup-input" type="text" placeholder="Enter your name…" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div className="divider" />
        <div className="section-block">
          <label className="section-label">Number of Questions — {totalQuestions} available</label>
          <div className="preset-grid">
            {presets.filter(p => p.value !== "custom").map(p => (
              <button key={p.value} className={`preset-btn ${questionLimit === p.value ? "active" : ""}`} onClick={() => setQuestionLimit(p.value)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-count">{p.value === "all" ? totalQuestions : Math.min(p.count, totalQuestions)}</span>
              </button>
            ))}
            <button className={`preset-btn ${questionLimit === "custom" ? "active" : ""}`} onClick={() => setQuestionLimit("custom")}>
              <span className="preset-name">Custom</span>
              <span className="preset-count">{questionLimit === "custom" && customLimit ? customLimit : "?"}</span>
            </button>
          </div>
          {questionLimit === "custom" && (
            <div style={{ marginTop:8 }}>
              <input className="setup-input" type="number" placeholder={`1 – ${totalQuestions}`} value={customLimit} onChange={e => setCustomLimit(e.target.value)} min="1" max={totalQuestions} />
            </div>
          )}
        </div>
        <div className="divider" />
        <div className="section-block">
          <div className="toggle-row" onClick={() => setRandomize(r => !r)}>
            <div className="toggle-info">
              <span className="toggle-name">Randomize Questions</span>
              <span className="toggle-desc">Shuffle the order for each attempt</span>
            </div>
            <div className={`toggle-sw ${randomize ? "on" : ""}`}><div className="toggle-knob" /></div>
          </div>
        </div>
        <div className="divider" />
        <div className="section-block">
          <label className="section-label">Time Limit</label>
          <div className="time-grid">
            {[30,60,90,120].map(t => (
              <button key={t} className={`time-btn ${timeLimit == t ? "active" : ""}`} onClick={() => setTimeLimit(t)}>{t}min</button>
            ))}
          </div>
          <input className="setup-input" type="number" placeholder="Custom minutes…" value={[30,60,90,120].includes(Number(timeLimit)) ? "" : timeLimit} onChange={e => setTimeLimit(e.target.value)} min="1" />
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="start-btn" onClick={startExam} disabled={loading}>
          {loading ? "Preparing Exam…" : "Begin Examination →"}
        </button>
      </div>
    </Shell>
  );
}
