import type { Command } from '../../core/types';

const command: Command = {
  path: "selfolressections remove",
  menuType: "slash",
  description: "Remove an existing self-role section.",
  options: [{"name": "name", "description": "Name of the section to remove.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/selfolressections__remove.json",
};

export = command;
