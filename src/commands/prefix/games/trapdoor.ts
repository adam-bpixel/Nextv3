import type { Command } from '../../../core/types';

const command: Command = {
  name: "trapdoor",
  aliases: [],
  description: "Avoid the trapdoor and pick the safe path.",
  usage: "",
  category: "games",
  logic: "trapdoor",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
