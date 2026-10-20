import type { Guild, GuildMember, TextBasedChannel, VoiceChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import db from '../../core/db';

const COLLECTION = 'tempChannels';

export interface TempChannelRecord {
  id: string;
  guildId: string;
  channelId: string;
  ownerId: string;
  name: string;
  createdAt: number;
}

async function listFor(guildId: string): Promise<TempChannelRecord[]> {
  const entries = await db.all(COLLECTION);
  return entries
    .map((entry) => entry.value as TempChannelRecord)
    .filter((record) => record && record.guildId === guildId);
}

export type TempChannelResult = { ok: true; message: string } | { ok: false; message: string };

export async function tempChannelAction(
  guild: Guild,
  channel: TextBasedChannel | null,
  member: GuildMember | null,
  sub: string,
  args: string[],
): Promise<TempChannelResult> {
  switch (sub) {
    case 'create': {
      const name = args.join(' ').trim() || `${member?.user.username ?? 'temp'}'s channel`;
      const created = (await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: channel && 'parentId' in channel ? channel.parentId : undefined,
      })) as VoiceChannel;
      const record: TempChannelRecord = {
        id: created.id,
        guildId: guild.id,
        channelId: created.id,
        ownerId: member?.id ?? 'unknown',
        name: created.name,
        createdAt: Date.now(),
      };
      await db.set(COLLECTION, record.id, record);
      return { ok: true, message: `- Created temp voice channel ${created}.` };
    }
    case 'edit': {
      const [id, ...rest] = args;
      const newName = rest.join(' ').trim();
      if (!id || !newName) return { ok: false, message: 'Use: `tempchannel edit <channel id> <new name>`.' };
      const record = (await db.get(COLLECTION, id)) as TempChannelRecord | undefined;
      if (!record || record.guildId !== guild.id) return { ok: false, message: 'No temp channel with that ID was found.' };
      const target = await guild.channels.fetch(record.channelId).catch(() => null);
      if (!target) return { ok: false, message: 'That temp channel no longer exists.' };
      await target.setName(newName);
      await db.set(COLLECTION, id, { ...record, name: newName });
      return { ok: true, message: `- Renamed temp channel to **${newName}**.` };
    }
    case 'delete': {
      const [id] = args;
      if (!id) return { ok: false, message: 'Use: `tempchannel delete <channel id>`.' };
      const record = (await db.get(COLLECTION, id)) as TempChannelRecord | undefined;
      if (!record || record.guildId !== guild.id) return { ok: false, message: 'No temp channel with that ID was found.' };
      const target = await guild.channels.fetch(record.channelId).catch(() => null);
      if (target) await target.delete().catch(() => undefined);
      await db.delete(COLLECTION, id);
      return { ok: true, message: '- Deleted the temp channel.' };
    }
    case 'list': {
      const records = await listFor(guild.id);
      if (!records.length) return { ok: true, message: '- No temp channels are currently tracked in this server.' };
      return {
        ok: true,
        message: ['- __**Temp channels**__ ﹕', ...records.map((record) => `  <#${record.channelId}> (owner <@${record.ownerId}>)`)].join('\n'),
      };
    }
    case 'cleanup': {
      const records = await listFor(guild.id);
      let removed = 0;
      for (const record of records) {
        const target = await guild.channels.fetch(record.channelId).catch(() => null);
        const empty = target && 'members' in target && target.members.size === 0;
        if (!target || empty) {
          if (target) await target.delete().catch(() => undefined);
          await db.delete(COLLECTION, record.id);
          removed++;
        }
      }
      return { ok: true, message: `- Cleaned up **${removed}** empty/stale temp channel(s).` };
    }
    default:
      return { ok: false, message: 'Use: `tempchannel <create|edit|delete|list|cleanup> [args...]`.' };
  }
}
