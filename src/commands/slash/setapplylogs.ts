import type { Command } from '../../core/types';

const command: Command = {
  path: "setapplylogs",
  menuType: "slash",
  description: "Set the channel used for application review logs.",
  options: [{"name": "channel", "description": "The channel where apply submissions will be sent.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/setapplylogs.json",
};

export = command;
