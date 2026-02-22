import type { GameModuleComponents } from "@/lib/game-modules/registry";
import { ModeratorControls } from "./ModeratorControls";
import { ProjectorScreen } from "./ProjectorScreen";
import { StatementCollection } from "./StatementCollection";
import { LieVoting } from "./LieVoting";
import { LieResults } from "./LieResults";

const module: GameModuleComponents = {
  ModeratorControls,
  ProjectorScreen,
  PlayerCollecting: StatementCollection,
  PlayerVoting: LieVoting,
  PlayerResults: LieResults,
};

export default module;
