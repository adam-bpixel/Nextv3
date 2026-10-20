import { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SeparatorBuilder, type ButtonInteraction } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { clanOf } from '../clans/clans.model';
import { clanEntries, clanMemberEntries, myTopRank, TITLES, TOP_SUBS, type TopSub } from './top.logic';
import { renderMyTopBanner } from './topCanvas';
import { topListEmbed } from './topList.ui';

const CUSTOM_ID = new RegExp(`^top:me:(${TOP_SUBS.join('|')}):(\\d{15,22})$`);
const PAGE_CUSTOM_ID = /^top:page:(clans|members):(\d{15,22}):(-?\d+)$/;

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'top:page',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && PAGE_CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = PAGE_CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, sub, invokerId, pageText] = parsed as unknown as [string, 'clans' | 'members', string, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }
      const guild = interaction.guild ?? (interaction.guildId ? await interaction.client.guilds.fetch(interaction.guildId).catch(() => null) : null);
      if (!guild) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find this server anymore."));
        return;
      }

      let title = TITLES[sub] ?? 'Top';
      const entries = await (async () => {
        if (sub === 'members') {
          const clan = await clanOf(guild.id, invokerId);
          if (!clan) return null;
          title = clan.name;
          return clanMemberEntries(guild, clan);
        }
        return clanEntries(guild);
      })();

      if (!entries) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "You're not in a clan."));
        return;
      }

      const accent = cachedColor(guild.id) ?? config.color;
      await interaction.update(topListEmbed(accent, title, entries, Number(pageText), sub, invokerId));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'top:me',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, sub, invokerId] = parsed as unknown as [string, TopSub, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use this button.`));
        return;
      }
      if (!interaction.guildId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Run this inside a server to see your rank.'));
        return;
      }

      const guild = interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId).catch(() => null));
      if (!guild) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find this server anymore."));
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await myTopRank(guild, sub, interaction.user.id);
      if (!result) {
        const payload = themedReplyFor(
          interaction.guildId,
          false,
          'error',
          sub === 'clans' || sub === 'members' ? "You're not in a clan." : "You're not ranked yet.",
        );
        await interaction.editReply({ ...payload, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        return;
      }

      const fileName = 'my-rank.png';
      const buffer = await renderMyTopBanner(result, result.rank, result.total);
      const accent = cachedColor(guild.id) ?? config.color;
      const container = new ContainerBuilder()
        .setAccentColor(accent)
        .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)))
        .addSeparatorComponents(new SeparatorBuilder());
      await interaction.editReply({
        components: [container.toJSON()],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        files: [{ attachment: buffer, name: fileName }],
      });
    },
  }),
];
