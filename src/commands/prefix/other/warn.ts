import type { Command } from '../../../core/types';

const command: Command = {
  name: "warn",
  aliases: [],
  description: "Warn a user. Escalates roles and jails on 4th warn.",
  usage: "<user mention or ID> [reason]",
  category: "Warning",
  logic: "warn",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/warn.json",
};

export = command;
