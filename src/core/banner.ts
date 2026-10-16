import config from './config';

type Rgb = readonly [number, number, number];

const GLYPH_HEIGHT = 7;
const BLANK_GLYPH: readonly string[] = Array.from({ length: GLYPH_HEIGHT }, () => '00000');
const LETTER_GAP = '00';

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  G: ['01110', '10001', '10000', '10000', '10011', '10001', '01110'],
};

const GOLD_GRADIENT: readonly Rgb[] = [
  [120, 72, 10],
  [214, 158, 46],
  [255, 215, 0],
  [255, 240, 181],
  [255, 215, 0],
  [214, 158, 46],
];

const RESET = '\x1b[0m';
const DIM_GOLD = '\x1b[38;2;214;158;46m';
const BRIGHT_GOLD = '\x1b[1m\x1b[38;2;255;215;0m';
const LABEL_WIDTH = 16;
const ANSI_PATTERN = new RegExp(`${RESET[0]}\\[[0-9;]*m`, 'g');

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function goldAt(t: number): Rgb {
  const segments = GOLD_GRADIENT.length - 1;
  const position = Math.min(Math.max(t, 0), 1) * segments;
  const index = Math.min(Math.floor(position), segments - 1);
  const start = GOLD_GRADIENT.at(index) ?? [255, 215, 0];
  const end = GOLD_GRADIENT.at(index + 1) ?? start;
  return mix(start, end, position - index);
}

function bannerRows(word: string): string[] {
  const letters = [...word.toUpperCase()].map((letter) => GLYPHS[letter] ?? BLANK_GLYPH);
  return Array.from({ length: GLYPH_HEIGHT }, (_, row) => letters.map((glyph) => (glyph.at(row) ?? '00000') + LETTER_GAP).join(''));
}

function paintGold(rows: readonly string[]): string[] {
  const width = rows.at(0)?.length ?? 0;
  return rows.map((row) =>
    [...row]
      .map((bit, col) => {
        if (bit !== '1') return ' ';
        const [r, g, b] = goldAt(width <= 1 ? 0 : col / (width - 1));
        return `\x1b[1m\x1b[38;2;${r};${g};${b}m█${RESET}`;
      })
      .join(''),
  );
}

function stripAnsi(line: string): string {
  return line.replace(ANSI_PATTERN, '');
}

function centered(line: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - stripAnsi(line).length) / 2));
  return ' '.repeat(pad) + line;
}

function row(label: string, value: string): string {
  return `${BRIGHT_GOLD}${label.padEnd(LABEL_WIDTH)}${RESET}${value}`;
}

function box(lines: readonly string[]): string[] {
  const width = Math.max(...lines.map((line) => stripAnsi(line).length));
  const top = `${DIM_GOLD}╔${'═'.repeat(width + 2)}╗${RESET}`;
  const bottom = `${DIM_GOLD}╚${'═'.repeat(width + 2)}╝${RESET}`;
  const body = lines.map((line) => `${DIM_GOLD}║ ${RESET}${line}${' '.repeat(width - stripAnsi(line).length)} ${DIM_GOLD}║${RESET}`);
  return [top, ...body, bottom];
}

export function printBanner(): void {
  const rows = bannerRows('NEXTGEN');
  const width = rows.at(0)?.length ?? 0;
  console.log();
  for (const line of paintGold(rows)) console.log(line);
  console.log(centered(`${DIM_GOLD}${config.botName}${RESET}`, width));
  console.log();
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
    row('Logged in as', info.tag),
    row('Prefix', `${info.prefix} (${info.prefixCommands} commands)`),
    row('Slash commands', String(info.slashCommands)),
    row('Storage', info.storage),
    row('Checker selfbot', info.checkerSelfbot),
  ];
  for (const line of box(lines)) console.log(line);
}
