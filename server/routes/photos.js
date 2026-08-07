/**
 * server/routes/photos.js
 * Photo upload, listing, likes, comments, tagging endpoints
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiTaggingService = require('../services/aiTagging');
const imageService = require('../services/imageProcessing');
const db = require('../db');
const { sendSuccess, sendError, sendNoContent } = require('../utils/responseHelper.js');

// ── Multer config (memory storage → hand off to imageService) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.heic')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  },
});

// ── POST /api/photos/upload ───────────────────────────────────────────────────
router.post('/upload', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { eventId, albumId } = req.body;
    if (!eventId) return sendError(req, res, 'eventId is required', 400, 'VALIDATION_ERROR');

    // 1. Process image: compress, resize, convert to WebP, generate thumbnails
    const processed = await imageService.processUpload(req.file.buffer, req.file.originalname);

    // 2. Extract EXIF data
    const exif = await imageService.extractExif(req.file.buffer);

    // 3. Content moderation — reject inappropriate images before storing
    const moderation = await aiTaggingService.moderateContent(processed.largeBuffer);
    if (moderation.rejected) {
      return sendError(
        req,
        res,
        'Image rejected by content moderation',
        422,
        'VALIDATION_ERROR',
        moderation.reason
      );
    }

    // 4. AI tagging — run async; don't block response
    const photoRecord = await db.photos.create({
      eventId,
      albumId: albumId || null,
      uploaderId: req.user.id,
      smallUrl: processed.smallUrl,
      mediumUrl: processed.mediumUrl,
      largeUrl: processed.largeUrl,
      originalUrl: processed.originalUrl,
      thumbnailUrl: processed.smallUrl,
      exif,
      dateTaken: exif?.dateTaken || new Date().toISOString(),
      photographer: req.user.name,
      aiTags: [],
      tags: [],
      likes: 0,
      views: 0,
    });

    // Fire-and-forget AI analysis
    aiTaggingService
      .analyzePhoto(photoRecord.id, processed.largeBuffer)
      .then((tags) => db.photos.update(photoRecord.id, { aiTags: tags }))
      .catch((err) => console.error('AI tagging failed for photo', photoRecord.id, err));

    sendSuccess(res, photoRecord, 201);
  } catch (err) {
    console.error('Upload error:', err);
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── GET /api/photos ───────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { eventId, page = 1, limit = 30, sort = 'newest', album, date, photographer } = req.query;
    if (!eventId) return sendError(req, res, 'eventId is required', 400, 'VALIDATION_ERROR');

    const { photos, hasMore } = await db.photos.list({
      eventId,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      filters: { album, date, photographer },
      userId: req.user.id, // for likedByMe flag
    });

    sendSuccess(res, { photos, hasMore });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── GET /api/photos/:id ───────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const photo = await db.photos.findById(req.params.id, req.user.id);
    if (!photo) return sendError(req, res, 'Photo not found', 404, 'NOT_FOUND');

    // Increment view count asynchronously
    db.photos.incrementViews(req.params.id).catch(console.error);

    sendSuccess(res, photo);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── POST /api/photos/:id/like ─────────────────────────────────────────────────
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    await db.photos.like(req.params.id, req.user.id);
    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── DELETE /api/photos/:id/like ───────────────────────────────────────────────
router.delete('/:id/like', authenticate, async (req, res) => {
  try {
    await db.photos.unlike(req.params.id, req.user.id);
    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── GET /api/photos/:id/comments ─────────────────────────────────────────────
router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const comments = await db.comments.forPhoto(req.params.id);
    sendSuccess(res, { comments });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── POST /api/photos/:id/comments ────────────────────────────────────────────
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return sendError(req, res, 'Comment text required', 400, 'VALIDATION_ERROR');

    const comment = await db.comments.create({
      photoId: req.params.id,
      authorId: req.user.id,
      authorName: req.user.name,
      text: text.trim(),
    });

    sendSuccess(res, comment, 201);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── POST /api/photos/:id/tags ─────────────────────────────────────────────────
router.post('/:id/tags', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return sendError(req, res, 'userId required', 400, 'VALIDATION_ERROR');

    await db.photos.tagUser(req.params.id, userId, req.user.id);

    // Notify tagged user
    await db.notifications.create({
      userId,
      type: 'photo_tag',
      message: `${req.user.name} tagged you in a photo`,
      data: { photoId: req.params.id },
    });

    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── DELETE /api/photos/:id/tags/:userId ───────────────────────────────────────
// Any user can remove their own tag; photo owner can remove any tag
router.delete('/:id/tags/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      const photo = await db.photos.findById(req.params.id);
      if (!photo || photo.uploaderId !== req.user.id) {
        return sendError(req, res, 'You can only remove your own tag', 403, 'FORBIDDEN');
      }
    }

    await db.photos.untagUser(req.params.id, userId);
    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── Error handler for multer ──────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(_req, res, 'File exceeds 10 MB limit', 413, 'PAYLOAD_TOO_LARGE');
  }
  sendError(_req, res, err.message, 400, 'VALIDATION_ERROR');
});

module.exports = router;
