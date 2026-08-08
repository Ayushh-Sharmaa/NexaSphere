import { sendSuccess } from '../utils/responseHelper.js';
import duplicateService from '../services/duplicateDetectionService.js';

export const getOverview = (req, res) => {
  sendSuccess(res, duplicateService.getOverview());
};

export const checkRecord = (req, res) => {
  sendSuccess(res, duplicateService.checkRecord(req.body));
};

export const getDuplicateEvents = (req, res) => {
  sendSuccess(res, duplicateService.detectDuplicateEvents());
};

export const getDuplicateMedia = (req, res) => {
  sendSuccess(res, duplicateService.detectDuplicateMedia());
};

export const getPortfolioDuplicates = (req, res) => {
  sendSuccess(res, duplicateService.detectPortfolioDuplicates());
};

export const getClubDuplicates = (req, res) => {
  sendSuccess(res, duplicateService.detectClubDuplicates());
};

export const mergeDuplicates = (req, res) => {
  const { id1, id2 } = req.body;

  sendSuccess(res, duplicateService.mergeDuplicates(id1, id2));
};

export const deleteDuplicate = (req, res) => {
  sendSuccess(res, duplicateService.deleteDuplicate(req.params.id));
};

export const getStatistics = (req, res) => {
  sendSuccess(res, duplicateService.getStatistics());
};
