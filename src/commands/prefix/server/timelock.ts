import type { Command } from '../../../core/types';

const command: Command = {
  name: "timelock",
  aliases: [],
  description: "Time Lock The Channel",
  usage: "<duration> (e.g., 1h, 30m, 7d)",
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
                "content": "# Invalid Usage\nUsage: `&timelock <duration>` (e.g., `1h`, `30m`, `7d`)"
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
        "sample": "1m",
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
                    "content": "# Channel Timelocked\nThis channel has been locked until <t:1792074672:F>."
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
