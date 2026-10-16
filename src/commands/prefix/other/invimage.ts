import type { Command } from '../../../core/types';

const command: Command = {
  name: "invimage",
  aliases: [],
  description: "Show the server's invite image / splash",
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
  recordingFile: "prefix/invimage.json",
};

export = command;
