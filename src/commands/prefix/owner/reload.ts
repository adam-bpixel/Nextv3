import type { Command } from '../../../core/types';
const command: Command = { name: 'reload', aliases: ['rel'], description: 'Reload prefix commands from disk.', usage: '[command]', category: 'owner', logic: 'ownerReload', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
