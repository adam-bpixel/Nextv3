import type { Command } from '../../../core/types';
const command: Command = { name: 'removecoins', aliases: [], description: "Remove currency from a user's wallet.", usage: '<user mention or ID> <amount|all>', category: 'owner', logic: 'ownerRemoveRvp', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
