import type { Command } from '../../../core/types';

const command: Command = {
  name: "poll",
  aliases: [],
  description: "Enable or disable polls in the channel, or make a poll $poll <on|off> OR $poll <poll question>",
  usage: "<on|off> OR &poll <poll question>",
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
            "accent_color": null,
            "components": [
              {
                "type": 10,
                "content": "# Invalid Usage\nUsage: `&poll <on|off>` OR `&poll <poll question>`"
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
        "sample": "test test",
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
                    "content": "# Polls Not Enabled\nPolls are not enabled in this channel. Use `&poll on` to enable them."
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
