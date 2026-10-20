import type { Command } from '../../../core/types';
const command: Command = { name: 'prcreate', aliases: [], description: 'Create a profile background from an image.', usage: '[image attachment or URL]', category: 'owner', logic: 'ownerProfileCreate', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
