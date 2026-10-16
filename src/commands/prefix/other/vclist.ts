import type { Command } from '../../../core/types';

const command: Command = {
  name: "vclist",
  aliases: [],
  description: "Show List Of Members Connected In Your Voice",
  usage: "",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/vclist.json",
};

export = command;
