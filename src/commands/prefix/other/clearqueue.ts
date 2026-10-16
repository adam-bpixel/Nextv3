import type { Command } from '../../../core/types';

const command: Command = {
  name: "clearqueue",
  aliases: [],
  description: "Clear every queued song after the current one.",
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
  recordingFile: "prefix/clearqueue.json",
};

export = command;
