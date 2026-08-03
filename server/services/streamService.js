import crypto from 'crypto';
import { streamRepository } from '../repositories/streamRepository.js';

/**
 * Service to handle business logic for live streaming,
 * including integration with providers and content moderation.
 */
export const streamService = {
  /**
   * Simple profanity filter for chat messages
   */
  filterContent(text) {
    const bannedWords = (process.env.BANNED_WORDS || 'spam,offensive').split(',');
    let filtered = text;
    bannedWords.forEach((word) => {
      const reg = new RegExp(word.trim(), 'gi');
      filtered = filtered.replace(reg, '***');
    });
    return filtered;
  },

  /**
   * Logic to interface with a provider like Mux or AWS Elemental.
   * In a real implementation, this would call external APIs to create
   * RTMP ingest endpoints and HLS playback URLs.
   */
  async provisionLiveStream(title) {
    // Mocking Mux integration
    const isProd = process.env.NODE_ENV === 'production';

    return {
      streamKey: `sk_${crypto.randomUUID()}`,
      serverUrl: 'rtmp://live.nexasphere.com/app',
      playbackUrl: isProd
        ? `https://stream.nexasphere.com/v1/play/${crypto.randomUUID()}.m3u8`
        : 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Sample HLS
    };
  },

  async updateViewerMetrics(streamId) {
    const currentCount = await streamRepository.incrementViewerCount(streamId);
    // Here you could also push to an analytics dashboard or Prometheus
    return currentCount;
  },

  /**
   * Handles processing of recording webhooks from the video provider.
   */
  async handleRecordingReady(streamId, recordingUrl) {
    return await streamRepository.updateStream(streamId, {
      status: 'archived',
      recordingUrl: recordingUrl,
      endedAt: new Date().toISOString(),
    });
  },
};

export default streamService;
