"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Trash2,
  Save,
  ExternalLink,
  UserPlus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { updateEventAction, deleteEventAction } from "@/app/actions/events";
import { inviteAttendeeAction, removeAttendeeAction } from "@/app/actions/attendees";
import type { Tables } from "@/lib/database.types";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Tables<"events"> | null>(null);
  const [attendees, setAttendees] = useState<Tables<"event_attendees">[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: ev } = await from(supabase,"events")
        .select("*")
        .eq("id", id);
      if (ev?.[0]) setEvent(ev[0]);

      const { data: att } = await from(supabase,"event_attendees")
        .select("*")
        .eq("event_id", id)
        .order("created_at");
      if (att) setAttendees(att);

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateEventAction(id, formData);

    if (result?.error) setError(result.error);
    setSaving(false);
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await inviteAttendeeAction(id, formData);

    if (result?.error) {
      setInviteError(result.error);
    } else {
      form.reset();
      // Reload attendees
      const supabase = createClient();
      const { data: att } = await from(supabase,"event_attendees")
        .select("*")
        .eq("event_id", id)
        .order("created_at");
      if (att) setAttendees(att);
    }
    setInviting(false);
  }

  async function handleRemoveAttendee(attendeeId: string) {
    await removeAttendeeAction(id, attendeeId);
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
  }

  async function handleDelete() {
    if (!confirm("Opravdu smazat tuto akci? Toto nelze vzit zpet.")) return;
    await deleteEventAction(id);
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/event/${event?.slug}/join?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400">Event nenalezen.</p>
        <Link href="/dashboard" className="text-purple-400 text-sm mt-4 inline-block">
          Zpet na prehled
        </Link>
      </div>
    );
  }

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/event/${event.slug}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Zpet na prehled
        </Link>
        <Link
          href={`/event/${event.slug}/moderator`}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <ExternalLink size={14} />
          Moderovat
        </Link>
      </div>

      {/* Event info form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-black italic uppercase">Nastaveni akce</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nazev
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={event.title}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Popis
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={event.description ?? ""}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="event_date" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Datum
          </label>
          <input
            id="event_date"
            name="event_date"
            type="datetime-local"
            defaultValue={event.event_date?.slice(0, 16) ?? ""}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Share link */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Odkaz pro hrace
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={eventUrl}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(eventUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Save size={14} />
            {saving ? "Ukladam..." : "Ulozit"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
            Smazat
          </button>
        </div>
      </form>

      {/* Attendees */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
          <Users size={18} className="text-purple-400" />
          Hoste ({attendees.length})
        </h2>

        {/* Invite form */}
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

        {/* Attendee list */}
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
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleRemoveAttendee(att.id)}
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
    </div>
  );
}
