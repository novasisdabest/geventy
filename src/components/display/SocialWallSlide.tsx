"use client";

import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Star } from "lucide-react";
import type { SocialMessage, SocialPhoto } from "@/stores/game-store";

interface SocialWallSlideProps {
  messages: SocialMessage[];
  photos: SocialPhoto[];
  legendaryScore: number;
  eventSlug: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "prave ted";
  if (mins < 60) return `pred ${mins}m`;
  return `pred ${Math.floor(mins / 60)}h`;
}

export function SocialWallSlide({
  messages,
  photos,
  legendaryScore,
  eventSlug,
}: SocialWallSlideProps) {
  const [gridPhotos, setGridPhotos] = useState<SocialPhoto[]>([]);

  // Reshuffle photo grid every 5s
  useEffect(() => {
    if (photos.length === 0) return;
    setGridPhotos(shuffleArray(photos).slice(0, 3));

    if (photos.length <= 9) return;

    const interval = setInterval(() => {
      setGridPhotos(shuffleArray(photos).slice(0, 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [photos]);

  const lastMessages = useMemo(() => messages.slice(-4).reverse(), [messages]);

  const eventUrl = `https://geventy.vercel.app/event/${eventSlug}`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Photo grid background */}
      {gridPhotos.length > 0 ? (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-1 gap-1 opacity-40">
          {gridPhotos.map((photo, i) => (
            <div key={`${photo.id}-${i}`} className="relative overflow-hidden">
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-slate-950 to-pink-900/30" />
      )}

      {/* Scan lines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        }}
      />

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end p-8">
        {/* Score — top right */}
        {legendaryScore > 0 && (
          <div className="absolute top-8 right-8 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
            <Star size={20} className="text-yellow-500" />
            <span className="text-2xl font-black text-yellow-400">
              {legendaryScore}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-500/70">
              PTS
            </span>
          </div>
        )}

        {/* Title */}
        <div className="absolute top-8 left-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white/80">
            Social Wall
          </h2>
        </div>

        {/* Messages — bottom left */}
        <div className="flex-1" />
        <div className="flex items-end justify-between gap-8">
          <div className="flex-1 max-w-xl space-y-3">
            {lastMessages.length === 0 && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4">
                <p className="text-slate-400 text-sm italic">
                  Zatim zadne zpravy... Bud prvni!
                </p>
              </div>
            )}
            {lastMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-left"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white">
                    {msg.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-white">
                    {msg.display_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p className="text-white/90 text-base leading-relaxed pl-11">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>

          {/* QR — bottom right */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="p-3 rounded-xl bg-white">
              <QRCodeSVG
                value={eventUrl}
                size={80}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pripoj se
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
