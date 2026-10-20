import type { NonEmptyArray } from '../../core/context';
import type { CommandHandler } from '../../core/types';
import { evaluateExpression, numbersUsedIn, sameMultiset } from './engines/arithmeticExpression';
import { playExpressionGame } from './engines/expressionGame';
import { playTextAnswerGame } from './engines/textAnswerGame';
import { randomSolvableQuad } from './engines/twentyFourSolver';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const FAST_TYPE_PHRASES = ['press the correct keys', 'the quick fox jumps', 'speed is everything here', 'type this without errors'] as const;

const RIDDLE_BANK: NonEmptyArray<QuestionAnswer> = [
  { question: 'What has hands but cannot clap?', answer: 'clock' },
  { question: 'What has a neck but no head?', answer: 'bottle' },
  { question: 'What has keys but opens no locks?', answer: 'piano' },
  { question: 'What gets wetter the more it dries?', answer: 'towel' },
];

const TRIVIA_BANK: NonEmptyArray<QuestionAnswer> = [
  { question: 'What planet is known as the Red Planet?', answer: 'mars' },
  { question: 'What is the largest ocean on Earth?', answer: 'pacific' },
  { question: 'How many continents are there?', answer: '7' },
  { question: 'What gas do plants absorb from the air?', answer: 'carbon dioxide' },
];

const WORD_BANK = ['computer', 'keyboard', 'discord', 'triangle', 'elephant'] as const;

function scramble(word: string): string {
  const letters = [...word];
  do {
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = letters[i];
      const b = letters[j];
      if (a === undefined || b === undefined) continue;
      letters[i] = b;
      letters[j] = a;
    }
  } while (letters.join('') === word && word.length > 1);
  return letters.join('');
}

export const quizGamesLogic = {
  anagram: async (ctx) => {
    const word = ctx.random(WORD_BANK);
    return playTextAnswerGame(ctx, { title: 'Anagram', prompt: `Unscramble this word: **${scramble(word)}**`, answer: word });
  },

  sumup: async (ctx) => {
    const numbers = [ctx.randInt(1, 20), ctx.randInt(1, 20), ctx.randInt(1, 20)];
    const total = numbers.reduce((sum, value) => sum + value, 0);
    return playTextAnswerGame(ctx, { title: 'Sum Up', prompt: `Add these numbers: **${numbers.join(' + ')}**`, answer: String(total) });
  },

  '24': async (ctx) => {
    const { numbers, solution } = randomSolvableQuad(ctx.randInt);
    const validate = (input: string): boolean => {
      const value = evaluateExpression(input);
      if (value === null || Math.abs(value - 24) > 1e-6) return false;
      return sameMultiset(numbersUsedIn(input), numbers);
    };
    return playExpressionGame(ctx, {
      title: '24',
      prompt: `Using **${numbers.join(', ')}** exactly once each, combine them with \`+ - * /\` (parentheses allowed) to make **24**.`,
      validate,
      hint: `Numbers were **${numbers.join(', ')}**. One solution: \`${solution} = 24\`.`,
    });
  },

  fasttype: async (ctx) => {
    const phrase = ctx.random(FAST_TYPE_PHRASES);
    return playTextAnswerGame(ctx, { title: 'Fast Type', prompt: `Type this phrase exactly:\n**${phrase}**`, answer: phrase });
  },

  guessnumber: async (ctx) => {
    const answer = ctx.randInt(1, 10);
    return playTextAnswerGame(ctx, { title: 'Guess The Number', prompt: 'I picked a number from **1** to **10**. What is it?', answer: String(answer) });
  },

  quickmath: async (ctx) => {
    const a = ctx.randInt(2, 12);
    const b = ctx.randInt(2, 12);
    const op = ctx.random(['+', '-', '*'] as const);
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return playTextAnswerGame(ctx, { title: 'Quick Math', prompt: `Solve this: **${a} ${op} ${b}**`, answer: String(answer) });
  },

  riddle: async (ctx) => {
    const round = ctx.random(RIDDLE_BANK);
    return playTextAnswerGame(ctx, { title: 'Riddle', prompt: round.question, answer: round.answer });
  },

  sequence: async (ctx) => {
    const step = ctx.randInt(2, 5);
    const start = ctx.randInt(1, 10);
    const terms = [start, start + step, start + step * 2, start + step * 3];
    const next = start + step * 4;
    return playTextAnswerGame(ctx, { title: 'Number Sequence', prompt: `What comes next?\n**${terms.join(', ')}, ?**`, answer: String(next) });
  },

  trivia: async (ctx) => {
    const round = ctx.random(TRIVIA_BANK);
    return playTextAnswerGame(ctx, { title: 'Trivia', prompt: round.question, answer: round.answer });
  },

  wordscramble: async (ctx) => {
    const word = ctx.random(WORD_BANK);
    return playTextAnswerGame(ctx, { title: 'Word Scramble', prompt: `Rebuild this scrambled word: **${scramble(word)}**`, answer: word });
  },
} satisfies Record<string, CommandHandler>;
