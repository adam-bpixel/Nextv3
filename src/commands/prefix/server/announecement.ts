import type { Command } from '../../../core/types';

const command: Command = {
  name: "announecement",
  aliases: [],
  description: "Dev-only: DM an announcement to every unique guild owner the bot can reach.",
  usage: "<message>",
  category: "owner",
  logic: "ownerAnnounce",
  ai: null,
  permissions: [],
  ownerOnly: true,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
