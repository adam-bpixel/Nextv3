import { createRequire } from 'node:module';
import { TEST_DIR, listFiles } from './support/project';

const TEST_FILE = /\.test\.ts$/;
const requireTest = createRequire(__filename);

for (const file of listFiles(TEST_DIR, TEST_FILE).sort()) requireTest(file);
