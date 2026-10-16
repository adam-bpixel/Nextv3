import type { Command } from '../../core/types';

const command: Command = {
  path: "cmdtimeout set",
  menuType: "slash",
  description: "Create or update a command usage limit.",
  options: [{"name": "scope", "description": "Which command type should be limited.", "type": 3, "required": true, "choices": [{"name": "Prefix", "value": "prefix"}, {"name": "Slash", "value": "slash"}, {"name": "Both", "value": "both"}], "min_value": null, "max_value": null}, {"name": "command", "description": "Command name or alias.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "limit", "description": "How many times each user can use it.", "type": 4, "required": true, "choices": [], "min_value": 1, "max_value": 1000}, {"name": "window", "description": "How often the limit resets.", "type": 3, "required": true, "choices": [{"name": "Per minute", "value": "minute"}, {"name": "Per five minutes", "value": "fiveMinutes"}, {"name": "Per hour", "value": "hour"}, {"name": "Per day", "value": "day"}, {"name": "Per week", "value": "week"}], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/cmdtimeout__set.json",
};

export = command;
