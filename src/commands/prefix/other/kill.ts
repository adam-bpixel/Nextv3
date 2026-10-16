import type { Command } from '../../../core/types';

const command: Command = {
  name: "kill",
  aliases: [],
  description: "Kill someone.",
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
  recordingFile: "prefix/kill.json",
};

export = command;
