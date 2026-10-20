import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { claimMessage, releaseMessage } from '../../../core/collectorClaims';
import type { Ctx, NonEmptyArray } from '../../../core/context';
import { pickRandom } from '../../../core/context';
import type { CommandOutcome } from '../../../core/types';
import { gameCard } from '../ui';

const TIMEOUT_MS = 30_000;

export interface Move {
  key: string;
  label: string;
}

export interface MoveGameConfig {
  title: string;
  intro: string;
  moves: NonEmptyArray<Move>;
  beats: Readonly<Record<string, readonly string[]>>;
}

function header(cfg: MoveGameConfig, extra: string): string {
  return `# ${cfg.title}\n${cfg.intro}\n\n${extra}`;
}

function buttons(moves: NonEmptyArray<Move>, disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    moves.map((move) => new ButtonBuilder().setCustomId(`move:${move.key}`).setLabel(move.label).setStyle(ButtonStyle.Secondary).setDisabled(disabled)),
  );
}

export async function playMoveGame(ctx: Ctx, cfg: MoveGameConfig): Promise<CommandOutcome> {
  const message = await ctx.send(gameCard(ctx, header(cfg, `Click a button within ${TIMEOUT_MS / 1000} seconds.`), [buttons(cfg.moves, false)]));
  claimMessage(message.id);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: TIMEOUT_MS });
  collector.on('end', () => releaseMessage(message.id));

  collector.on('collect', (interaction) => {
    void (async () => {
      if (interaction.user.id !== ctx.user.id) {
        await interaction.reply({ content: "This isn't your game.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
        return;
      }
      const playerKey = interaction.customId.slice('move:'.length);
      const bot = pickRandom(cfg.moves);
      const outcome = cfg.beats[playerKey]?.includes(bot.key) ? 'win' : cfg.beats[bot.key]?.includes(playerKey) ? 'lose' : 'draw';
      const line = outcome === 'win' ? 'You win this round.' : outcome === 'lose' ? 'I win this one.' : "It's a draw.";
      collector.stop('answered');
      await interaction.update(gameCard(ctx, header(cfg, `I picked **${bot.label.toLowerCase()}**. ${line}`), [buttons(cfg.moves, true)])).catch(() => undefined);
    })();
  });

  collector.on('end', (_collected, reason) => {
    if (reason === 'answered') return;
    message.edit(gameCard(ctx, `${header(cfg, 'Click a button within 30 seconds.')}\n-# Game timed out.`, [buttons(cfg.moves, true)])).catch(() => undefined);
  });

  return 'completed';
}
