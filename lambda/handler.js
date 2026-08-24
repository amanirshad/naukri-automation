import { runUpdate } from '../src/runUpdate.js';

/**
 * AWS Lambda entrypoint (region: ap-south-1 / Mumbai).
 * Invoked by GitHub Actions via `aws lambda invoke`.
 *
 * Optional event fields:
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
