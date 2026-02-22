export interface TwoTruthsRoundData {
  statements: string[];
  correct_lie_index: number;
  player_name: string;
  player_id: string;
  round: number;
  total: number;
}

export interface StatementSubmission {
  attendee_id: string;
  display_name: string;
  statements: string[];
  lie_index: number;
}
