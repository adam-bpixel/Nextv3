import type { Command } from '../../../core/types';

const command: Command = {
  name: "pat",
  aliases: [],
  description: "Pat someone on the head.",
  usage: "[user mention or ID]",
  category: "social",
  logic: "pat",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
