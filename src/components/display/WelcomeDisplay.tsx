"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AttendeeRosterDisplay } from "@/components/display/AttendeeRosterDisplay";
import type { OnlinePlayer } from "@/stores/game-store";

interface Attendee {
  id: string;
  display_name: string;
  status: string;
  user_id: string | null;
}

interface WelcomeDisplayProps {
  eventTitle: string;
  eventSlug: string;
  onlineCount: number;
  attendees: Attendee[];
  onlinePlayers: OnlinePlayer[];
}

export function WelcomeDisplay({
  eventTitle,
  eventSlug,
  onlineCount,
  attendees,
  onlinePlayers,
}: WelcomeDisplayProps) {
  const [slide, setSlide] = useState<"qr" | "roster">("qr");

  useEffect(() => {
    // Only rotate if there are attendees to show
    if (attendees.length === 0) return;

    const interval = setInterval(() => {
      setSlide((prev) => (prev === "qr" ? "roster" : "qr"));
    }, 15_000);

    return () => clearInterval(interval);
  }, [attendees.length]);

  const eventUrl = `https://geventy.vercel.app/event/${eventSlug}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* QR Slide */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          slide === "qr" ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/5 via-transparent to-transparent" />

          <div className="text-center z-10 space-y-8">
            <h1 className="text-7xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              {eventTitle}
            </h1>

            <div className="flex flex-col items-center gap-6">
              <div className="p-6 rounded-3xl bg-white">
                <QRCodeSVG
                  value={eventUrl}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>
              <p className="text-3xl font-black italic uppercase tracking-wider text-purple-300">
                geventy.com/event/{eventSlug}
              </p>
            </div>

            <p className="text-2xl text-slate-400 font-medium uppercase tracking-widest">
              Naskenuj a pripoj se
            </p>

            <div className="flex items-center justify-center gap-3 text-xl text-slate-500">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              {onlineCount} hracu online
            </div>
          </div>
        </div>
      </div>

      {/* Roster Slide */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          slide === "roster" ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <AttendeeRosterDisplay
          attendees={attendees}
          onlinePlayers={onlinePlayers}
          eventTitle={eventTitle}
          eventSlug={eventSlug}
        />
      </div>
    </div>
  );
}
