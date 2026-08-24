#!/usr/bin/env node

import 'dotenv/config';
import { runUpdate } from '../src/runUpdate.js';

const dryRun = process.argv.includes('--dry-run');

try {
  const result = await runUpdate({ dryRun });
  if (!result.success) {
    process.exit(1);
  }
} catch (err) {
  console.error('Fatal error:', err.message);
  process.exit(1);
}
