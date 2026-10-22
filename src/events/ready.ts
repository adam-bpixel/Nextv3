import { Events } from 'discord.js';
import config from '../core/config';
import { asBotClient } from '../core/client';
import { printStartupInfo } from '../core/banner';
import { definitions } from '../core/slash';
import { defineEvent } from '../core/types';
import { syncApplicationEmojis } from '../core/emojis';
import { isConfigured, warmUp } from '../features/checker/selfbot';
import { startVoiceXpTracking } from '../features/levels/voiceTracker';
import { loadThemeCache } from '../features/theme/theme.model';
import { rehydrateClanVoiceSessions } from '../features/clans/clans.voice';
import { primeInviteCache } from '../features/invites/inviteTracker';

const COMMAND_REGISTER_ATTEMPTS = 3;
const COMMAND_REGISTER_RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(readyClient) {
    const client = asBotClient(readyClient);
    const slash = [...client.slashCommands.values()];
    await loadThemeCache();
    printStartupInfo({
      tag: readyClient.user.tag,
      prefix: config.prefix,
      prefixCommands: client.commands.size,
      slashCommands: slash.length,
      storage: `MongoDB ${config.mongoDb}`,
      checkerSelfbot: isConfigured() ? 'connecting' : 'not configured',
    });
    warmUp();
    startVoiceXpTracking(readyClient);
    await rehydrateClanVoiceSessions(readyClient);
    await Promise.all([...readyClient.guilds.cache.values()].map((guild) => primeInviteCache(guild)));
    if (config.emojis) {
      const result = await syncApplicationEmojis(readyClient);
      console.log(`Resolved ${result.resolved}/${result.total} bot emojis.`);
      if (result.missing.length > 0) {
        console.warn(`Emojis not found or failed to upload (${result.missing.length}): ${result.missing.join(', ')}`);
      }
    }
    if (!slash.length) return;
    for (let attempt = 1; attempt <= COMMAND_REGISTER_ATTEMPTS; attempt++) {
      try {
        await readyClient.application.commands.set(definitions(slash));
        console.log('Slash/context-menu commands registered.');
        break;
      } catch (error) {
        const isLastAttempt = attempt === COMMAND_REGISTER_ATTEMPTS;
        console.error(`Could not register the slash/context-menu commands (attempt ${attempt}/${COMMAND_REGISTER_ATTEMPTS}):`, error);
        if (!isLastAttempt) await sleep(COMMAND_REGISTER_RETRY_DELAY_MS * attempt);
      }
    }
  },
});
