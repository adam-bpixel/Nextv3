import type { Command } from '../../../core/types';

const command: Command = {
  name: "disabledcmd",
  aliases: [],
  description: "Manage disabled commands in your server.",
  usage: "<disable|enable|list> [command name]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
  recordingData: {
    "replies": [
      {
        "content": "",
        "embeds": [],
        "components": [
          {
            "type": 17,
            "accent_color": 16766720,
            "components": [
              {
                "type": 10,
                "content": "# Invalid Usage\nUsage: `&disabledcmd <disable|enable|list> [command name]`"
              }
            ],
            "spoiler": false
          }
        ],
        "v2": true,
        "attachments": [],
        "reply": false,
        "ping": false
      }
    ],
    "reactions": []
  },
};

export = command;
