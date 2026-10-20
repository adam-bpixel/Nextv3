import type { Command } from '../../../core/types';
const command: Command = { name: 'leaveserver', aliases: ['leaveguild'], description: 'Make the bot leave a server.', usage: '<server ID>', category: 'owner', logic: 'ownerLeaveServer', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
