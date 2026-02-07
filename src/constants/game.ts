export const NEXT_STAGE = {
  lobby: "countdown",
  countdown: "game",
  game: "winner",
  winner: "lobby",
} as const;

export const TIMER_STAGE = {
  lobby: -1,
  countdown: 3,
  game: 0,
  winner: 5,
} as const;

export type StageKeyType = keyof typeof NEXT_STAGE;
