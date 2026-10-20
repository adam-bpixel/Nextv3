import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { settingsOf as clanSettingsOf } from '../clans/clans.model';
import { getGameFinderSettings } from '../gamefinder/gamefinder.model';
import { getGuildSetup } from './setup.model';
import { autoReplyView } from './setup.ui.autoreply';
import { autoRoleView } from './setup.ui.autorole';
import { clansSettingsView } from './setup.ui.clans';
import { gameFinderView } from './setup.ui.gamefinder';
import { levelRolesView } from './setup.ui.levelroles';
import { selfRoleSectionsView } from './setup.ui.selfrole';
import { ephemeral } from './setup.logic.helpers';

export const setupCommunityLogic = {
  async setupClansPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const settings = await clanSettingsOf(guild.id);
    await ctx.send(ephemeral(clansSettingsView(settings)));
    return 'completed';
  },

  async setupGamefinderPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const settings = await getGameFinderSettings(guild.id);
    await ctx.send(ephemeral(gameFinderView(settings)));
    return 'completed';
  },

  async setupLevelrolesPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    const entries = (setup.levelRoles ?? [])
      .filter((entry) => guild.roles.cache.has(entry.roleId))
      .map((entry) => ({ id: entry.id, roleId: entry.roleId, roleName: guild.roles.cache.get(entry.roleId)?.name ?? entry.roleId, level: entry.level, kind: entry.kind }));
    await ctx.send(ephemeral(levelRolesView(entries)));
    return 'completed';
  },

  async setupAutorolePanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    const roles = (setup.autoRoleIds ?? [])
      .filter((roleId) => guild.roles.cache.has(roleId))
      .map((id) => ({ id, name: guild.roles.cache.get(id)?.name ?? id }));
    await ctx.send(ephemeral(autoRoleView(roles)));
    return 'completed';
  },

  async setupAutoreplyPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    await ctx.send(ephemeral(autoReplyView(setup.autoReplies ?? [])));
    return 'completed';
  },

  async setupSelfrolePanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    await ctx.send(ephemeral(selfRoleSectionsView(setup.selfRoleSections ?? [])));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
