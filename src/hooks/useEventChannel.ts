"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useGameStore, type GameCommand, type OnlinePlayer, type ActiveBlock } from "@/stores/game-store";

interface UseEventChannelOptions {
  eventId: string;
  attendeeId: string;
  displayName: string;
  isModerator?: boolean;
  isDisplay?: boolean;
}

export function useEventChannel({
  eventId,
  attendeeId,
  displayName,
  isModerator = false,
  isDisplay = false,
}: UseEventChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`event:${eventId}`, {
      config: { presence: { key: attendeeId } },
    });

    // Presence - track online players
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{
        attendee_id: string;
        display_name: string;
        avatar_seed: string;
        is_display?: boolean;
      }>();

      const players: OnlinePlayer[] = Object.values(state)
        .flat()
        .map((p) => ({
          attendee_id: p.attendee_id,
          display_name: p.display_name,
          avatar_seed: p.attendee_id.slice(0, 8),
          is_display: p.is_display,
        }));

      useGameStore.getState().setOnlinePlayers(players);
    });

    // Game commands from moderator
    channel.on("broadcast", { event: "game_command" }, ({ payload }) => {
      const cmd = payload as GameCommand;
      const store = useGameStore.getState();

      switch (cmd.action) {
        case "start_collecting":
          store.setPhase("collecting");
          break;

        case "show_fact":
          store.showFact(
            cmd.data?.round as number,
            cmd.data?.total as number,
            {
              fact: cmd.data?.fact as string,
              correct_attendee_id: cmd.data?.correct_attendee_id as string,
              options: cmd.data?.options as { attendee_id: string; name: string }[],
            }
          );
          break;

        case "show_results":
          store.showResults(
            cmd.data?.correct_attendee_id as string,
            cmd.data?.votes as Record<string, number>
          );
          break;

        case "update_scores":
          store.updateScores(cmd.data?.scores as Record<string, number>);
          break;

        case "finish":
          store.setPhase("finished");
          break;

        case "set_phase":
          store.setPhase(cmd.data?.phase as GameCommand["action"] & string as typeof store.phase);
          break;

        case "block_activate":
          store.setActiveBlock({
            id: cmd.data?.id as string,
            type: cmd.data?.type as ActiveBlock["type"],
            title: cmd.data?.title as string,
            gameSlug: cmd.data?.gameSlug as string | undefined,
            config: cmd.data?.config as Record<string, unknown> | undefined,
          });
          break;

        case "block_deactivate":
          store.clearActiveBlock();
          store.reset();
          break;
      }
    });

    // Live vote counter (lightweight broadcast from players)
    channel.on("broadcast", { event: "vote_cast" }, ({ payload }) => {
      if (isModerator || isDisplay) {
        const votes = useGameStore.getState().votes;
        const votedFor = payload.voted_for as string;
        useGameStore.getState().updateVotes({
          ...votes,
          [votedFor]: (votes[votedFor] || 0) + 1,
        });
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          attendee_id: attendeeId,
          display_name: displayName,
          avatar_seed: attendeeId.slice(0, 8),
          is_moderator: isModerator,
          is_display: isDisplay,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [eventId, attendeeId, displayName, isModerator, isDisplay, supabase]);

  const sendCommand = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "game_command",
        payload: { action, data },
      });
    },
    []
  );

  const sendVote = useCallback(
    (votedForAttendeeId: string) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "vote_cast",
        payload: { voted_for: votedForAttendeeId, voter: attendeeId },
      });
    },
    [attendeeId]
  );

  return { sendCommand, sendVote, channel: channelRef };
}
