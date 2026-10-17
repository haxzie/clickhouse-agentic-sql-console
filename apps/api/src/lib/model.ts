import { createAnthropic } from '@ai-sdk/anthropic';

import { env } from '../env.js';

/**
 * Shared provider instance. The key is read per call by the SDK, so this is
 * safe to create once even though requests may arrive before it is set.
 */
export const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
