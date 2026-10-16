import type { Command } from '../../core/types';

const command: Command = {
  path: "selfroleslogs",
  menuType: "slash",
  description: "Set the log channel for self-role actions.",
  options: [{"name": "channelid", "description": "Channel for self-role logs.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/selfroleslogs.json",
};

export = command;
