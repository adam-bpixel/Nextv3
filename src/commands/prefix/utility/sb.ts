import type { Command } from '../../../core/types';

const command: Command = {
  name: "sb",
  aliases: [],
  description: "Enable or disable SoundBoard in the channel.",
  usage: "<enable|disable> [channel]",
  category: "moderation",
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
                "content": "# Invalid Usage\nUsage: `&sb <enable|disable> [channel]`"
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
    "reactions": [],
    "variants": [
      {
        "args": 1,
        "sample": "test",
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
                    "content": "# Invalid Usage\nUsage: `&sb <enable|disable> [channel]`"
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
        "reactions": [],
        "flow": null,
        "extra_flows": [],
        "kind": "usage"
      }
    ]
  },
};

export = command;
