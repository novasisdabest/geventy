import { create } from "zustand";

export interface WhoAmIFactOption {
  attendee_id: string;
  name: string;
}

export interface WhoAmIRoundData {
  fact: string;
  correct_attendee_id: string;
  options: WhoAmIFactOption[];
}

export interface GameCommand {
  action: string;
  data?: Record<string, unknown>;
}

export interface OnlinePlayer {
  attendee_id: string;
  display_name: string;
  avatar_seed: string;
  is_display?: boolean;
}

export interface ActiveBlock {
  id: string;
  type: "game" | "custom" | "slideshow" | "message_wall";
  title: string;
  gameSlug?: string;
  config?: Record<string, unknown>;
}

interface GameState {
  // Event context
  eventId: string | null;
  programId: string | null;

  // Game phase
  phase: "lobby" | "collecting" | "playing" | "voting" | "results" | "finished";

  // Who Am I specific
  currentRound: number;
  totalRounds: number;
  currentFact: WhoAmIRoundData | null;
  votes: Record<string, number>;
  scores: Record<string, number>;
  myVote: string | null;
  myFactSubmitted: boolean;

  // Active block (display/projector)
  activeBlock: ActiveBlock | null;

  // Online presence
  onlinePlayers: OnlinePlayer[];

  // Actions
  setEventContext: (eventId: string, programId: string | null) => void;
  setActiveBlock: (block: ActiveBlock) => void;
  clearActiveBlock: () => void;
  setPhase: (phase: GameState["phase"]) => void;
  showFact: (round: number, total: number, data: WhoAmIRoundData) => void;
  castVote: (attendeeId: string) => void;
  updateVotes: (votes: Record<string, number>) => void;
  showResults: (correctId: string, votes: Record<string, number>) => void;
  updateScores: (scores: Record<string, number>) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  setMyFactSubmitted: (submitted: boolean) => void;
  reset: () => void;
}

const initialState = {
  eventId: null,
  programId: null,
  phase: "lobby" as const,
  currentRound: 0,
  totalRounds: 0,
  currentFact: null,
  votes: {},
  scores: {},
  myVote: null,
  myFactSubmitted: false,
  activeBlock: null,
  onlinePlayers: [],
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setEventContext: (eventId, programId) => set({ eventId, programId }),

  setActiveBlock: (block) => set({ activeBlock: block, phase: "lobby" }),

  clearActiveBlock: () => set({ activeBlock: null }),

  setPhase: (phase) => set({ phase, myVote: null }),

  showFact: (round, total, data) =>
    set({
      phase: "voting",
      currentRound: round,
      totalRounds: total,
      currentFact: data,
      votes: {},
      myVote: null,
    }),

  castVote: (attendeeId) => set({ myVote: attendeeId }),

  updateVotes: (votes) => set({ votes }),

  showResults: (_correctId, votes) => set({ phase: "results", votes }),

  updateScores: (scores) => set({ scores }),

  setOnlinePlayers: (players) => set({ onlinePlayers: players }),

  setMyFactSubmitted: (submitted) => set({ myFactSubmitted: submitted }),

  reset: () => set(initialState),
}));
