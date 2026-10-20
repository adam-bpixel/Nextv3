import type { Command } from '../../../core/types';
const command: Command = { name: 'sendsuggest', aliases: [], description: 'Post the suggestions panel and choose its review channel.', usage: '<panel channel> <review channel>', category: 'owner', logic: 'ownerSendSuggest', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: false, kind: 'ok', recordingFile: null };
export = command;
