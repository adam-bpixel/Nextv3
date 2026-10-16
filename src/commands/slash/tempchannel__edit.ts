import type { Command } from '../../core/types';

const command: Command = {
  path: "tempchannel edit",
  menuType: "slash",
  description: "Edit an existing temporary voice channel trigger.",
  options: [{"name": "trigger_channel", "description": "The configured trigger channel to edit.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "channel_name", "description": "New name template.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "role_to_mention", "description": "Optional role to ping when a room is created.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "notify_channel", "description": "Where creation notices should be sent.", "type": 7, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "user_limit", "description": "New voice user limit. 0 means unlimited.", "type": 4, "required": false, "choices": [], "min_value": 0, "max_value": 99}, {"name": "bitrate", "description": "New bitrate for created rooms.", "type": 4, "required": false, "choices": [], "min_value": 8000, "max_value": 384000}, {"name": "clear_role", "description": "Clear the configured mention role.", "type": 5, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "clear_notify_channel", "description": "Clear the configured notify channel.", "type": 5, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/tempchannel__edit.json",
};

export = command;
