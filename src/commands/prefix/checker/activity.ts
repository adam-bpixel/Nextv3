import type { Command } from '../../../core/types';

const command: Command = {
  name: "activity",
  aliases: ["act", "presence", "game", "richpresence", "checkdevice", "cd", "device", "devices"],
  description: "View a user's devices and activity.",
  usage: "[@user/id]",
  category: "Checker",
  logic: "activity",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/activity.json",
};

export = command;

