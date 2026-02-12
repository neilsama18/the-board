"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,created_at")
        .order("created_at", { ascending: false });

      if (!error) setDocs(data || []);
      setLoading(false);
    }
    loadDocs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">The Board</h1>
          <p className="mt-1 text-sm text-slate-600">
            Board Exam Simulator • PDF-to-Exam via Telegram • Public Link Access
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Available Reviewer Sets</h2>
            <p className="text-sm text-slate-600">
              Choose a document to start an exam.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-white">
          <div className="border-b px-5 py-3 text-sm font-medium text-slate-700">
            Documents
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-600">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">
              No documents yet. Send a PDF via Telegram to your workflow.
            </div>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold">{d.title}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/exam/${d.id}/setup`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Start Exam
                      </Link>
                      <Link
                        href={`/leaderboard/${d.id}`}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Leaderboard
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-xs text-slate-500">
        Tip: Keep your workflow running so new PDFs appear here automatically.
      </footer>
    </div>
  );
}
