import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { getGuildSecurity } from '../security/security.model';
import { getCheckerRoles, getGuildSetup, getJailSetup, getMuteSetup, getWarnSetup } from './setup.model';
import { altTrackerView } from './setup.ui.alttracker';
import { blacklistView } from './setup.ui.blacklist';
import { checkerView } from './setup.ui.checker';
import { jailView } from './setup.ui.jail';
import { muteView } from './setup.ui.mute';
import { warnView } from './setup.ui.warn';
import { ephemeral } from './setup.logic.helpers';

export const setupModerationLogic = {
  async setupJailPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getJailSetup(guild.id);
    await ctx.send(ephemeral(jailView(setup)));
    return 'completed';
  },

  async setupWarnPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getWarnSetup(guild.id);
    await ctx.send(ephemeral(warnView(setup)));
    return 'completed';
  },

  async setupMutePanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getMuteSetup(guild.id);
    await ctx.send(ephemeral(muteView(setup)));
    return 'completed';
  },

  async setupBlacklistPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    const entries = (setup.blacklistedChannelIds ?? [])
      .filter((id) => guild.channels.cache.has(id))
      .map((id) => ({ id, name: guild.channels.cache.get(id)?.name ?? id }));
    await ctx.send(ephemeral(blacklistView(entries)));
    return 'completed';
  },

  async setupCheckerPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const roleIds = await getCheckerRoles(guild.id);
    await ctx.send(ephemeral(checkerView(roleIds)));
    return 'completed';
  },

  async setupAlttrackerPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const settings = (await getGuildSecurity(guild.id)).alttracker;
    await ctx.send(ephemeral(altTrackerView(settings)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
