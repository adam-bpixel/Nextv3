import type { Command } from '../../../core/types';

const command: Command = {
  name: "invimage",
  aliases: [],
  description: "Show the server's invite image / splash",
  usage: "",
  category: "Information",
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
                "content": "# Server Invite Image for {{guild}}"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "```fix\n❌ This server has no invite image (vanity splash).\n```"
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
                    "content": "You can invite people using the button below."
                  }
                ],
                "accessory": {
                  "type": 2,
                  "style": 5,
                  "label": "Invite {{guild}}",
                  "url": "https://discord.gg/2rFEuDF4we"
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
