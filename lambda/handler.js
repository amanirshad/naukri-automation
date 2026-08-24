import { runUpdate } from '../src/runUpdate.js';

/**
 * Naukri Automation — AWS Lambda entry (ap-south-1 / Mumbai).
 * Triggered by GitHub Actions via `aws lambda invoke`.
 *
 * Event (optional):
 *   { "dryRun": true }
 */
export async function handler(event = {}) {
  const dryRun = Boolean(event.dryRun);

  try {
    const result = await runUpdate({ dryRun });
    return {
      statusCode: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Lambda failed:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error.message
      }
    };
  }
}
