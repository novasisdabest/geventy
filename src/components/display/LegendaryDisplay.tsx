"use client";

import { useEffect, useRef } from "react";
import { Flame, Trophy, Star, Zap } from "lucide-react";
import { useGameStore, type Achievement } from "@/stores/game-store";

const SCALE_MAX = 1000;

const TIERS = [
  { min: 0, label: "Nudny vecírek", color: "text-slate-500" },
  { min: 100, label: "Cajovy dychanek", color: "text-slate-400" },
  { min: 250, label: "Solidni party", color: "text-purple-400" },
  { min: 500, label: "Epická noc", color: "text-pink-400" },
  { min: 750, label: "LEGENDARY", color: "text-amber-400" },
];

function getTier(score: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

const ACHIEVEMENT_ICONS: Record<string, typeof Flame> = {
  group_photo: Star,
  icebreaker_complete: Zap,
  midnight_surprise: Star,
  table_dance: Flame,
  game_completed: Trophy,
  full_attendance: Trophy,
};

interface LegendaryDisplayProps {
  eventTitle: string;
}

export function LegendaryDisplay({ eventTitle }: LegendaryDisplayProps) {
  const achievements = useGameStore((s) => s.achievements);
  const score = useGameStore((s) => s.legendaryScore);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const tier = getTier(score);
  const progress = Math.min(score / SCALE_MAX, 1);

  // Auto-scroll feed when new achievements arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [achievements.length]);

  // Top players by appearance in achievements metadata (simplified leaderboard)
  const playerMentions: Record<string, number> = {};
  for (const player of onlinePlayers) {
    if (!player.is_display) {
      playerMentions[player.display_name] = 0;
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,_var(--tw-gradient-stops))] from-pink-600/8 via-transparent to-transparent" />

      <div className="relative z-10 flex h-screen p-8 gap-8">
        {/* Left panel — Score */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-600 mb-2">
            {eventTitle}
          </p>

          <h2 className="text-[10rem] leading-none font-black italic tabular-nums bg-gradient-to-b from-white via-purple-200 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
            {score}
          </h2>

          <div className="flex items-center gap-3 mt-2 mb-8">
            <Flame
              size={24}
              className={`${tier.color} ${score >= 750 ? "animate-pulse" : ""}`}
            />
            <span className={`text-2xl font-black italic uppercase tracking-wider ${tier.color}`}>
              {tier.label}
            </span>
            <Flame
              size={24}
              className={`${tier.color} ${score >= 750 ? "animate-pulse" : ""}`}
            />
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-lg">
            <div className="h-4 rounded-full bg-slate-800/80 border border-slate-700/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 transition-all duration-1000 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <span>0</span>
              {TIERS.slice(1).map((t) => (
                <span
                  key={t.min}
                  className={score >= t.min ? t.color : ""}
                >
                  {t.min}
                </span>
              ))}
            </div>
          </div>

          {/* Online count */}
          <div className="mt-12 flex items-center gap-2 text-slate-500 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {onlinePlayers.filter((p) => !p.is_display).length} hracu online
          </div>
        </div>

        {/* Right panel — Feed + Leaderboard */}
        <div className="w-96 flex flex-col gap-6">
          {/* Achievement Feed */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col">
            <h3 className="text-xs font-black italic uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
              <Trophy size={14} /> Achievementy
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
              {achievements.length === 0 && (
                <p className="text-sm text-slate-600 text-center py-8">
                  Zatim zadne achievementy...
                </p>
              )}

              {achievements.map((a, i) => (
                <AchievementCard key={a.id ?? i} achievement={a} isNew={i === achievements.length - 1} />
              ))}
              <div ref={feedEndRef} />
            </div>
          </div>

          {/* Mini leaderboard */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-black italic uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
              <Flame size={14} /> King of the Night
            </h3>
            {onlinePlayers.filter((p) => !p.is_display).length > 0 ? (
              <div className="space-y-2">
                {onlinePlayers
                  .filter((p) => !p.is_display)
                  .slice(0, 5)
                  .map((player, i) => (
                    <div
                      key={player.attendee_id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
                    >
                      <span
                        className={`text-sm font-black w-6 text-center ${
                          i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <img
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.avatar_seed}`}
                        alt={player.display_name}
                        className="w-7 h-7"
                      />
                      <span className="text-sm text-slate-300 font-bold truncate flex-1">
                        {player.display_name}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">
                Cekam na hrace...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, isNew }: { achievement: Achievement; isNew: boolean }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.achievement_type] ?? Star;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
        isNew
          ? "bg-purple-600/20 border-purple-500/50 animate-in slide-in-from-right"
          : "bg-slate-800/40 border-slate-800"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{achievement.title}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
          {new Date(achievement.awarded_at).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <span className="text-sm font-black text-purple-400 shrink-0">
        +{achievement.points}
      </span>
    </div>
  );
}
