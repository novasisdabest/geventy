"use client";

import { useState } from "react";
import { Copy, Check, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { inviteAttendeeAction, removeAttendeeAction } from "@/app/actions/attendees";
import type { Tables } from "@/lib/database.types";

interface AttendeesTabProps {
  eventId: string;
  eventSlug: string;
  initialAttendees: Tables<"event_attendees">[];
}

export default function AttendeesTab({ eventId, eventSlug, initialAttendees }: AttendeesTabProps) {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await inviteAttendeeAction(eventId, formData);

    if (result?.error) {
      setInviteError(result.error);
    } else {
      form.reset();
      const supabase = createClient();
      const { data: att } = await from(supabase, "event_attendees")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at");
      if (att) setAttendees(att);
    }
    setInviting(false);
  }

  async function handleRemove(attendeeId: string) {
    await removeAttendeeAction(eventId, attendeeId);
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/event/${eventSlug}/join?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-black italic uppercase">Hoste ({attendees.length})</h2>

      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
        <input
          name="display_name"
          type="text"
          required
          placeholder="Jmeno"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={inviting}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
        >
          <UserPlus size={14} />
          {inviting ? "..." : "Pozvat"}
        </button>
      </form>

      {inviteError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
          {inviteError}
        </div>
      )}

      <div className="space-y-2">
        {attendees.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${att.email}`}
                  alt={att.display_name}
                  className="w-full h-full"
                />
              </div>
              <div>
                <div className="text-sm font-bold">{att.display_name}</div>
                <div className="text-[10px] text-slate-500">{att.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  att.status === "confirmed"
                    ? "bg-green-500/20 text-green-400"
                    : att.status === "declined"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-700 text-slate-400"
                }`}
              >
                {att.status}
              </span>
              <button
                onClick={() => copyInviteLink(att.invite_token)}
                className="text-slate-500 hover:text-purple-400 transition-colors"
                title="Kopirovat odkaz s pozvankou"
              >
                {copied === att.invite_token ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                onClick={() => handleRemove(att.id)}
                className="text-slate-600 hover:text-red-400 transition-colors"
                title="Odebrat hosta"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {attendees.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">
            Zatim zadni hoste. Pridej prvniho vyse.
          </p>
        )}
      </div>
    </div>
  );
}
