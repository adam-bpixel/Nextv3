import type { Command } from '../../../core/types';
const command: Command = { name: 'workmode', aliases: [], description: 'Only respond to the owner until disabled.', usage: '<on|off>', category: 'owner', logic: 'ownerWorkMode', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
