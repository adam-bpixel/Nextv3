import type { Command } from '../../core/types';

const command: Command = {
  path: "tempchannel create",
  menuType: "slash",
  description: "Create a temporary voice channel trigger.",
  options: [{"name": "trigger_channel", "description": "The voice channel users join to create their own room.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "channel_name", "description": "Name template. Supports {display}, {user}, {tag}, and {id}.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "role_to_mention", "description": "Optional role to ping when a room is created.", "type": 8, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "notify_channel", "description": "Where creation notices should be sent.", "type": 7, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "user_limit", "description": "Voice user limit for created rooms. 0 means unlimited.", "type": 4, "required": false, "choices": [], "min_value": 0, "max_value": 99}, {"name": "bitrate", "description": "Bitrate for created rooms in bits per second.", "type": 4, "required": false, "choices": [], "min_value": 8000, "max_value": 384000}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/tempchannel__create.json",
};

export = command;
