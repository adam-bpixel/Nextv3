import type { Command } from '../../../core/types';

const command: Command = {
  name: "resetdata",
  aliases: [],
  description: "Reset verification, clan, or top (leveling/invite) data for this server, with a confirmation step.",
  usage: "<verif|clans|top>",
  category: "admin",
  logic: "resetData",
  ai: null,
  permissions: ["administrator"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
