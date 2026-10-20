const NUMBER_OR_OPERATOR = /\d+\.?\d*|[()+\-*/]/g;

function tokenize(expression: string): string[] | null {
  const cleaned = expression.trim();
  if (!cleaned) return null;
  const tokens = cleaned.match(NUMBER_OR_OPERATOR);
  if (!tokens) return null;
  if (tokens.join('').length !== cleaned.replace(/\s+/g, '').length) return null;
  return tokens;
}

class ExpressionParser {
  pos = 0;
  constructor(private readonly tokens: string[]) {}

  private peek(): string | undefined {
    return this.tokens[this.pos];
  }

  private next(): string | undefined {
    return this.tokens[this.pos++];
  }

  parseExpression(): number | null {
    let value = this.parseTerm();
    if (value === null) return null;
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next();
      const rhs = this.parseTerm();
      if (rhs === null) return null;
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number | null {
    let value = this.parseFactor();
    if (value === null) return null;
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.next();
      const rhs = this.parseFactor();
      if (rhs === null) return null;
      if (op === '/' && rhs === 0) return null;
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }

  private parseFactor(): number | null {
    const token = this.peek();
    if (token === undefined) return null;
    if (token === '(') {
      this.next();
      const value = this.parseExpression();
      if (value === null || this.next() !== ')') return null;
      return value;
    }
    if (token === '-') {
      this.next();
      const value = this.parseFactor();
      return value === null ? null : -value;
    }
    if (/^\d+\.?\d*$/.test(token)) {
      this.next();
      return Number(token);
    }
    return null;
  }
}

export function evaluateExpression(expression: string): number | null {
  const tokens = tokenize(expression);
  if (!tokens) return null;
  const parser = new ExpressionParser(tokens);
  const value = parser.parseExpression();
  if (value === null || parser.pos !== tokens.length) return null;
  return value;
}

export function numbersUsedIn(expression: string): number[] {
  const tokens = tokenize(expression) ?? [];
  return tokens.filter((token) => /^\d+\.?\d*$/.test(token)).map(Number);
}

export function sameMultiset(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => Math.abs(value - sortedB[index]!) < 1e-9);
}
