"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamSetupPage() {
  const { documentId } = useParams();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [questionLimit, setQuestionLimit] = useState("all");
  const [customLimit, setCustomLimit] = useState("");
  const [randomize, setRandomize] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("document_id", documentId);

      setTotalQuestions(count || 0);
    }

    fetchCount();
  }, [documentId]);

  async function startExam() {
    if (!totalQuestions) {
      alert("No questions available.");
      return;
    }

    setLoading(true);

    // Determine finalLimit
    let finalLimit;
    if (questionLimit === "custom") {
      const parsed = parseInt(customLimit);
      if (!parsed || parsed <= 0) {
        alert("Enter a valid number.");
        setLoading(false);
        return;
      }
      finalLimit = Math.min(parsed, totalQuestions);
    } else if (questionLimit === "all") {
      finalLimit = totalQuestions;
    } else {
      finalLimit = Math.min(parseInt(questionLimit), totalQuestions);
    }

    // ✅ Fetch ALL question IDs first (stable order)
    const { data: allQs, error: qErr } = await supabase
      .from("questions")
      .select("id, question_number")
      .eq("document_id", documentId)
      .order("question_number", { ascending: true });

    if (qErr || !allQs || allQs.length === 0) {
      console.log(qErr);
      alert("Failed to load questions.");
      setLoading(false);
      return;
    }

    // Build the selected list of IDs
    let selected = [...allQs];

    // Randomize (optional)
    if (randomize) {
      selected = shuffleArray(selected);
    }

    // Limit
    selected = selected.slice(0, finalLimit);

    // ✅ Save the exact UUIDs that will be used
    const questionIds = selected.map((q) => q.id);

    const { data: sessionRow, error: sErr } = await supabase
      .from("exam_sessions")
      .insert([
        {
          document_id: documentId,
          display_name: displayName || "Anonymous",
          settings: {
            questionLimit: finalLimit,
            randomize,
          },
          total_questions: finalLimit,
          time_limit_seconds: Number(timeLimit) * 60,
          question_ids: questionIds, // ✅ IMPORTANT
        },
      ])
      .select()
      .single();

    if (sErr || !sessionRow) {
      console.log(sErr);
      alert("Error starting exam.");
      setLoading(false);
      return;
    }

    router.push(`/exam/${documentId}?session=${sessionRow.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Exam Setup</h1>

        <div className="bg-white rounded-xl border p-8 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Name (for leaderboard)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Questions (Total available: {totalQuestions})
            </label>

            <select
              value={questionLimit}
              onChange={(e) => setQuestionLimit(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
            >
              <option value="all">All Questions</option>
              <option value="10">10 Questions</option>
              <option value="20">20 Questions</option>
              <option value="50">50 Questions</option>
              <option value="custom">Custom</option>
            </select>

            {questionLimit === "custom" && (
              <input
                type="number"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                placeholder="Enter custom number"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                min="1"
                max={totalQuestions}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Randomize Questions</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              min="5"
            />
          </div>

          <button
            onClick={startExam}
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
