import type { Command } from '../../../core/types';
const command: Command = { name: 'uchck', aliases: ['uncheck'], description: 'Turn the username checker on or off, or see its status.', usage: '<status|on|off>', category: 'owner', logic: 'uchck', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
