import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { claimMessage, releaseMessage } from '../../core/collectorClaims';
import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { gameAliasLogic } from './gameAlias.logic';
import { pickGamesLogic } from './pickGames.logic';
import { quizGamesLogic } from './quizGames.logic';
import { gameCard } from './ui';
import { vsBotGamesLogic } from './vsBotGames.logic';

type Mark = 'X' | 'O';
type Cell = Mark | null;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

function winner(board: readonly Cell[]): Mark | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function emptyCells(board: readonly Cell[]): number[] {
  return board.reduce<number[]>((acc, cell, index) => (cell ? acc : [...acc, index]), []);
}

function botMove(board: Cell[]): number {
  for (const index of emptyCells(board)) {
    board[index] = 'O';
    if (winner(board) === 'O') { board[index] = null; return index; }
    board[index] = null;
  }
  for (const index of emptyCells(board)) {
    board[index] = 'X';
    if (winner(board) === 'X') { board[index] = null; return index; }
    board[index] = null;
  }
  const open = emptyCells(board);
  const corners = [0, 2, 6, 8].filter((index) => open.includes(index));
  if (board[4] === null) return 4;
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)]!;
  return open[Math.floor(Math.random() * open.length)]!;
}

function renderBoard(board: readonly Cell[], active: boolean): ActionRowBuilder<ButtonBuilder>[] {
  return [0, 1, 2].map((row) => new ActionRowBuilder<ButtonBuilder>().addComponents(
    [0, 1, 2].map((col) => {
      const index = row * 3 + col;
      const cell = board[index];
      return new ButtonBuilder()
        .setCustomId(`ttt:${index}`)
        .setLabel(cell ?? `${index + 1}`)
        .setStyle(cell === 'X' ? ButtonStyle.Success : cell === 'O' ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(!active || cell !== null);
    }),
  ));
}

export const gamesLogic = {
  ...pickGamesLogic,
  ...quizGamesLogic,
  ...vsBotGamesLogic,
  ...gameAliasLogic,

  async tictactoe(ctx) {
    const opponent = await ctx.findUser(0);
    if (opponent?.id === ctx.user.id) return fail(ctx, "You can't challenge yourself.");
    if (opponent?.bot) return fail(ctx, 'You can only challenge a human. Leave the mention out to play me instead.');

    const vsBot = !opponent;
    const board: Cell[] = Array(9).fill(null);
    let turn: Mark = 'X';

    const nameFor = (mark: Mark): string => (mark === 'X' ? `<@${ctx.user.id}>` : vsBot ? 'Me' : `<@${opponent!.id}>`);
    const boardMessage = (): string => `# Tic-Tac-Toe\n${nameFor('X')} (X) vs ${nameFor('O')} (O)\nIt's **${nameFor(turn)}**'s turn.`;

    const message = await ctx.send(gameCard(ctx, boardMessage(), renderBoard(board, true)));
    claimMessage(message.id);
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });
    collector.on('end', () => releaseMessage(message.id));

    collector.on('collect', async (interaction: ButtonInteraction) => {
      const actingId = turn === 'X' ? ctx.user.id : opponent!.id;
      if (interaction.user.id !== actingId) {
        await interaction.reply({ content: "It's not your turn.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
        return;
      }
      const index = Number(interaction.customId.slice('ttt:'.length));
      if (board[index] !== null) {
        await interaction.deferUpdate().catch(() => undefined);
        return;
      }
      board[index] = turn;
      turn = turn === 'X' ? 'O' : 'X';

      if (vsBot && turn === 'O' && !winner(board) && emptyCells(board).length) {
        board[botMove(board)] = 'O';
        turn = 'X';
      }

      const result = winner(board);
      const draw = !result && emptyCells(board).length === 0;
      if (result || draw) {
        collector.stop('finished');
        await interaction.update(gameCard(ctx, result ? `# Tic-Tac-Toe\n${nameFor(result)} won!` : "# Tic-Tac-Toe\nIt's a draw!", renderBoard(board, false))).catch(() => undefined);
        return;
      }
      await interaction.update(gameCard(ctx, boardMessage(), renderBoard(board, true))).catch(() => undefined);
    });

    collector.on('end', (_collected, reason) => {
      if (reason === 'finished') return;
      message.edit(gameCard(ctx, `${boardMessage()}\n-# Game timed out.`, renderBoard(board, false))).catch(() => undefined);
    });

    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
