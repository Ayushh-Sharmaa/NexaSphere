import { useState } from 'react';
import { moderationService } from '../services/moderationService';

export function useContentModeration() {
  const [moderating, setModerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const moderateContent = async (content, userId, contentType = 'comment') => {
    setModerating(true);
    try {
      const result = await moderationService.moderateContent(content, userId, contentType);
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Moderation failed:', error);
      return {
        isAppropriate: false,
        action: 'block',
        flags: [{ type: 'system_error', confidence: 1 }],
      };
    } finally {
      setModerating(false);
    }
  };

  return {
    moderateContent,
    moderating,
    lastResult,
  };
}
