"use client";

import { QRCodeSVG } from "qrcode.react";
import type { OnlinePlayer } from "@/stores/game-store";

interface Attendee {
  id: string;
  display_name: string;
  status: string;
  user_id: string | null;
}

interface AttendeeRosterDisplayProps {
  attendees: Attendee[];
  onlinePlayers: OnlinePlayer[];
  eventTitle: string;
  eventSlug: string;
}

type AttendeeState = "online" | "confirmed" | "invited";

function getAttendeeState(
  attendee: Attendee,
  onlinePlayers: OnlinePlayer[]
): AttendeeState {
  const isOnline = onlinePlayers.some(
    (p) => !p.is_display && p.display_name === attendee.display_name
  );
  if (isOnline) return "online";
  if (attendee.status === "confirmed") return "confirmed";
  return "invited";
}

const stateStyles: Record<AttendeeState, string> = {
  online:
    "border-green-500/60 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
  confirmed: "border-purple-500/40 bg-purple-500/10",
  invited: "border-slate-700/50 bg-slate-800/30 opacity-50",
};

const badgeStyles: Record<AttendeeState, { label: string; className: string }> = {
  online: {
    label: "ONLINE",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  confirmed: {
    label: "CEKA",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  invited: {
    label: "POZVAN",
    className: "bg-slate-700/40 text-slate-500 border-slate-600/30",
  },
};

export function AttendeeRosterDisplay({
  attendees,
  onlinePlayers,
  eventTitle,
  eventSlug,
}: AttendeeRosterDisplayProps) {
  const eventUrl = `https://geventy.vercel.app/event/${eventSlug}`;
  const onlineCount = onlinePlayers.filter((p) => !p.is_display).length;

  // Sort: online first, then confirmed, then invited
  const sorted = [...attendees].sort((a, b) => {
    const order: Record<AttendeeState, number> = {
      online: 0,
      confirmed: 1,
      invited: 2,
    };
    return (
      order[getAttendeeState(a, onlinePlayers)] -
      order[getAttendeeState(b, onlinePlayers)]
    );
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20 p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/5 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-[1400px] flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            {eventTitle}
          </h1>
          <p className="text-2xl font-black italic uppercase tracking-wider text-purple-400">
            Kdo dorazi?
          </p>
        </div>

        {/* Main layout: attendee cards wrapping around centered QR */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3">
          {/* First half of attendees */}
          {sorted.slice(0, Math.ceil(sorted.length / 2)).map((att) => {
            const state = getAttendeeState(att, onlinePlayers);
            const badge = badgeStyles[state];
            return (
              <AttendeeCard
                key={att.id}
                attendee={att}
                stateClass={stateStyles[state]}
                badge={badge}
                state={state}
              />
            );
          })}

          {/* QR Code in the center */}
          <div className="flex flex-col items-center gap-2 mx-4">
            <div className="p-4 rounded-2xl bg-white">
              <QRCodeSVG
                value={eventUrl}
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-purple-300/70">
              Naskenuj a pripoj se
            </p>
          </div>

          {/* Second half of attendees */}
          {sorted.slice(Math.ceil(sorted.length / 2)).map((att) => {
            const state = getAttendeeState(att, onlinePlayers);
            const badge = badgeStyles[state];
            return (
              <AttendeeCard
                key={att.id}
                attendee={att}
                stateClass={stateStyles[state]}
                badge={badge}
                state={state}
              />
            );
          })}
        </div>

        {/* Counter */}
        <div className="flex items-center gap-3 text-xl text-slate-400 font-medium uppercase tracking-widest">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          {onlineCount}/{attendees.length} hostu pripojeno
        </div>
      </div>
    </div>
  );
}

function AttendeeCard({
  attendee,
  stateClass,
  badge,
  state,
}: {
  attendee: Attendee;
  stateClass: string;
  badge: { label: string; className: string };
  state: AttendeeState;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-700 ${stateClass}`}
    >
      <div className="relative">
        <img
          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${attendee.id}`}
          alt={attendee.display_name}
          className="w-9 h-9 rounded-lg"
        />
        {state === "online" && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-slate-950" />
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white leading-tight">
          {attendee.display_name}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border w-fit ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}
