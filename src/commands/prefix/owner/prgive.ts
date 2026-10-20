import type { Command } from '../../../core/types';
const command: Command = { name: 'prgive', aliases: [], description: 'Give and equip a profile background for a member.', usage: '<user mention or ID> <profile id>', category: 'owner', logic: 'ownerProfileGive', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
