import type { NonEmptyArray } from '../../core/context';
import type { CommandHandler } from '../../core/types';
import { playChoiceGame } from './engines/choiceGame';

interface OddOneOutSet {
  items: readonly string[];
  oddIndex: number;
}

interface EmojiQuizRound {
  emojis: string;
  answer: string;
  decoys: readonly string[];
}

function pickOneCorrect(title: string, intro: string, options: readonly string[], correctWord: (label: string) => string): CommandHandler {
  return async (ctx) => {
    const correctIndex = ctx.randInt(0, options.length - 1);
    return playChoiceGame(ctx, {
      title,
      intro,
      options,
      isCorrect: (index) => index === correctIndex,
      resultLine: (_index, won) => {
        const correct = correctWord(options[correctIndex] ?? '');
        return won ? `You found it. **${correct}**.` : `Not this time. It was **${correct}**.`;
      },
    });
  };
}

function pickOneToAvoid(title: string, intro: string, options: readonly string[], badWord: (label: string) => string): CommandHandler {
  return async (ctx) => {
    const badIndex = ctx.randInt(0, options.length - 1);
    return playChoiceGame(ctx, {
      title,
      intro,
      options,
      isCorrect: (index) => index !== badIndex,
      resultLine: (_index, won) => {
        const bad = badWord(options[badIndex] ?? '');
        return won ? `Safe pick. **${bad}** held it instead.` : `Boom. **${bad}** got you.`;
      },
    });
  };
}

const ODD_ONE_OUT_SETS: NonEmptyArray<OddOneOutSet> = [
  { items: ['Apple', 'Banana', 'Pear', 'Candle'], oddIndex: 3 },
  { items: ['Car', 'Train', 'Plane', 'Guitar'], oddIndex: 3 },
  { items: ['Red', 'Blue', 'Green', 'Tiger'], oddIndex: 3 },
  { items: ['Lion', 'Tiger', 'Wolf', 'Table'], oddIndex: 3 },
];

const EMOJI_QUIZ_BANK: NonEmptyArray<EmojiQuizRound> = [
  { emojis: '🌙😴', answer: 'bedtime', decoys: ['pizza party', 'road trip', 'gym time'] },
  { emojis: '🍕🎉', answer: 'pizza party', decoys: ['bedtime', 'ocean life', 'study hall'] },
  { emojis: '🐟🌊', answer: 'ocean life', decoys: ['space travel', 'concert', 'winter storm'] },
  { emojis: '🚗🛣️', answer: 'road trip', decoys: ['train ride', 'gym time', 'football match'] },
  { emojis: '🚀🌌', answer: 'space travel', decoys: ['ocean life', 'city rush', 'concert'] },
  { emojis: '🎸🎤', answer: 'concert', decoys: ['study hall', 'gym time', 'train ride'] },
];

export const pickGamesLogic = {
  cups: pickOneCorrect('Cup Shuffle', 'One cup hides the prize. Pick carefully.', ['Red Cup', 'Blue Cup', 'Gold Cup'], (label) => (label.split(' ')[0] ?? label).toLowerCase()),

  luckybutton: pickOneCorrect('Lucky Button', 'One button pays out. The rest are blanks.', ['Red', 'Green', 'Blue', 'Gold'], (label) => label.toLowerCase()),

  safebox: pickOneCorrect('Safe Box', 'Three are empty. One has the loot.', ['Box A', 'Box B', 'Box C', 'Box D'], (label) => label),

  trapdoor: pickOneToAvoid('Trapdoor', 'Only one door is safe. The other two drop instantly.', ['Left Door', 'Middle Door', 'Right Door'], (label) => (label.split(' ')[0] ?? label).toLowerCase()),

  treasuremap: pickOneCorrect('Treasure Map', 'One direction hides the treasure chest.', ['North', 'South', 'East', 'West'], (label) => label.toLowerCase()),

  targettap: async (ctx) => {
    const targets = ['⚡', '⭐', '🎯', '🔥'] as const;
    const target = ctx.random(targets);
    const options = [...targets].sort(() => Math.random() - 0.5);
    return playChoiceGame(ctx, {
      title: 'Target Tap',
      intro: `Tap this target: **${target}**`,
      options,
      isCorrect: (index) => options[index] === target,
      resultLine: (_index, won) => (won ? 'Direct hit.' : `Missed it. The target was **${target}**.`),
    });
  },

  minesafe: pickOneToAvoid('Mine Safe', 'One tile explodes. The others are safe.', ['Tile 1', 'Tile 2', 'Tile 3', 'Tile 4', 'Tile 5'], (label) => label),

  oddoneout: async (ctx) => {
    const set = ctx.random(ODD_ONE_OUT_SETS);
    const order = set.items.map((_, index) => index).sort(() => Math.random() - 0.5);
    const options = order.map((index) => set.items[index] ?? '');
    const correctIndex = order.indexOf(set.oddIndex);
    return playChoiceGame(ctx, {
      title: 'Odd One Out',
      intro: 'Pick the odd one out.',
      options,
      isCorrect: (index) => index === correctIndex,
      resultLine: (_index, won) => {
        const odd = (options[correctIndex] ?? '').toLowerCase();
        return won ? `Correct. **${odd}** was the mismatch.` : `Not this time. **${odd}** was the mismatch.`;
      },
    });
  },

  emojiquiz: async (ctx) => {
    const round = ctx.random(EMOJI_QUIZ_BANK);
    const choices = [round.answer, ...round.decoys].map((label, index) => ({ label, index })).sort(() => Math.random() - 0.5);
    const options = choices.map((choice) => choice.label);
    const correctIndex = choices.findIndex((choice) => choice.label === round.answer);
    return playChoiceGame(ctx, {
      title: 'Emoji Quiz',
      intro: `What do these emojis point to?\n**${round.emojis}**`,
      options,
      isCorrect: (index) => index === correctIndex,
      resultLine: (_index, won) => (won ? `Correct. The answer was **${round.answer}**.` : `Nope. The right answer was **${round.answer}**.`),
    });
  },
} satisfies Record<string, CommandHandler>;
