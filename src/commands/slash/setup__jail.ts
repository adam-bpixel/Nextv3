import type { Command } from '../../core/types';

const command: Command = {
  path: "setup jail",
  menuType: "slash",
  description: "Sets up the jail system for this server.",
  options: [{"name": "jailer_role", "description": "The role you need to can jail others.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "jailed_role", "description": "The role assigned to jailed users.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "jail_logs_channel", "description": "The channel where jail logs will be sent.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: "jailSetup",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/setup__jail.json",
};

export = command;
