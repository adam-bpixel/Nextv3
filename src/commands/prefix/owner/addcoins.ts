import type { Command } from '../../../core/types';
const command: Command = { name: 'addcoins', aliases: [], description: "Add currency to a user's wallet.", usage: '<user mention or ID> <amount>', category: 'owner', logic: 'ownerAddRvp', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
