import type { Command } from '../../core/types';

const command: Command = {
  path: "addqeustion",
  menuType: "slash",
  description: "Add one or more questions to an apply category.",
  options: [{"name": "categorie", "description": "The category name.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "question", "description": "The first question users must answer.", "type": 3, "required": true, "choices": [], "min_value": null, "max_value": null}, {"name": "question_2", "description": "Optional second question.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "question_3", "description": "Optional third question.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "question_4", "description": "Optional fourth question.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "question_5", "description": "Optional fifth question.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}, {"name": "question_6", "description": "Optional sixth question.", "type": 3, "required": false, "choices": [], "min_value": null, "max_value": null}],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "skipped",
  recordingFile: "slash/addqeustion.json",
};

export = command;
