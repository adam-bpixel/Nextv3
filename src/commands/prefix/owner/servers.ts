import type { Command } from '../../../core/types';
const command: Command = { name: 'servers', aliases: [], description: 'List servers the bot is in.', usage: '', category: 'owner', logic: 'ownerServers', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
