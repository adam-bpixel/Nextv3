import type { Command } from '../../../core/types';
const command: Command = { name: 'restart', aliases: [], description: 'Restart the bot process.', usage: '', category: 'owner', logic: 'ownerRestart', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
