import type { Command } from '../../../core/types';

const command: Command = {
  name: "pushdatabase",
  aliases: [],
  description: "Pushes default server settings to the database for the current guild.",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
  recordingData: {
    "replies": [
      {
        "content": "You are not authorized to use this command.",
        "embeds": [],
        "components": [],
        "v2": false,
        "attachments": [],
        "reply": true,
        "ping": false
      }
    ],
    "reactions": []
  },
};

export = command;
