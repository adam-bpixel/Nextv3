import type { Command } from '../../../core/types';

const command: Command = {
  name: "role",
  aliases: [],
  description: "Give or remove a role from a member by role ID or role name.",
  usage: "<user mention or ID> <role ID or role name>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/role.json",
};

export = command;
