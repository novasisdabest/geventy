"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

interface ShellUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ShellProps {
  children: React.ReactNode;
  user?: ShellUser | null;
}

export function Shell({ children, user }: ShellProps) {
  const avatarSeed = user?.email ?? "anon";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-bold text-white">G</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Geventy<span className="text-purple-400">.com</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Moje Akce
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                      alt="Avatar"
                    />
                  </div>
                  <button
                    onClick={() => signOutAction()}
                    className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    Odhlasit
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <LogIn size={14} />
                Prihlasit se
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
