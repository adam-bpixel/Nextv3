import type { Command } from '../../../core/types';

const command: Command = {
  name: "check-vanity",
  aliases: [],
  description: "Check if a Discord vanity URL is available",
  usage: "",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/check_vanity.json",
};

export = command;
