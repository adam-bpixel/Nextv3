import type { NonEmptyArray } from '../../core/context';
import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';

const DICE_NOTATION = /^(\d{1,2})?d(\d{1,4})$/i;
const MAX_DICE = 20;
const DEFAULT_SIDES = 6;
const MIN_SIDES = 2;
const MAX_SIDES = 10000;
const MAX_QUESTION_LENGTH = 1000;
const MAX_CHOICE_LENGTH = 200;
const DISCORD_MESSAGE_LIMIT = 2000;
const CHOICE_SEPARATOR = /\s*[,|]\s*|\s+or\s+/i;

const EIGHT_BALL_ANSWERS: NonEmptyArray<string> = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.', 'You may rely on it.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.', 'Reply hazy, try again.',
  'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  "Don't count on it.", 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.',
];

function rollPlan(argument: string | undefined): { count: number; sides: number } {
  const dice = DICE_NOTATION.exec(argument ?? '');
  if (dice) return { count: Math.min(Number(dice[1] ?? 1), MAX_DICE), sides: Number(dice[2]) };
  return { count: 1, sides: Math.max(MIN_SIDES, Math.min(Number.parseInt(argument ?? '', 10) || DEFAULT_SIDES, MAX_SIDES)) };
}

export const funLogic = {
  async coinflip(ctx) {
    await ctx.send(ctx.embed({ title: '🪙 Coin flip', description: `It's **${ctx.random(['Heads', 'Tails'])}**!` }));
    return 'completed';
  },

  async roll(ctx) {
    const { count, sides } = rollPlan(ctx.args[0]);
    const rolls = Array.from({ length: count }, () => ctx.randInt(1, sides));
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    await ctx.send(ctx.embed({ title: '🎲 Roll', description: count > 1 ? `${rolls.join(' + ')} = **${total}**` : `You rolled **${total}** (1-${sides})` }));
    return 'completed';
  },

  async '8ball'(ctx) {
    if (!ctx.text) return fail(ctx, 'Ask me a question!');
    await ctx.send(
      ctx.embed({
        title: '🎱 Magic 8-ball',
        fields: [
          { name: 'Question', value: ctx.text.slice(0, MAX_QUESTION_LENGTH) },
          { name: 'Answer', value: ctx.random(EIGHT_BALL_ANSWERS) },
        ],
      }),
    );
    return 'completed';
  },

  async choose(ctx) {
    const [first, ...others] = ctx.text.split(CHOICE_SEPARATOR).filter(Boolean);
    if (first === undefined || !others.length) return fail(ctx, 'Give me at least two options, separated by commas.');
    await ctx.send(ctx.embed({ title: '🤔 I choose…', description: `**${ctx.random([first, ...others]).slice(0, MAX_CHOICE_LENGTH)}**` }));
    return 'completed';
  },

  async say(ctx) {
    if (!ctx.text) return fail(ctx, 'Tell me what to say.');
    const channel = ctx.channel;
    if (!channel?.isSendable()) return fail(ctx, "I can't talk in this channel.");
    const echo = { content: ctx.text.slice(0, DISCORD_MESSAGE_LIMIT), allowedMentions: { parse: [] } };
    if (ctx.source.kind === 'message') await ctx.source.message.delete().catch(() => undefined);
    else await ctx.whisper('Sent.');
    await channel.send(echo);
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
