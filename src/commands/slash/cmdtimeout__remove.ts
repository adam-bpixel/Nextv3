import type { Command } from '../../core/types';

const command: Command = {
  path: "cmdtimeout remove",
  menuType: "slash",
  description: "Remove a command usage limit.",
  options: [{"name": "scope", "description": "Which command type should be updated.", "type": 3, "required": true, "choices": [{"name": "Prefix", "value": "prefix"}, {"name": "Slash", "value": "slash"}, {"name": "Both", "value": "both"}], "min_value": null, "max_value": null}, {"name": "command", "description": "Command name or alias.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/cmdtimeout__remove.json",
};

export = command;
