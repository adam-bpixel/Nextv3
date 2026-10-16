import type { Command } from '../../core/types';

const command: Command = {
  path: "selfolressections new",
  menuType: "slash",
  description: "Create a new self-role section.",
  options: [{"name": "name", "description": "Name of the new section.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/selfolressections__new.json",
};

export = command;
