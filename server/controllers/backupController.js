import { backupService } from '../services/backupService.js';
import logger from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getBackups = async (req, res) => {
  try {
    const backups = await backupService.getBackupHistory();
    const stats = await backupService.getStorageStats();
    sendSuccess(res, { backups, stats });
  } catch (err) {
    logger.error('[BackupController] Failed to get backups:', err.message);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

export const runManualBackup = async (req, res) => {
  try {
    const { type } = req.body;
    let key;
    if (type === 'files') {
      await backupService.runFileStorageBackup();
      key = 'uploads/';
    } else {
      key = await backupService.performBackup(type || 'full');
    }
    sendSuccess(res, { message: 'Backup triggered successfully', key });
  } catch (err) {
    logger.error('[BackupController] Manual backup failed:', err.message);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

export const runRestore = async (req, res) => {
  try {
    const { backupKey, targetTime } = req.body;
    let result;
    if (targetTime) {
      result = await backupService.runPITR(targetTime);
    } else if (backupKey) {
      result = await backupService.runRestore(backupKey);
    } else {
      return sendError(
        req,
        res,
        'Either backupKey or targetTime must be provided',
        400,
        'VALIDATION_ERROR'
      );
    }
    sendSuccess(res, { message: 'Restore completed successfully', result });
  } catch (err) {
    logger.error('[BackupController] Restore failed:', err.message);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

export const getRestoreHistory = async (req, res) => {
  try {
    const history = await backupService.getRecoveryTestHistory();
    sendSuccess(res, { history });
  } catch (err) {
    logger.error('[BackupController] Failed to get restore history:', err.message);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

export const deleteBackup = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return sendError(req, res, 'Backup key is required', 400, 'VALIDATION_ERROR');
    }
    await backupService.deleteBackupFile(key);
    sendSuccess(res, { message: 'Backup deleted successfully' });
  } catch (err) {
    logger.error('[BackupController] Delete backup failed:', err.message);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};
