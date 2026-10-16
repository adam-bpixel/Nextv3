import type { Command } from '../../core/types';

const command: Command = {
  path: "tempchannel delete",
  menuType: "slash",
  description: "Delete a temporary voice channel trigger.",
  options: [{"name": "trigger_channel", "description": "The configured trigger channel to delete.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "delete_active_channels", "description": "Also delete active rooms created by this trigger.", "type": 5, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/tempchannel__delete.json",
};

export = command;
