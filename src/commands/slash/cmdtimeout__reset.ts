import type { Command } from '../../core/types';

const command: Command = {
  path: "cmdtimeout reset",
  menuType: "slash",
  description: "Reset usage counters for a command or an entire scope.",
  options: [{"name": "scope", "description": "Which command type should be reset.", "type": 3, "required": true, "choices": [{"name": "Prefix", "value": "prefix"}, {"name": "Slash", "value": "slash"}, {"name": "Both", "value": "both"}], "min_value": null, "max_value": null}, {"name": "command", "description": "Command name or alias. Leave empty to reset every command in that scope.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "user", "description": "Only reset counters for this user.", "type": 6, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/cmdtimeout__reset.json",
};

export = command;
