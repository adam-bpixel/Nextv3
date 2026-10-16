import type { Command } from '../../../core/types';

const command: Command = {
  name: "missyou",
  aliases: [],
  description: "Miss someone.",
  usage: "",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/missyou.json",
};

export = command;
