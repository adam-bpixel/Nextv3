import type { Command } from '../../../core/types';

const command: Command = {
  name: "trivia",
  aliases: [],
  description: "Answer a quick trivia question.",
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
  recordingFile: "prefix/trivia.json",
};

export = command;
