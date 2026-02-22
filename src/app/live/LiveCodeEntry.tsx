"use client";

import { useRef, useState, useTransition } from "react";
import { lookupLiveCode } from "./actions";

const CODE_LENGTH = 6;

export function LiveCodeEntry() {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRefs = Array.from({ length: CODE_LENGTH }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRef<HTMLInputElement>(null)
  );

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleChange(index: number, value: string) {
    const char = value.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);

    if (char && index < CODE_LENGTH - 1) {
      inputRefs[index + 1].current?.focus();
    }

    if (char && index === CODE_LENGTH - 1 && next.every((d) => d)) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, CODE_LENGTH);
    if (!text) return;

    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setDigits(next);
    setError(null);

    if (text.length === CODE_LENGTH) {
      submit(text);
    } else {
      inputRefs[Math.min(text.length, CODE_LENGTH - 1)].current?.focus();
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
      <div className="flex justify-center gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={isPending}
            className="w-12 h-16 text-center text-2xl font-black bg-slate-900 border-2 border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 caret-purple-400 tabular-nums"
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
