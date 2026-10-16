import { Events, type Message } from 'discord.js';
import config from '../core/config';
import { asBotClient } from '../core/client';
import * as pipeline from '../core/pipeline';
import { makeContext } from '../core/context';
import { defineEvent } from '../core/types';
import * as levels from '../features/levels/levels.model';
import { replayMention } from '../features/recordings/recordings.service';

const USER_MENTION = /<@!?\d+>/g;

async function announceLevelUp(message: Message<true>): Promise<void> {
  const level = await levels.award(message.guild.id, message.author.id).catch(() => null);
  if (level === null || !config.levels.announce || !message.channel.isSendable()) return;
  await message.channel
    .send({ content: `🎉 <@${message.author.id}> reached level **${level}**!`, allowedMentions: { users: [message.author.id] } })
    .catch(() => undefined);
}

function isBareMention(message: Message): boolean {
  const self = message.client.user;
  return message.mentions.has(self) && message.content.replace(USER_MENTION, '').trim() === '';
}

export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (config.levels.enabled && message.inGuild()) await announceLevelUp(message);

    if (isBareMention(message)) {
      const answered = await replayMention(message).catch((error: unknown) => {
        console.error('Mention reply failed:', error);
        return false;
      });
      if (answered) return;
    }

    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/\s+/).filter(Boolean);
    const name = (args.shift() ?? '').toLowerCase();
    const command = asBotClient(message.client).findPrefixCommand(name);
    if (!command) return;
    await pipeline.run(makeContext({ kind: 'message', message }, args), command);
  },
});
