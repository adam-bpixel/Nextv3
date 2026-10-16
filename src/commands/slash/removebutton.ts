import type { Command } from '../../core/types';

const command: Command = {
  path: "removebutton",
  menuType: "slash",
  description: "Remove a self-role button mapping.",
  options: [{"name": "section", "description": "Section containing the button.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "buttonname", "description": "Name of the button to remove.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/removebutton.json",
};

export = command;
