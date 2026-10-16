import type { Command } from '../../core/types';

const command: Command = {
  path: "setapply",
  menuType: "slash",
  description: "Save the apply panel JSON template for this server.",
  options: [{"name": "json", "description": "Paste the panel JSON here.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "file", "description": "Optional .json attachment for larger payloads.", "type": 11, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/setapply.json",
};

export = command;
