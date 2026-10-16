import type { Command } from '../../../core/types';

const command: Command = {
  name: "jail",
  aliases: [],
  description: "Jails a user in the server.",
  usage: "",
  category: "jail",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/jail.json",
};

export = command;
