import type { Command } from '../../core/types';

const command: Command = {
  path: "removequestion",
  menuType: "slash",
  description: "Remove a question from an apply category.",
  options: [{"name": "categorie", "description": "The category name.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "number", "description": "The numbered question slot to remove.", "type": 4, "required": true, "choices": [], "min_value": 1, "max_value": 6}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/removequestion.json",
};

export = command;
