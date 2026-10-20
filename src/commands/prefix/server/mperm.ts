import type { Command } from '../../../core/types';

const command: Command = {
  name: "mperm",
  aliases: [],
  description: "Add a role or user to the channel permissions.",
  usage: "<user or role mention/ID>",
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
                "content": "# Invalid Usage\nUsage: `&mperm <user or role mention/ID>`"
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
