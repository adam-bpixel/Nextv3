import type { Command } from '../../../core/types';

const command: Command = {
  name: "verifpanel",
  aliases: [],
  description: "Sends a verification panel with Male/Female buttons.",
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
            "accent_color": 15844367,
            "components": [
              {
                "type": 10,
                "content": "# Verification Panel"
              },
              {
                "type": 14,
                "spacing": 2,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "Please click the appropriate button to verify the user's gender."
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
                "type": 1,
                "components": [
                  {
                    "type": 2,
                    "custom_id": "verify_male",
                    "style": 2,
                    "label": "Male",
                    "emoji": {
                      "name": "♂️"
                    }
                  },
                  {
                    "type": 2,
                    "custom_id": "verify_female",
                    "style": 2,
                    "label": "Female",
                    "emoji": {
                      "name": "♀️"
                    }
                  }
                ]
              }
            ],
            "spoiler": false
          }
        ],
        "v2": true,
        "attachments": [],
        "reply": false,
        "ping": false,
        "primary": true
      }
    ],
    "reactions": [],
    "flow": {
      "start": "s0",
      "states": {
        "s0": {
          "content": "",
          "embeds": [],
          "components": [
            {
              "type": 17,
              "accent_color": 15844367,
              "components": [
                {
                  "type": 10,
                  "content": "# Verification Panel"
                },
                {
                  "type": 14,
                  "spacing": 2,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "Please click the appropriate button to verify the user's gender."
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
                  "type": 1,
                  "components": [
                    {
                      "type": 2,
                      "custom_id": "verify_male",
                      "style": 2,
                      "label": "Male",
                      "emoji": {
                        "name": "♂️"
                      }
                    },
                    {
                      "type": 2,
                      "custom_id": "verify_female",
                      "style": 2,
                      "label": "Female",
                      "emoji": {
                        "name": "♀️"
                      }
                    }
                  ]
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
      },
      "transitions": [
        {
          "from": "s0",
          "custom_id": "verify_male",
          "value": null,
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Verify User as Male",
            "custom_id": "verify_modal_male",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "userIdInput",
                    "style": 1,
                    "label": "User ID",
                    "placeholder": "Enter the User ID of the member to verify",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              }
            ]
          }
        },
        {
          "from": "s0",
          "custom_id": "verify_female",
          "value": null,
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Verify User as Female",
            "custom_id": "verify_modal_female",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "userIdInput",
                    "style": 1,
                    "label": "User ID",
                    "placeholder": "Enter the User ID of the member to verify",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              }
            ]
          }
        }
      ],
      "id": "prefix:verifpanel#0"
    }
  },
};

export = command;
