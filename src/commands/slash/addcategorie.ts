import type { Command } from '../../core/types';

const command: Command = {
  path: "addcategorie",
  menuType: "slash",
  description: "Add a new apply category to this server.",
  options: [{"name": "name", "description": "The button label and category name.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/addcategorie.json",
};

export = command;
