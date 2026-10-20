import { asBotClient } from '../../../core/client';
import { helpMenu } from '../../../features/help/help.ui';
import type { Command } from '../../../core/types';

const command: Command = {
  name: "help",
  aliases: [],
  description: "Show the help menu with categories",
  usage: "",
  category: "utility",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/help.json",
  async execute(ctx) {
    await ctx.send(helpMenu(asBotClient(ctx.client), ctx.user.id, ctx.guild?.id));
  },
};

export = command;
