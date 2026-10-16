import type { Command } from '../../core/types';

const command: Command = {
  path: "updatesection",
  menuType: "slash",
  description: "Update an existing self-role section.",
  options: [{"name": "section", "description": "Section to update.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "mode", "description": "Role selection mode: onerole or multipleroles.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "newname", "description": "Optional new display name.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "newjson", "description": "Optional updated design JSON.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/updatesection.json",
};

export = command;
