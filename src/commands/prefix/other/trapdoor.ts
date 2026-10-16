import type { Command } from '../../../core/types';

const command: Command = {
  name: "trapdoor",
  aliases: [],
  description: "Avoid the trapdoor and pick the safe path.",
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
  recordingFile: "prefix/trapdoor.json",
};

export = command;
