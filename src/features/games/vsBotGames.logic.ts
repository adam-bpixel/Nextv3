import type { NonEmptyArray } from '../../core/context';
import type { CommandHandler } from '../../core/types';
import { type Move, playMoveGame } from './engines/moveGame';

const RPS_MOVES: NonEmptyArray<Move> = [
  { key: 'rock', label: 'Rock' },
  { key: 'paper', label: 'Paper' },
  { key: 'scissors', label: 'Scissors' },
];
const RPS_BEATS = { rock: ['scissors'], paper: ['rock'], scissors: ['paper'] };

const RPSLS_MOVES: NonEmptyArray<Move> = [
  { key: 'rock', label: 'Rock' },
  { key: 'paper', label: 'Paper' },
  { key: 'scissors', label: 'Scissors' },
  { key: 'lizard', label: 'Lizard' },
  { key: 'spock', label: 'Spock' },
];
const RPSLS_BEATS = {
  rock: ['scissors', 'lizard'],
  paper: ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard: ['paper', 'spock'],
  spock: ['rock', 'scissors'],
};

export const vsBotGamesLogic = {
  rps: async (ctx) => playMoveGame(ctx, { title: 'Rock Paper Scissors', intro: 'Throw your move.', moves: RPS_MOVES, beats: RPS_BEATS }),

  rpsls: async (ctx) =>
    playMoveGame(ctx, { title: 'RPSLS', intro: 'Pick your move for the chaos version of rock paper scissors.', moves: RPSLS_MOVES, beats: RPSLS_BEATS }),
} satisfies Record<string, CommandHandler>;
