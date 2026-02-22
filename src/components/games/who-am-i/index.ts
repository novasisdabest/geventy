import type { GameModuleComponents } from "@/lib/game-modules/registry";
import { ModeratorControls } from "./ModeratorControls";
import { ProjectorScreen } from "./ProjectorScreen";
import { FactCollection } from "./FactCollection";
import { VotingScreen } from "./VotingScreen";
import { ResultsScreen } from "./ResultsScreen";

const module: GameModuleComponents = {
  ModeratorControls: ModeratorControls as GameModuleComponents["ModeratorControls"],
  ProjectorScreen,
  PlayerCollecting: FactCollection as GameModuleComponents["PlayerCollecting"],
  PlayerVoting: VotingScreen as GameModuleComponents["PlayerVoting"],
  PlayerResults: ResultsScreen,
};

export default module;
