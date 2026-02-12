"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LeaderboardPage() {
  const { documentId } = useParams();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      const { data } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("document_id", documentId)
        .not("score", "is", null)
        .order("score", { ascending: false });

      setSessions(data || []);
      setLoading(false);
    }

    loadLeaderboard();
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Leaderboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Leaderboard</h1>

          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100"
          >
            Back to Home
          </button>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Percentage</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((s, index) => {
                const percentage =
                  s.total_questions > 0
                    ? Math.round((s.score / s.total_questions) * 100)
                    : 0;

                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3">
                      {s.display_name}
                    </td>
                    <td className="px-4 py-3">
                      {s.score} / {s.total_questions}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
