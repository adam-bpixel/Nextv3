import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { findComments } from './support/comments';
import { DIST_DIR, SRC_DIR, TEST_DIR, listFiles, relative } from './support/project';

const MAX_LINES_PER_FEATURE_FILE = 400;
const SIZE_CHECKED_DIRS = [path.join(SRC_DIR, 'features'), path.join(SRC_DIR, 'handlers')];
const OPTIONAL_PATH_PREFIX = 'OPTIONAL_';

interface DirnameJoin {
  file: string;
  line: number;
  segments: string[];
  optional: boolean;
}

function dirnameJoins(file: string): DirnameJoin[] {
  const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const found: DirnameJoin[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.getText(sourceFile) === 'path.join' &&
      node.arguments[0]?.getText(sourceFile) === '__dirname'
    ) {
      const rest = node.arguments.slice(1);
      if (rest.every(ts.isStringLiteralLike)) {
        const declaration = node.parent;
        const optional = ts.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile).startsWith(OPTIONAL_PATH_PREFIX);
        found.push({ file, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1, segments: rest.map((argument) => argument.text), optional });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

describe('project structure', () => {
  it('has no comments in src/ or test/ except tool directives', () => {
    const offenders = [...listFiles(SRC_DIR, /\.ts$/), ...listFiles(TEST_DIR, /\.ts$/)].flatMap((file) =>
      findComments(fs.readFileSync(file, 'utf8'), file).map((comment) => `${relative(file)}:${comment.line} ${comment.text.slice(0, 60)}`),
    );
    assert.deepEqual(offenders, []);
  });

  it(`keeps every feature file under ${MAX_LINES_PER_FEATURE_FILE} lines`, () => {
    const tooLong = SIZE_CHECKED_DIRS.flatMap((dir) => listFiles(dir, /\.ts$/))
      .map((file) => ({ file: relative(file), lines: fs.readFileSync(file, 'utf8').split('\n').length }))
      .filter((entry) => entry.lines > MAX_LINES_PER_FEATURE_FILE);
    assert.deepEqual(tooLong, []);
  });

  it('resolves every path.join(__dirname, ...) in src/', () => {
    const missing = listFiles(SRC_DIR, /\.ts$/)
      .flatMap(dirnameJoins)
      .filter((join) => !join.optional && !fs.existsSync(path.join(path.dirname(join.file), ...join.segments)))
      .map((join) => `${relative(join.file)}:${join.line}`);
    assert.deepEqual(missing, []);
  });

  it('resolves every path.join(__dirname, ...) in dist/ after a build', (context) => {
    if (!fs.existsSync(DIST_DIR)) {
      context.skip('dist/ not built: run npm run build first');
      return;
    }
    const missing = listFiles(SRC_DIR, /\.ts$/)
      .flatMap(dirnameJoins)
      .filter((join) => !join.optional)
      .map((join) => ({ join, compiledDir: path.join(DIST_DIR, path.relative(SRC_DIR, path.dirname(join.file))) }))
      .filter(({ join, compiledDir }) => !fs.existsSync(path.join(compiledDir, ...join.segments)))
      .map(({ join }) => `${relative(join.file)}:${join.line}`);
    assert.deepEqual(missing, []);
  });
});
