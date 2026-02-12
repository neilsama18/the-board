"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      // 1️⃣ Get session
      const { data: sessionData } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!sessionData) return;

      setSession(sessionData);

      // 2️⃣ Get ONLY the questions taken (preserve order)
      const { data: questionData } = await supabase
        .from("questions")
        .select("*")
        .in("id", sessionData.question_ids);

      if (!questionData) return;

      // 🔥 Preserve exact order using question_ids
      const orderedQuestions = sessionData.question_ids.map((id) =>
        questionData.find((q) => q.id === id)
      );

      // 3️⃣ Get answers
      const { data: answerData } = await supabase
        .from("exam_answers")
        .select("*")
        .eq("session_id", sessionId);

      setQuestions(orderedQuestions);
      setAnswers(answerData || []);
      setLoading(false);
    }

    loadResults();
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading Results...
      </div>
    );
  }

  const percentage =
    session.total_questions > 0
      ? Math.round((session.score / session.total_questions) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Header */}
        <div className="bg-white rounded-xl border p-8 mb-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Exam Results</h1>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">
                {session.score}
              </div>
              <div className="text-sm text-slate-600">
                Correct Answers
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold">
                {session.total_questions}
              </div>
              <div className="text-sm text-slate-600">
                Total Questions
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-indigo-600">
                {percentage}%
              </div>
              <div className="text-sm text-slate-600">
                Final Score
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const userAnswer = answers.find(
              (a) => a.question_id === q.id
            );

            const isCorrect =
              userAnswer?.selected_choice === q.correct_choice;

            return (
              <div
                key={q.id}
                className="bg-white border rounded-xl p-6 shadow-sm"
              >
                <h2 className="font-semibold mb-4">
                  {index + 1}. {q.question}
                </h2>

                <div className="space-y-2">
                  {q.choices.map((choice, i) => {
                    const letter = choice.charAt(0);
                    const isUserChoice =
                      userAnswer?.selected_choice === letter;
                    const isCorrectChoice =
                      q.correct_choice === letter;

                    return (
                      <div
                        key={i}
                        className={`px-4 py-2 rounded border text-sm
                          ${
                            isCorrectChoice
                              ? "bg-green-100 border-green-400"
                              : isUserChoice && !isCorrect
                              ? "bg-red-100 border-red-400"
                              : "bg-white"
                          }
                        `}
                      >
                        {choice}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-sm text-slate-700">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
