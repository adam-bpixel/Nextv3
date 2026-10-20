import type { Command } from '../../../core/types';
const command: Command = { name: 'blacklist', aliases: ['bl'], description: 'Block a user from using bot commands.', usage: '<add|remove|list> [user] [reason]', category: 'owner', logic: 'ownerBlacklist', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
