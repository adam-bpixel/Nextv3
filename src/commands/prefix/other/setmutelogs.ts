import type { Command } from '../../../core/types';

const command: Command = {
  name: "setmutelogs",
  aliases: [],
  description: "Set which channel receives logs for the mute and vmute commands.",
  usage: "<channel>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/setmutelogs.json",
};

export = command;
