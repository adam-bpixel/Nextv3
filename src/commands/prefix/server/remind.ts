import type { Command } from '../../../core/types';

const command: Command = {
  name: "remind",
  aliases: [],
  description: "Set a personal reminder.",
  usage: "<duration> <reminder text> (e.g., 1h call mom, 30m take a break)",
  category: "utility",
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
            "accent_color": null,
            "components": [
              {
                "type": 10,
                "content": "# Invalid Usage\nUsage: `&remind <duration> <reminder text>` (e.g., `1h call mom`, `30m take a break`)"
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
        "args": 2,
        "sample": "1m test",
        "replies": [
          {
            "content": "",
            "embeds": [],
            "components": [
              {
                "type": 17,
                "accent_color": null,
                "components": [
                  {
                    "type": 10,
                    "content": "# Reminder Set\nI will remind you in <t:1792076019:R>: `test`"
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
        "kind": "ok"
      }
    ]
  },
};

export = command;
