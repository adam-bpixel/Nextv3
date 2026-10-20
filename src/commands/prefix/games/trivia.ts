import type { Command } from '../../../core/types';

const command: Command = {
  name: "trivia",
  aliases: [],
  description: "Answer a quick trivia question.",
  usage: "",
  category: "games",
  logic: "trivia",
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
