import type { Command } from '../../core/types';

const command: Command = {
  path: "selfrolebuttons",
  menuType: "slash",
  description: "Add a button mapping to a self-role section.",
  options: [{"name": "section", "description": "Section to add a button to.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "buttonname", "description": "Display name for the button.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "roletogive", "description": "Role this button gives.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/selfrolebuttons.json",
};

export = command;
