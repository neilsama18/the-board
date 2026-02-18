"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ExamPage() {
  const { documentId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");

  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const hasSubmitted = useRef(false);

  // ===============================
  // LOAD SESSION + QUESTIONS
  // ===============================
  useEffect(() => {
    async function loadExam() {
      if (!sessionId) return;

      // 1️⃣ Get session
      const { data: sessionData } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!sessionData) {
        alert("Session not found.");
        return;
      }

      setSession(sessionData);
      setTimeLeft(sessionData.time_limit_seconds);

      if (!sessionData.question_ids || sessionData.question_ids.length === 0) {
        alert("No saved question order.");
        return;
      }

      // 2️⃣ Fetch only questions for this session
      const { data: questionData } = await supabase
        .from("questions")
        .select("*")
        .in("id", sessionData.question_ids);

      if (!questionData || questionData.length === 0) {
        alert("No questions found.");
        return;
      }

      // 3️⃣ REORDER strictly using session.question_ids
      const orderedQuestions = sessionData.question_ids
        .map((id) => questionData.find((q) => q.id === id))
        .filter(Boolean);

      setQuestions(orderedQuestions);
      setLoading(false);
    }

    loadExam();
  }, [sessionId, documentId]);

  // ===============================
  // TIMER
  // ===============================
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0 && !hasSubmitted.current) {
      submitExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  function formatTime(seconds) {
    if (seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // ===============================
  // SAVE ANSWER
  // ===============================
  async function saveAnswer(questionId, selected) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selected,
    }));

    await supabase.from("exam_answers").upsert([
      {
        session_id: sessionId,
        question_id: questionId,
        selected_choice: selected,
      },
    ]);
  }

  // ===============================
  // SUBMIT EXAM
  // ===============================
  async function submitExam() {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    const { data: savedAnswers } = await supabase
      .from("exam_answers")
      .select("*")
      .eq("session_id", sessionId);

    let score = 0;

    if (savedAnswers && savedAnswers.length > 0) {
      questions.forEach((q) => {
        const userAnswer = savedAnswers.find(
          (a) => a.question_id === q.id
        );

        if (
          userAnswer &&
          userAnswer.selected_choice === q.correct_choice
        ) {
          score++;
        }
      });
    }

    await supabase
      .from("exam_sessions")
      .update({
        score: score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    router.push(`/results/${sessionId}`);
  }

  if (loading || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading Exam...
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Error loading question.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="text-sm font-semibold tracking-wide">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-bold text-red-600">
            Time Remaining: {formatTime(timeLeft)}
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="bg-white p-8 rounded-xl border shadow-sm">

          {/* SITUATION — show only if present */}
          {currentQuestion.situation && (
            <div className="mb-4 p-4 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Situation
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {currentQuestion.situation}
              </p>
            </div>
          )}

          <h2 className="text-lg font-semibold leading-relaxed mb-8">
            {currentIndex + 1}. {currentQuestion.question}
          </h2>

          <div className="space-y-4">
            {currentQuestion.choices.map((choice, index) => {
              const letter = choice.charAt(0);
              const isSelected =
                answers[currentQuestion.id] === letter;

              return (
                <button
                  key={index}
                  onClick={() =>
                    saveAnswer(currentQuestion.id, letter)
                  }
                  className={`w-full text-left rounded-lg border px-5 py-3 text-sm leading-relaxed transition
                    ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white hover:bg-slate-100"
                    }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between mt-10">
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : prev
                )
              }
              className="px-5 py-2 border rounded-lg text-sm font-medium"
            >
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={submitExam}
                disabled={submitting}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentIndex((prev) => prev + 1)
                }
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
