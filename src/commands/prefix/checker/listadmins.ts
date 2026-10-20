import type { Command } from '../../../core/types';

const command: Command = {
  name: "listadmins",
  aliases: ["la", "admins", "adminlist"],
  description: "List server admins and their roles.",
  usage: "[server ID]",
  category: "Checker",
  logic: "listadmins",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/listadmins.json",
};

export = command;
