import type { Command } from '../../../core/types';

const command: Command = {
  name: "jaillogs",
  aliases: [],
  description: "Displays jail history for a user.",
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
  recordingFile: "prefix/jaillogs.json",
};

export = command;
