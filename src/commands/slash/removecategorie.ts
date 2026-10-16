import type { Command } from '../../core/types';

const command: Command = {
  path: "removecategorie",
  menuType: "slash",
  description: "Remove an apply category from this server.",
  options: [{"name": "name", "description": "The category name to remove.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/removecategorie.json",
};

export = command;
