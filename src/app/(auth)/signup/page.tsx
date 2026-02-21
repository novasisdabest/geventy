"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signupAction } from "@/app/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signupAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-bold text-white text-lg">G</span>
          </div>
        </Link>
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white">
          Registrace
        </h1>
        <p className="text-sm text-slate-400">
          Vytvor si ucet a zacni tvorit eventy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cele jmeno
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Jan Novak"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="jan@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Heslo
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Min. 6 znaku"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          {loading ? "Vytvarim ucet..." : "Vytvorit ucet"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Uz mas ucet?{" "}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
          Prihlasit se
        </Link>
      </p>
    </div>
  );
}
