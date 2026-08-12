import crypto from 'crypto';
import { featureFlagsRepository } from '../repositories/featureFlagsRepository.js';
import logger from '../utils/logger.js';

class FeatureFlagsService {
  constructor() {
    this.cache = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.reloadCache();
      this.isInitialized = true;
      logger.info('Feature flags service initialized successfully.');
    } catch (error) {
      logger.error('Failed to initialize feature flags cache', { error: error.message });
    }
  }

  async reloadCache() {
    try {
      const flags = await featureFlagsRepository.getAllFlags();
      const newCache = new Map();
      for (const flag of flags) {
        newCache.set(flag.key, flag);
      }
      this.cache = newCache;
    } catch (error) {
      logger.error('Error reloading feature flags cache', { error: error.message });
      throw error;
    }
  }

  async getFlags() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return Array.from(this.cache.values());
  }

  async getFlagByKey(key) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.cache.get(key) || null;
  }

  async createFlag(flagData, changedBy = 'admin') {
    const flag = await featureFlagsRepository.createFlag(flagData);
    await featureFlagsRepository.recordHistory({
      flagKey: flag.key,
      action: 'CREATE',
      changedBy,
      oldState: null,
      newState: flag,
    });
    if (flag.type === 'ab_test') {
      await featureFlagsRepository.initializeABMetrics(flag.key);
    }
    this.cache.set(flag.key, flag);
    return flag;
  }

  async updateFlag(key, updates, changedBy = 'admin') {
    const oldFlag = await this.getFlagByKey(key);
    const updatedFlag = await featureFlagsRepository.updateFlag(key, updates);
    if (!updatedFlag) return null;

    await featureFlagsRepository.recordHistory({
      flagKey: key,
      action: 'UPDATE',
      changedBy,
      oldState: oldFlag,
      newState: updatedFlag,
    });

    if (
      updates.type === 'ab_test' ||
      (updatedFlag.type === 'ab_test' && oldFlag?.type !== 'ab_test')
    ) {
      await featureFlagsRepository.initializeABMetrics(key);
    }

    this.cache.set(key, updatedFlag);
    return updatedFlag;
  }

  async toggleFlag(key, isActive, changedBy = 'admin') {
    const oldFlag = await this.getFlagByKey(key);
    const updatedFlag = await featureFlagsRepository.updateFlag(key, { is_active: isActive });
    if (!updatedFlag) return null;

    await featureFlagsRepository.recordHistory({
      flagKey: key,
      action: isActive ? 'ENABLE' : 'DISABLE',
      changedBy,
      oldState: oldFlag,
      newState: updatedFlag,
    });

    this.cache.set(key, updatedFlag);
    return updatedFlag;
  }

  async deleteFlag(key, changedBy = 'admin') {
    const oldFlag = await this.getFlagByKey(key);
    const success = await featureFlagsRepository.deleteFlag(key);
    if (success) {
      await featureFlagsRepository.recordHistory({
        flagKey: key,
        action: 'DELETE',
        changedBy,
        oldState: oldFlag,
        newState: null,
      });
      this.cache.delete(key);
    }
    return success;
  }

  evaluateFlag(flag, context = {}) {
    const defaultEnv = process.env.NODE_ENV || 'development';
    const currentEnv = context.environment || defaultEnv;
    const currentTimestamp = context.timestamp ? new Date(context.timestamp) : new Date();

    // 1. Kill switch / Global status
    if (!flag.is_active) {
      return flag.fallback_value || false;
    }

    // 2. Environment target validation
    if (flag.environments && flag.environments.length > 0) {
      if (!flag.environments.includes(currentEnv)) {
        return false;
      }
    }

    // 3. Time target validation
    if (flag.start_time) {
      const startTime = new Date(flag.start_time);
      if (currentTimestamp < startTime) return false;
    }
    if (flag.end_time) {
      const endTime = new Date(flag.end_time);
      if (currentTimestamp > endTime) return false;
    }

    // 4. User ID direct target whitelist
    if (context.userId && flag.target_users && flag.target_users.length > 0) {
      const normalizedUserId = String(context.userId).trim();
      const userWhitelist = flag.target_users.map((u) => String(u).trim());
      if (userWhitelist.includes(normalizedUserId)) {
        return true;
      }
    }

    // 5. User Role direct target whitelist
    if (context.role && flag.target_roles && flag.target_roles.length > 0) {
      const normalizedRole = String(context.role).trim().toLowerCase();
      const roleWhitelist = flag.target_roles.map((r) => String(r).trim().toLowerCase());
      if (roleWhitelist.includes(normalizedRole)) {
        return true;
      }
    }

    // 6. Percentage rollout or A/B Testing
    if (flag.type === 'percentage' || flag.type === 'ab_test') {
      const rolloutPercentage = flag.type === 'ab_test' ? 50 : (flag.rollout_percentage ?? 100);
      if (context.userId) {
        // Deterministic hash-based rollout to prevent flip-flopping
        const hash = crypto.createHash('md5').update(`${flag.key}:${context.userId}`).digest('hex');
        const bucket = parseInt(hash.substring(0, 4), 16) % 100;
        return bucket < rolloutPercentage;
      } else {
        // Fallback to random if no userId provided
        return Math.random() * 100 < rolloutPercentage;
      }
    }

    // Default fallback
    return true;
  }

  async isEnabled(key, context = {}) {
    const flag = await this.getFlagByKey(key);
    if (!flag) {
      return false;
    }
    return this.evaluateFlag(flag, context);
  }

  async getFlagHistory(key) {
    return featureFlagsRepository.getHistory(key);
  }

  async getABTestGroup(key, userId) {
    const flag = await this.getFlagByKey(key);
    if (!flag || flag.type !== 'ab_test') return null;

    // Evaluate if user is active in the rollout
    const active = this.evaluateFlag(flag, { userId });
    const group = active ? 'variant' : 'control';

    // Record participant in background
    featureFlagsRepository.recordABParticipant(key, group).catch((err) => {
      logger.error('Error recording AB participant', { error: err.message });
    });

    return group;
  }

  async trackABConversion(key, userId) {
    const flag = await this.getFlagByKey(key);
    if (!flag || flag.type !== 'ab_test') return false;

    // Re-evaluate what group the user belongs to
    const active = this.evaluateFlag(flag, { userId });
    const group = active ? 'variant' : 'control';

    await featureFlagsRepository.recordABConversion(key, group);
    return true;
  }

  async getABTestAnalytics(key) {
    const metrics = await featureFlagsRepository.getABTestMetrics(key);
    const control = metrics.find((m) => m.group_name === 'control') || {
      participants_count: 0,
      conversions_count: 0,
    };
    const variant = metrics.find((m) => m.group_name === 'variant') || {
      participants_count: 0,
      conversions_count: 0,
    };

    const cRateControl =
      control.participants_count > 0 ? control.conversions_count / control.participants_count : 0;
    const cRateVariant =
      variant.participants_count > 0 ? variant.conversions_count / variant.participants_count : 0;

    // Statistical significance using two-proportion z-test
    let isSignificant = false;
    let pValue = 1.0;
    let zScore = 0.0;

    const totalConversions = control.conversions_count + variant.conversions_count;
    const totalParticipants = control.participants_count + variant.participants_count;

    if (control.participants_count > 0 && variant.participants_count > 0 && totalParticipants > 0) {
      const pPooled = totalConversions / totalParticipants;
      if (pPooled > 0 && pPooled < 1) {
        const se = Math.sqrt(
          pPooled *
            (1 - pPooled) *
            (1 / control.participants_count + 1 / variant.participants_count)
        );
        zScore = (cRateVariant - cRateControl) / se;
        // Two-tailed p-value approximation using error function (erf)
        const absZ = Math.abs(zScore);
        // Standard normal CDF approximation
        const t = 1 / (1 + 0.2316419 * absZ);
        const d = 0.3989423 * Math.exp((-absZ * absZ) / 2);
        const prob =
          d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        pValue = 2 * prob;
        isSignificant = absZ >= 1.96; // 95% confidence level
      }
    }

    return {
      flagKey: key,
      control: {
        participants: control.participants_count,
        conversions: control.conversions_count,
        conversionRate: cRateControl,
      },
      variant: {
        participants: variant.participants_count,
        conversions: variant.conversions_count,
        conversionRate: cRateVariant,
      },
      analytics: {
        conversionRateLift: cRateControl > 0 ? (cRateVariant - cRateControl) / cRateControl : 0,
        zScore,
        pValue,
        isSignificant,
      },
    };
  }

  async resetABTest(key) {
    await featureFlagsRepository.resetABMetrics(key);
    return true;
  }

  async checkStaleFlags(staleThresholdDays = 30) {
    const staleFlags = await featureFlagsRepository.getStaleFlags(staleThresholdDays);
    return staleFlags.map((flag) => ({
      key: flag.key,
      name: flag.name,
      updatedAt: flag.updated_at,
      daysStale: Math.floor(
        (Date.now() - new Date(flag.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }
}

export const featureFlagsService = new FeatureFlagsService();
