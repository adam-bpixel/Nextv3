import type { NonEmptyArray } from '../../core/context';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { resolveVoiceChannel } from '../voice/voiceMod.service';
import { addSus, listSus, removeSus, setAfk } from './social.model';
import { actionCard, catCard, susListCard, textCard } from './social.ui';

const CAT_API_URL = 'https://api.thecatapi.com/v1/images/search';
const FALLBACK_CAT_GIFS: NonEmptyArray<string> = ['https://cdn.shopify.com/s/files/1/0344/6469/files/cat-gif-loop-yawn_grande.gif?v=1523984811'];

interface CatApiEntry {
  url?: unknown;
}

async function fetchCatImageUrl(): Promise<string | null> {
  try {
    const response = await fetch(CAT_API_URL);
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    const entry = Array.isArray(data) ? (data[0] as CatApiEntry | undefined) : undefined;
    return typeof entry?.url === 'string' ? entry.url : null;
  } catch {
    return null;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface ActionConfig {
  aloneLine: (name: string) => string;
  targetLine?: (name: string, target: string) => string;
  gifs: NonEmptyArray<string>;
}

function actionHandler({ aloneLine, targetLine, gifs }: ActionConfig): CommandHandler {
  return async (ctx) => {
    const name = ctx.user.username;
    const target = targetLine ? await ctx.findUser(0) : null;
    const line = target && target.id !== ctx.user.id && targetLine ? targetLine(name, target.username) : aloneLine(name);
    await ctx.send(actionCard(line, ctx.random(gifs)));
    return 'completed';
  };
}

const KILL_GIFS: NonEmptyArray<string> = ['https://i.pinimg.com/originals/29/cc/ed/29ccedb82e849c61c2e818e555d5c33d.gif'];
const MISSYOU_GIFS: NonEmptyArray<string> = ['https://media.tenor.com/eE_0W25827gAAAAd/anime-sad.gif'];
const SLAPE_GIFS: NonEmptyArray<string> = ['https://media.tenor.com/QiC82s_o9W4AAAAd/anime-slap.gif'];
const SMILE_GIFS: NonEmptyArray<string> = ['https://media.tenor.com/7bQyD5F9z44AAAAd/anime-smile.gif'];
const CRINGE_GIFS: NonEmptyArray<string> = ['https://i.pinimg.com/originals/87/2d/14/872d14f4e384f90822400099abd53afe.gif'];
const CRY_GIFS: NonEmptyArray<string> = ['https://i.giphy.com/d2lcHJTG5Tscg.webp'];
const HAPPY_GIFS: NonEmptyArray<string> = ['https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGptM2h2MWZndDhlc2puemltcXFpYzk1emhuOGZrNjlrdjZweDE4aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12SXVd8bmXdSg0/giphy.gif'];

export const socialLogic = {
  kill: actionHandler({ aloneLine: (n) => `${n} commits sudoku!`, targetLine: (n, t) => `${n} kills ${t}!`, gifs: KILL_GIFS }),
  missyou: actionHandler({ aloneLine: (n) => `${n} feels lonely...`, targetLine: (n, t) => `${n} misses ${t}!`, gifs: MISSYOU_GIFS }),
  slape: actionHandler({ aloneLine: (n) => `${n} slaps themselves!`, targetLine: (n, t) => `${n} slaps ${t}!`, gifs: SLAPE_GIFS }),
  smile: actionHandler({ aloneLine: (n) => `${n} smiles!`, targetLine: (n, t) => `${n} smiles at ${t}!`, gifs: SMILE_GIFS }),
  cringe: actionHandler({ aloneLine: () => 'Cringe!', gifs: CRINGE_GIFS }),
  cry: actionHandler({ aloneLine: () => 'Sob sob...', gifs: CRY_GIFS }),
  happy: actionHandler({ aloneLine: () => 'Happy!', gifs: HAPPY_GIFS }),

  async cat(ctx) {
    const imageUrl = (await fetchCatImageUrl()) ?? ctx.random(FALLBACK_CAT_GIFS);
    await ctx.send(catCard(ctx.user.username, imageUrl));
    return 'completed';
  },

  async afk(ctx) {
    const reason = ctx.text || 'AFK';
    await setAfk(ctx.user.id, reason);
    await ctx.send(textCard('AFK Status Set', `I have set your AFK status: \`${reason}\`. I will let others know you're away.`));
    return 'completed';
  },

  async cam(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const action = (ctx.args[0] ?? '').toLowerCase();
    if (action !== 'enable' && action !== 'disable') return fail(ctx, `Say \`enable\` or \`disable\`.\nUsage: \`${ctx.prefix}cam <enable|disable> [channel]\`.`);
    const channel = resolveVoiceChannel(guild, ctx.args[1]) ?? ctx.member?.voice.channel ?? null;
    if (!channel) return fail(ctx, 'Mention a voice channel, or join one yourself first.');
    await channel.permissionOverwrites.edit(guild.roles.everyone, { Stream: action === 'enable' ? null : false });
    await ctx.send(successReply(ctx, `- Camera/streaming **${action === 'enable' ? 'enabled' : 'disabled'}** in **${channel.name}**.`));
    return 'completed';
  },

  async hack(ctx) {
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user to hack.\nUsage: \`${ctx.prefix}hack <user mention>\`.`);
    const stages = [
      `Initiating hack on \`${target.username}\`...`,
      'Bypassing firewall... [25%]',
      'Accessing personal data... [50%]',
      'Injecting malware... [75%]',
      'Extracting sensitive information... [90%]',
      'Hack complete! Data secured.',
    ];
    for (const [index, stage] of stages.entries()) {
      if (index > 0) await sleep(1200);
      await ctx.send(textCard('Hacking Progress', stage), { reply: index === 0 });
    }
    return 'completed';
  },

  async sus(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const sub = (ctx.args[0] ?? 'list').toLowerCase();
    if (sub === 'add') {
      const target = await ctx.findUser(1);
      if (!target) return fail(ctx, `Mention a user to add.\nUsage: \`${ctx.prefix}sus add <user>\`.`);
      await addSus(guild.id, target.id);
      await ctx.send(successReply(ctx, `- Added **${target.username}** to the sus list.`));
      return 'completed';
    }
    if (sub === 'remove') {
      const target = await ctx.findUser(1);
      if (!target) return fail(ctx, `Mention a user to remove.\nUsage: \`${ctx.prefix}sus remove <user>\`.`);
      await removeSus(guild.id, target.id);
      await ctx.send(successReply(ctx, `- Removed **${target.username}** from the sus list.`));
      return 'completed';
    }
    await ctx.send(susListCard(guild.name, await listSus(guild.id)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
