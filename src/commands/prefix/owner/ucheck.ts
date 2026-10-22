import type { Command } from '../../../core/types';
const command: Command = { name: 'ucheck', aliases: ['uncheck'], description: 'Turn the username checker on or off, or see its status.', usage: '<status|on|off>', category: 'owner', logic: 'ucheck', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
