import { Events } from 'discord.js';
import config from '../core/config';
import { asBotClient } from '../core/client';
import { printStartupInfo } from '../core/banner';
import { definitions } from '../core/slash';
import { defineEvent } from '../core/types';
import { isConfigured, warmUp } from '../features/checker/selfbot';

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(readyClient) {
    const client = asBotClient(readyClient);
    const slash = [...client.slashCommands.values()];
    printStartupInfo({
      tag: readyClient.user.tag,
      prefix: config.prefix,
      prefixCommands: client.commands.size,
      slashCommands: slash.length,
      storage: config.mongoUri ? `MongoDB (${config.mongoDb})` : 'data/db.json',
      checkerSelfbot: isConfigured() ? 'connecting' : 'not configured',
    });
    warmUp();
    if (!slash.length) return;
    try {
      await readyClient.application.commands.set(definitions(slash));
      console.log('Slash/context-menu commands registered.');
    } catch (error) {
      console.error('Could not register the slash/context-menu commands:', error);
    }
  },
});
