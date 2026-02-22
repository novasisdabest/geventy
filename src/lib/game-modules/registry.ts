import type { ComponentType } from "react";
import type { Tables } from "@/lib/database.types";

export interface ModeratorControlsProps {
  programId: string;
  eventId: string;
  sendCommand: (action: string, data?: Record<string, unknown>) => void;
  attendees: Tables<"event_attendees">[];
  config: Record<string, unknown>;
}

export interface PlayerCollectingProps {
  programId: string;
  attendeeId: string;
}

export interface PlayerVotingProps {
  onVote: (value: string) => void;
}

export interface PlayerResultsProps {}

export interface ProjectorScreenProps {
  eventSlug: string;
  isFullscreen?: boolean;
}

export interface GameModuleComponents {
  ModeratorControls: ComponentType<ModeratorControlsProps>;
  ProjectorScreen: ComponentType<ProjectorScreenProps>;
  PlayerCollecting: ComponentType<PlayerCollectingProps>;
  PlayerVoting: ComponentType<PlayerVotingProps>;
  PlayerResults: ComponentType<PlayerResultsProps>;
}

const GAME_MODULES: Record<string, () => Promise<GameModuleComponents>> = {
  "who-am-i": () =>
    import("@/components/games/who-am-i").then((m) => m.default),
  "two-truths": () =>
    import("@/components/games/two-truths").then((m) => m.default),
};

export async function loadGameModule(
  slug: string
): Promise<GameModuleComponents | null> {
  const loader = GAME_MODULES[slug];
  if (!loader) return null;
  return loader();
}

export function hasGameModule(slug: string): boolean {
  return slug in GAME_MODULES;
}
