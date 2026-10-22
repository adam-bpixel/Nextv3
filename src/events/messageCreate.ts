import { Events, PermissionFlagsBits, type Message } from 'discord.js';
import config, { isOwner } from '../core/config';
import { asBotClient } from '../core/client';
import * as pipeline from '../core/pipeline';
import { makeContext } from '../core/context';
import { defineEvent } from '../core/types';
import * as levels from '../features/levels/levels.model';
import { clearAfk, getAfk } from '../features/fun/social.model';
import { themedReplyFor } from '../core/usage-replies';
import { findBadWord } from '../features/badwords/badwords.model';
import { getGuildPrefix, getUserPrefix } from '../features/prefix/prefix.model';
import { isPremiumUser } from '../features/premium/premium.model';
import { isWorkMode } from '../features/owner/owner.model';
import { findAutoReplyMatch, getGuildSetup } from '../features/setup/setup.model';
import { getGuildSecurity } from '../features/security/security.model';
import { isAssignedBot } from '../features/fleet/fleet.model';

const USER_MENTION = /<@!?\d+>/g;
const INVITE_LINK = /(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-z0-9-]+/i;
const ANTILINK_WARNING_LIFETIME_MS = 5000;

function isBareMention(message: Message): boolean {
  const self = message.client.user;
  return message.mentions.has(self) && message.content.replace(USER_MENTION, '').trim() === '';
}

async function replyWithPrefixes(message: Message): Promise<boolean> {
  const serverPrefix = await getGuildPrefix(message.guildId);
  const personalPrefix = await getUserPrefix(message.author.id);
  const personalActive = personalPrefix && (isOwner(message.author.id) || await isPremiumUser(message.author.id));
  const lines = [`Server prefix: \`${serverPrefix}\``, `Your prefix: ${personalActive ? `\`${personalPrefix}\`` : '`Not set`'}`];
  await message.reply({ ...themedReplyFor(message.guildId, false, 'success', lines.join('\n'), { title: 'Prefix', keepCode: true }), allowedMentions: { parse: [], repliedUser: false } });
  return true;
}

async function handleAntilink(message: Message<true>): Promise<boolean> {
  if (!INVITE_LINK.test(message.content)) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return false;
  const settings = await getGuildSecurity(message.guildId);
  if (!settings.antilink) return false;
  await message.delete().catch(() => undefined);
  if (message.channel.isSendable()) {
    const warning = await message.channel
      .send({ content: `${message.author}, invite links aren't allowed here.`, allowedMentions: { parse: ['users'] } })
      .catch(() => null);
    if (warning) setTimeout(() => void warning.delete().catch(() => undefined), ANTILINK_WARNING_LIFETIME_MS);
  }
  return true;
}

async function handleBadWords(message: Message<true>): Promise<boolean> {
  if (!message.content || isOwner(message.author.id)) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;
  if (!(await findBadWord(message.guildId, message.content))) return false;
  await message.delete().catch(() => undefined);
  if (message.channel.isSendable()) {
    const warning = await message.channel
      .send({ content: `${message.author}, that word isn't allowed here.`, allowedMentions: { parse: ['users'] } })
      .catch(() => null);
    if (warning) setTimeout(() => void warning.delete().catch(() => undefined), ANTILINK_WARNING_LIFETIME_MS);
  }
  return true;
}

async function handleAutoReply(message: Message<true>): Promise<void> {
  const setup = await getGuildSetup(message.guildId);
  const match = findAutoReplyMatch(setup, message.content);
  if (!match || !message.channel.isSendable()) return;
  await message.reply({ content: match.response, allowedMentions: { parse: [], repliedUser: false } });
}

async function handleAfk(message: Message, commandName: string): Promise<void> {
  if (!message.channel.isSendable()) return;
  if (commandName !== 'afk' && (await getAfk(message.author.id))) {
    await clearAfk(message.author.id);
    await message.channel.send({ content: `Welcome back, <@${message.author.id}>! I removed your AFK status.`, allowedMentions: { parse: [] } });
  }
  for (const user of message.mentions.users.values()) {
    if (user.id === message.author.id) continue;
    const status = await getAfk(user.id);
    if (status) await message.channel.send({ content: `**${user.username}** is AFK: ${status.reason}`, allowedMentions: { parse: [] } });
  }
}

export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (message.inGuild() && !(await isAssignedBot(asBotClient(message.client).fleetId, message.guildId))) return;
    if (!isOwner(message.author.id) && await isWorkMode()) return;
    if (message.inGuild() && await handleAntilink(message).catch((error: unknown) => {
      console.error('Antilink check failed:', error);
      return false;
    })) return;
    if (message.inGuild() && await handleBadWords(message).catch((error: unknown) => {
      console.error('Bad words check failed:', error);
      return false;
    })) return;
    if (config.levels.enabled && message.inGuild()) {
      const reachedLevel = await levels.award(message.guild.id, message.author.id, 'chat').catch(() => null);
      if (reachedLevel && message.member) {
        await levels.grantLevelRoles(message.guild, message.member, 'chat', reachedLevel).catch((error: unknown) => console.error('Granting level roles failed:', error));
      }
    }

    if (isBareMention(message)) {
      const answered = await replyWithPrefixes(message).catch((error: unknown) => {
        console.error('Mention reply failed:', error);
        return false;
      });
      if (answered) return;
    }

    const personalPrefix = await getUserPrefix(message.author.id);
    const prefix = personalPrefix && (isOwner(message.author.id) || await isPremiumUser(message.author.id))
      ? personalPrefix
      : await getGuildPrefix(message.guildId);
    const args = message.content.startsWith(prefix) ? message.content.slice(prefix.length).trim().split(/\s+/).filter(Boolean) : [];
    const name = (args.shift() ?? '').toLowerCase();

    await handleAfk(message, name).catch((error: unknown) => console.error('AFK check failed:', error));

    if (message.content.startsWith(prefix)) {
      const command = asBotClient(message.client).findPrefixCommand(name);
      if (command) {
        await pipeline.run(makeContext({ kind: 'message', message }, args, prefix), command);
        return;
      }
    }

    if (message.inGuild()) {
      await handleAutoReply(message).catch((error: unknown) => console.error('Auto-reply failed:', error));
    }
  },
});
