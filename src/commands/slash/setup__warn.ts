import type { Command } from '../../core/types';

const command: Command = {
  path: "setup warn",
  menuType: "slash",
  description: "Sets up the warn system for this server.",
  options: [{"name": "first_warn_role", "description": "The role given for the first warning.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "second_warn_role", "description": "The role given for the second warning.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "last_warn_role", "description": "The role given for the last warning (often a mute or temporary ban).", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "warner_role", "description": "The role for members who can issue warnings.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "warn_logs_channel", "description": "The channel where warning logs will be sent.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: "warnSetup",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/setup__warn.json",
};

export = command;
