import type { Command } from '../../../core/types';

const command: Command = {
  name: "hide",
  aliases: [],
  description: "Hide Channel From everyone",
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
        "content": "",
        "embeds": [],
        "components": [
          {
            "type": 17,
            "accent_color": 16766720,
            "components": [
              {
                "type": 10,
                "content": "# Channel Hidden\nSuccessfully hid this channel."
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
