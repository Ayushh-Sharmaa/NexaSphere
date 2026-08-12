import bookmarkService from '../services/bookmarkService.js';
import { sendSuccess } from '../utils/responseHelper.js';

const getUserId = (req) => req.user?.id || req.user?.userId || req.headers['x-user-id'] || 'anonymous';

export const createBookmark = (req, res) => {
  sendSuccess(res, bookmarkService.createBookmark(getUserId(req), req.body), 201);
};

export const getBookmarks = (req, res) => {
  sendSuccess(res, bookmarkService.getBookmarks(getUserId(req)));
};

export const deleteBookmark = (req, res) => {
  sendSuccess(res, bookmarkService.deleteBookmark(getUserId(req), req.params.id));
};

export const searchBookmarks = (req, res) => {
  sendSuccess(res, bookmarkService.searchBookmarks(getUserId(req), req.query.q || ''));
};

export const getRecentBookmarks = (req, res) => {
  sendSuccess(res, bookmarkService.getRecentBookmarks(getUserId(req)));
};

export const createFolder = (req, res) => {
  sendSuccess(res, bookmarkService.createFolder(getUserId(req), req.body.name), 201);
};

export const getFolders = (req, res) => {
  sendSuccess(res, bookmarkService.getFolders(getUserId(req)));
};

export const updateFolder = (req, res) => {
  sendSuccess(res, bookmarkService.updateFolder(getUserId(req), req.params.id, req.body.name));
};

export const deleteFolder = (req, res) => {
  sendSuccess(res, bookmarkService.deleteFolder(getUserId(req), req.params.id));
};

export const shareCollection = (req, res) => {
  sendSuccess(res, bookmarkService.shareCollection(getUserId(req), req.params.id));
};

export const syncBookmarks = (req, res) => {
  sendSuccess(res, bookmarkService.syncBookmarks(getUserId(req)));
};

export const exportBookmarks = (req, res) => {
  sendSuccess(res, bookmarkService.exportBookmarks(getUserId(req)));
};

export const getBookmarkAnalytics = (req, res) => {
  sendSuccess(res, bookmarkService.getBookmarkAnalytics(getUserId(req)));
};
