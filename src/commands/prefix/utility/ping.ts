import type { Command } from '../../../core/types';

const command: Command = {
  name: "ping",
  aliases: [],
  description: "Show bot latency and shard information with avatar",
  usage: "",
  category: "Information",
  logic: "ping",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/ping.json",
};

export = command;
