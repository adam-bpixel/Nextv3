import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import config from './config';
import type { Ctx, ReplyPayload } from './context';
import { cachedColor } from '../features/theme/theme.model';

export type ReplyKind = 'usage' | 'error' | 'success';

const REPLY_STYLE: Record<ReplyKind, { title: string }> = {
  usage: { title: 'Invalid Usage' },
  error: { title: 'Error' },
  success: { title: 'Success' },
};

export function usageReply(ctx: Ctx, message: string): ReplyPayload {
  return themedReply(ctx, 'usage', message);
}

export function errorReply(ctx: Ctx, message: string): ReplyPayload {
  return themedReply(ctx, 'error', message);
}

export function successReply(ctx: Ctx, message: string): ReplyPayload {
  return themedReply(ctx, 'success', message);
}

function removeExistingEmphasis(text: string): string {
  return text
    .split(/(`+[^`]*`+)/g)
    .map((part, index) => index % 2 === 1
      ? part.replace(/^`+|`+$/g, '')
      : part.replace(/\*\*|__|~~|\|\|/g, ''))
    .join('');
}

function formatReplyMessage(message: string): string {
  let inCodeBlock = false;
  return message
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inCodeBlock = !inCodeBlock;
        return line.trim();
      }
      if (inCodeBlock) return line;
      let text = line.trim().replace(/^(?:(?:[-*\u2022]\s*)|(?:-#\s*))+/u, '').trim();
      if (!text) return '';
      text = removeExistingEmphasis(text);
      text = text.replace(/^Usage:\s*/i, 'Use: ');
      const acceptsMentionOrId = /\buser mention or ID\b/i.test(text);
      text = text.replace(/\buser mention or ID\b/gi, 'user');
      const example = /\s+\((?:e\.g\.?|example):\s*(.+)\)$/i.exec(text);
      if (example) {
        text = text.slice(0, example.index).trim();
        return [
          `- -# **__${text}__**`,
          ...(acceptsMentionOrId ? ['- -# **__Mention the user or enter their ID.__**'] : []),
          `- -# **__Example: ${example[1]}__**`,
        ].join('\n');
      }
      return [`- -# **__${text}__**`, ...(acceptsMentionOrId ? ['- -# **__Mention the user or enter their ID.__**'] : [])].join('\n');
    })
    .filter(Boolean)
    .join('\n');
}

function themedReply(ctx: Ctx, kind: ReplyKind, message: string): ReplyPayload {
  return themedReplyFor(ctx.guild?.id ?? null, ctx.isInteraction, kind, message);
}

export function themedReplyFor(guildId: string | null, ephemeral: boolean, kind: ReplyKind, message: string): ReplyPayload {
  const { title } = REPLY_STYLE[kind];
  const accent = (guildId ? cachedColor(guildId) : undefined) ?? config.color;
  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${title}`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(formatReplyMessage(message)));

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0),
    allowedMentions: { parse: [] },
  };
}
