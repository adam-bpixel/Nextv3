import type { Command } from '../../core/types';

const command: Command = {
  path: "cmdtimeout check",
  menuType: "slash",
  description: "Check current usage for a user on a specific command.",
  options: [{"name": "scope", "description": "Which command type should be checked.", "type": 3, "required": true, "choices": [{"name": "Prefix", "value": "prefix"}, {"name": "Slash", "value": "slash"}, {"name": "Both", "value": "both"}], "min_value": null, "max_value": null}, {"name": "command", "description": "Command name or alias.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "user", "description": "The user to inspect.", "type": 6, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "usage",
  recordingFile: "slash/cmdtimeout__check.json",
};

export = command;
