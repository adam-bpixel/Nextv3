import ts from 'typescript';

export const ALLOWED_DIRECTIVES: readonly RegExp[] = [/^#!/, /^\/\/\/\s*<reference\b/, /^\/[/*]\s*eslint-disable/];

export interface FoundComment {
  line: number;
  text: string;
}

export function findComments(text: string, fileName: string): FoundComment[] {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const ranges = new Map<number, ts.CommentRange>();
  const collect = (found: ts.CommentRange[] | undefined): void => {
    for (const range of found ?? []) ranges.set(range.pos, range);
  };
  const visit = (node: ts.Node): void => {
    collect(ts.getLeadingCommentRanges(text, node.getFullStart()));
    collect(ts.getTrailingCommentRanges(text, node.getEnd()));
    for (const child of node.getChildren(sourceFile)) visit(child);
  };
  visit(sourceFile);
  return [...ranges.values()]
    .map((range) => ({ line: sourceFile.getLineAndCharacterOfPosition(range.pos).line + 1, text: text.slice(range.pos, range.end) }))
    .filter((comment) => !ALLOWED_DIRECTIVES.some((directive) => directive.test(comment.text)))
    .sort((a, b) => a.line - b.line);
}
