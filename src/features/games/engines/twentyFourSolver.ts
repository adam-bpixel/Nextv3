interface NumExpr {
  value: number;
  expr: string;
}

const TARGET = 24;
const EPSILON = 1e-6;

function solveFrom(items: readonly NumExpr[]): string | null {
  if (items.length === 1) {
    return Math.abs(items[0]!.value - TARGET) < EPSILON ? items[0]!.expr : null;
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const a = items[i]!;
      const b = items[j]!;
      const rest = items.filter((_, index) => index !== i && index !== j);
      const options: NumExpr[] = [
        { value: a.value + b.value, expr: `(${a.expr}+${b.expr})` },
        { value: a.value - b.value, expr: `(${a.expr}-${b.expr})` },
        { value: a.value * b.value, expr: `(${a.expr}*${b.expr})` },
      ];
      if (Math.abs(b.value) > EPSILON) options.push({ value: a.value / b.value, expr: `(${a.expr}/${b.expr})` });
      for (const option of options) {
        const result = solveFrom([option, ...rest]);
        if (result) return result;
      }
    }
  }
  return null;
}

export function solve24(numbers: readonly number[]): string | null {
  return solveFrom(numbers.map((value) => ({ value, expr: String(value) })));
}

const FALLBACK_SETS: readonly (readonly number[])[] = [
  [4, 6, 6, 8],
  [3, 3, 8, 8],
  [1, 3, 4, 6],
  [2, 3, 4, 6],
  [4, 4, 7, 7],
];

export function randomSolvableQuad(randInt: (low: number, high: number) => number, maxAttempts = 50): { numbers: number[]; solution: string } {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numbers = [randInt(1, 9), randInt(1, 9), randInt(1, 9), randInt(1, 9)];
    const solution = solve24(numbers);
    if (solution) return { numbers, solution };
  }
  const numbers = [...FALLBACK_SETS[randInt(0, FALLBACK_SETS.length - 1)]!];
  const solution = solve24(numbers);
  if (!solution) throw new Error('Fallback 24-game set is unsolvable; this should never happen.');
  return { numbers, solution };
}
