import type { Command } from '../../../core/types';
const command: Command = { name: 'cardgive', aliases: [], description: 'Give a member a temporary XP boost.', usage: '<user mention or ID> <multiplier>x <duration>', category: 'owner', logic: 'ownerCardGive', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
