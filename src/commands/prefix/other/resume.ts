import type { Command } from '../../../core/types';

const command: Command = {
  name: "resume",
  aliases: [],
  description: "Resume the paused song.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: true,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/resume.json",
};

export = command;
