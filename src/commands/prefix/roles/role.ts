import type { Command } from '../../../core/types';

const command: Command = {
  name: "role",
  aliases: [],
  description: "Give or remove a role from a member by role ID or role name.",
  usage: "<user mention or ID> <role ID or role name>",
  category: "moderation",
  logic: "role",
  ai: null,
  permissions: ["manage_roles"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
