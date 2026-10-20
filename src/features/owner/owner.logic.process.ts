import { spawn } from 'node:child_process';
import config from '../../core/config';
import { asBotClient } from '../../core/client';
import { requireGuild } from '../../core/replies';
import { loadCommands, PREFIX_COMMANDS_DIR } from '../../core/loader';
import { clearModule, defaultExport, listSourceFiles, loadModule } from '../../core/modules';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { isRecord } from '../../core/json';
import { getSuggestionSettings, saveSuggestionSettings } from './owner.model';
import { suggestPanel } from './suggestions.ui';
import { errorFailure, isTextChannel, usageFailure, validId } from './owner.logic.helpers';

async function reloadOwnerCommands(ctx: Parameters<CommandHandler>[0]): Promise<void> {
  const client = asBotClient(ctx.client);
  const wanted = ctx.args[0]?.toLowerCase();
  const files = listSourceFiles(PREFIX_COMMANDS_DIR);
  if (wanted) {
    const commandFile = files.find((file) => {
      const command: unknown = defaultExport(loadModule(file));
      return isRecord(command) && (command.name === wanted || (Array.isArray(command.aliases) && command.aliases.includes(wanted)));
    });
    if (!commandFile || !client.findPrefixCommand(wanted)) {
      await ctx.send(errorReply(ctx, `No command named \`${wanted}\` was found.`));
      return;
    }
    clearModule(commandFile);
  } else {
    for (const file of files) clearModule(file);
  }
  loadCommands(client);
  await ctx.send(successReply(ctx, wanted ? `- Reloaded \`${wanted}\`.` : `- Reloaded ${files.length} prefix commands from disk.`));
}

export const ownerProcessLogic = {
  async ownerReload(ctx) {
    await reloadOwnerCommands(ctx);
    return 'completed';
  },

  async ownerRestart(ctx) {
    await ctx.send(successReply(ctx, '- Restarting the bot. It should return in a few seconds.'));
    const supervised = Boolean(
      process.env.pm_id || process.env.NODEMON || process.env.NODE_APP_INSTANCE || process.env.npm_lifecycle_script?.includes('watch'),
    );
    if (!supervised) spawn(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { cwd: process.cwd(), detached: true, stdio: 'ignore' }).unref();
    await ctx.client.destroy();
    setTimeout(() => process.exit(0), 500);
    return 'completed';
  },

  async ownerSendSuggest(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channelId = (raw: string | undefined): string => (raw ?? '').replace(/[<#>]/g, '');
    const panelId = channelId(ctx.args[0]);
    const reviewId = channelId(ctx.args[1]);
    if (!validId.test(panelId) || !validId.test(reviewId)) return usageFailure(ctx, `Mention or give the IDs of two text channels.\nUse: \`${ctx.prefix}sendsuggest <panel channel> <review channel>\`.`);
    const [panel, review] = await Promise.all([guild.channels.fetch(panelId).catch(() => null), guild.channels.fetch(reviewId).catch(() => null)]);
    if (!isTextChannel(panel) || !isTextChannel(review)) return errorFailure(ctx, 'Both IDs must point to text channels in this server.');
    const previous = await getSuggestionSettings(guild.id);
    const sent = await panel.send(suggestPanel(config.botName)).catch(() => null);
    if (!sent) return errorFailure(ctx, `I couldn't post the suggestions panel in <#${panel.id}>.`);
    if (previous.panelChannelId && previous.panelMessageId) {
      const oldChannel = await guild.channels.fetch(previous.panelChannelId).catch(() => null);
      const oldMessage = oldChannel?.isTextBased() && 'messages' in oldChannel
        ? await oldChannel.messages.fetch(previous.panelMessageId).catch(() => null)
        : null;
      await oldMessage?.edit({ components: [] }).catch(() => undefined);
    }
    await saveSuggestionSettings(guild.id, { panelChannelId: panel.id, reviewChannelId: review.id, panelMessageId: sent.id });
    await ctx.send(successReply(ctx, `- Suggestions panel posted in <#${panel.id}>.\n- Reviews will be sent to <#${review.id}>.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
