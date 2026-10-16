import type { Command } from '../../../core/types';

const command: Command = {
  name: "userinfo",
  aliases: [],
  description: "Show a user's profile with master UI (including roles & voice mention)",
  usage: "",
  category: "Information",
  logic: "userinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/userinfo.json",
};

export = command;
