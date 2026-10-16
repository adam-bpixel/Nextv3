import type { Command } from '../../../core/types';

const command: Command = {
  name: "firstmsg",
  aliases: [],
  description: "Show the first message sent in this channel",
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
  recordingFile: "prefix/firstmsg.json",
};

export = command;
