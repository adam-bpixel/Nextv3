import type { Command } from '../../../core/types';
const command: Command = { name: 'prshop', aliases: [], description: 'Manage profile background shop listings.', usage: 'add <profile id> <name> <price> <stock|unlimited> | edit <profile id> <name|price|stock> <value> | remove <profile id>', category: 'owner', logic: 'ownerProfileShop', ai: null, permissions: [], ownerOnly: true, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
