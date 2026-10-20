import type { Command } from '../../../core/types';

const command: Command = {
  name: "verify",
  aliases: [],
  description: "Sends a verification message with gender selection buttons.",
  usage: "",
  category: "Verification",
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
            "accent_color": null,
            "components": [
              {
                "type": 10,
                "content": "## {{guild}}"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "# Verification System Incomplete\nVerification system is not fully set up. Please use `/verif-setup` to configure."
                  }
                ],
                "accessory": {
                  "type": 11,
                  "media": {
                    "url": "https://cdn.discordapp.com/icons/1490716828836696077/31e8b352428e40a00c1f0ef9551cf262.webp?size=128"
                  },
                  "description": null,
                  "spoiler": false
                }
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "-# © 2025 Next v3. All rights reserved"
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
