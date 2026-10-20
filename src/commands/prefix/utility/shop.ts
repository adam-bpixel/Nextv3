import type { Command } from '../../../core/types';
const command: Command = { name: 'shop', aliases: ['backgroundshop', 'bgshop'], description: 'Browse and buy profile backgrounds.', usage: '[buy <profile id>]', category: 'Profile', logic: 'profileShop', ai: null, permissions: [], ownerOnly: false, cooldown: 0, voice: false, dm: true, kind: 'ok', recordingFile: null };
export = command;
