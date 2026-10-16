import type { Command } from '../../core/types';

const command: Command = {
  path: "setup verification",
  menuType: "slash",
  description: "Sets up the verification system for this server.",
  options: [{"name": "verified_role", "description": "The role given to verified users.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "verified_female_role", "description": "The role given to verified female users (optional).", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "unverified_role", "description": "The role assigned to unverified users.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "verificator_role", "description": "The role for members who can verify others.", "type": 8, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "verif_logs_channel", "description": "The channel where verification logs will be sent.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: "verificationSetup",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/setup__verification.json",
};

export = command;
