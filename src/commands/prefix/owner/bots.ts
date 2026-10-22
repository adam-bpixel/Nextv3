import type { Command } from '../../../core/types';
const command: Command = { name: 'botcontrol', aliases: ['botstatus', 'botdevice'], description: "Open a panel to change the bot's status and device.", usage: '', category: 'owner', logic: 'bots', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
