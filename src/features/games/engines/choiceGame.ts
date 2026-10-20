import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { claimMessage, releaseMessage } from '../../../core/collectorClaims';
import type { Ctx } from '../../../core/context';
import type { CommandOutcome } from '../../../core/types';
import { gameCard } from '../ui';

const TIMEOUT_MS = 30_000;

export interface ChoiceGameConfig {
  title: string;
  intro: string;
  options: readonly string[];
  isCorrect(index: number): boolean;
  resultLine(index: number, won: boolean): string;
}

function header(cfg: ChoiceGameConfig, extra: string): string {
  return `# ${cfg.title}\n${cfg.intro}\n\n${extra}`;
}

function buttons(options: readonly string[], disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    options.map((label, index) => new ButtonBuilder().setCustomId(`choice:${index}`).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled)),
  );
}

export async function playChoiceGame(ctx: Ctx, cfg: ChoiceGameConfig): Promise<CommandOutcome> {
  const message = await ctx.send(gameCard(ctx, header(cfg, `Click a button within ${TIMEOUT_MS / 1000} seconds.`), [buttons(cfg.options, false)]));
  claimMessage(message.id);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: TIMEOUT_MS });
  collector.on('end', () => releaseMessage(message.id));

  collector.on('collect', (interaction) => {
    void (async () => {
      if (interaction.user.id !== ctx.user.id) {
        await interaction.reply({ content: "This isn't your game.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
        return;
      }
      const index = Number(interaction.customId.slice('choice:'.length));
      const won = cfg.isCorrect(index);
      collector.stop('answered');
      await interaction.update(gameCard(ctx, header(cfg, cfg.resultLine(index, won)), [buttons(cfg.options, true)])).catch(() => undefined);
    })();
  });

  collector.on('end', (_collected, reason) => {
    if (reason === 'answered') return;
    message.edit(gameCard(ctx, `${header(cfg, 'Click a button within 30 seconds.')}\n-# Game timed out.`, [buttons(cfg.options, true)])).catch(() => undefined);
  });

  return 'completed';
}
