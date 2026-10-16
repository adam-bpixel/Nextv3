import type { Command } from '../../core/types';

const command: Command = {
  path: "setapplymanagers",
  menuType: "slash",
  description: "Set one or more roles that can review applications.",
  options: [{"name": "role_1", "description": "Primary manager role.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "role_2", "description": "Optional second manager role.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "role_3", "description": "Optional third manager role.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "role_4", "description": "Optional fourth manager role.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "role_5", "description": "Optional fifth manager role.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/setapplymanagers.json",
};

export = command;
