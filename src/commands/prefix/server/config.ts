import type { Command } from '../../../core/types';

const command: Command = {
  name: "config",
  aliases: [],
  description: "Displays the server's verification settings.",
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
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "# General Settings\n\n**Bot Prefix:** ``&``\n**Anti-Bot System:** Disabled\n**Anti-Link System:** Disabled\n**Anti-Webhook System:** Disabled"
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
                "spacing": 2,
                "divider": true
              },
              {
                "type": 10,
                "content": "# Verification Settings\n\n**Verified Role:** Not Set\n**Verified Female Role:** Not Set\n**Unverified Role:** Not Set\n**Verificator Role:** Not Set\n**Verification Logs Channel:** Not Set"
              },
              {
                "type": 14,
                "spacing": 2,
                "divider": true
              },
              {
                "type": 10,
                "content": "# Jail Settings\n\n**Jailer Role:** Not Set\n**Jailed Role:** Not Set\n**Jail Logs Channel:** Not Set"
              },
              {
                "type": 14,
                "spacing": 2,
                "divider": true
              },
              {
                "type": 10,
                "content": "# Warn Settings\n\n**First Warn Role:** Not Set\n**Second Warn Role:** Not Set\n**Last Warn Role:** Not Set\n**Warner Role:** Not Set\n**Warn Logs Channel:** Not Set\n**Move Role:** Not Set\n**Mute Command Role:** Not Set\n**Muted Role:** Not Set\n**Role Logs Channel:** Not Set\n**Mute Logs Channel:** Not Set"
              },
              {
                "type": 14,
                "spacing": 2,
                "divider": true
              },
              {
                "type": 10,
                "content": "# Other Settings\n\n**Blacklisted Channels:** None\n**Disabled Commands:** None\n**Poll Enabled Channels:** None\n**Auto Role System:** Disabled\n**Auto Role:** Not Set\n**Voice Count System:** Disabled\n**Voice Count Channel:** Not Set"
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
            "spoiler": true
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
