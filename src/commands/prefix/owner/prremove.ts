import type { Command } from '../../../core/types';
const command: Command = { name: 'prremove', aliases: [], description: 'Remove an owned profile background from a member.', usage: '<user mention or ID> <profile id>', category: 'owner', logic: 'ownerProfileRemove', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
