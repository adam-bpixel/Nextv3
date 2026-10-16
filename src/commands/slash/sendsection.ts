import type { Command } from '../../core/types';

const command: Command = {
  path: "sendsection",
  menuType: "slash",
  description: "Send a configured self-role section to a channel.",
  options: [{"name": "sectionname", "description": "Name of the section to send.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "channelid", "description": "Where the section should be sent.", "type": 7, "required": true, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/sendsection.json",
};

export = command;
