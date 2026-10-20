import type { Command } from '../../../core/types';

const command: Command = {
  name: "find",
  aliases: [],
  description: "Voice Find A Member in Server",
  usage: "<member>",
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
                "content": "# Invalid Usage\nUsage: `&find <member>`"
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
        "sample": "{{mention}}",
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
                    "content": "# Not In Voice Channel\n`3ndk joj 5tiyarat` is not in a voice channel."
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
        "kind": "voice"
      }
    ]
  },
};

export = command;
