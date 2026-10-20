import type { Command } from '../../../core/types';

const command: Command = {
  name: "serverinfo",
  aliases: ["server"],
  description: "Show server information in a master UI",
  usage: "",
  category: "Information",
  logic: "serverinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/serverinfo.json",
};

export = command;
