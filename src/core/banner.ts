import config from './config';

const RESET = '\x1b[0m';
const DIM_GOLD = '\x1b[38;2;214;158;46m';
const BRIGHT_GOLD = '\x1b[1m\x1b[38;2;255;215;0m';
const LABEL_WIDTH = 9;
const ANSI_PATTERN = new RegExp(`${RESET[0]}\\[[0-9;]*m`, 'g');

function stripAnsi(line: string): string {
  return line.replace(ANSI_PATTERN, '');
}

function row(label: string, value: string): string {
  return `${BRIGHT_GOLD}${label.padEnd(LABEL_WIDTH)}${DIM_GOLD}${value}${RESET}`;
}

function box(lines: readonly string[]): string[] {
  const width = Math.max(...lines.map((line) => stripAnsi(line).length));
  const top = `${DIM_GOLD}╔${'═'.repeat(width + 2)}╗${RESET}`;
  const bottom = `${DIM_GOLD}╚${'═'.repeat(width + 2)}╝${RESET}`;
  const body = lines.map((line) => `${DIM_GOLD}║ ${RESET}${line}${' '.repeat(width - stripAnsi(line).length)} ${DIM_GOLD}║${RESET}`);
  return [top, ...body, bottom];
}

export interface StartupInfo {
  tag: string;
  prefix: string;
  prefixCommands: number;
  slashCommands: number;
  storage: string;
  checkerSelfbot: string;
}

export function printStartupInfo(info: StartupInfo): void {
  const lines = [
    `${BRIGHT_GOLD}${config.botName}${RESET}`,
    row('Bot', info.tag),
    row('Prefix', `${info.prefix} ${info.prefixCommands} cmds`),
    row('Slash', String(info.slashCommands)),
    row('Storage', info.storage),
    row('Checker', info.checkerSelfbot),
  ];
  console.log();
  for (const line of box(lines)) console.log(line);
  console.log();
}
