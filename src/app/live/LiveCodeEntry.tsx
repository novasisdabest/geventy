"use client";

import { useRef, useState, useTransition } from "react";
import { lookupLiveCode } from "./actions";

export function LiveCodeEntry() {
  const [letters, setLetters] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleChange(index: number, value: string) {
    const char = value.slice(-1).toUpperCase();
    if (char && !/^[A-Z]$/.test(char)) return;

    const next = [...letters];
    next[index] = char;
    setLetters(next);
    setError(null);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 filled
    if (char && index === 3 && next.every((l) => l)) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !letters[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4);
    if (!text) return;

    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setLetters(next);
    setError(null);

    if (text.length === 4) {
      submit(text);
    } else {
      inputRefs[Math.min(text.length, 3)].current?.focus();
    }
  }

  function submit(code: string) {
    startTransition(async () => {
      const result = await lookupLiveCode(code);
      if (result.error) {
        setError(result.error);
        triggerShake();
      }
    });
  }

  return (
    <div className={shake ? "animate-shake" : ""}>
      <div className="flex justify-center gap-3">
        {letters.map((letter, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            maxLength={1}
            value={letter}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={isPending}
            className="w-16 h-20 text-center text-3xl font-black uppercase bg-slate-900 border-2 border-slate-700 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 caret-purple-400"
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-bold mt-4">{error}</p>
      )}

      {isPending && (
        <p className="text-purple-400 text-sm font-bold mt-4 animate-pulse">
          Hledam...
        </p>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
