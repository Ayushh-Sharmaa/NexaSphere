/**
 * server/routes/albums.js
 * Album CRUD, sub-albums, cover photo, collaborative uploads, featured photos
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');
const { sendSuccess, sendError, sendNoContent } = require('../utils/responseHelper');

// ── GET /api/albums?eventId=xxx ───────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return sendError(req, res, 'eventId required', 400, 'VALIDATION_ERROR');
    const albums = await db.albums.forEvent(eventId);
    sendSuccess(res, { albums });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── POST /api/albums ──────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId, name, description, parentAlbumId, isCollaborative } = req.body;
    if (!eventId || !name)
      return sendError(req, res, 'eventId and name required', 400, 'VALIDATION_ERROR');

    const album = await db.albums.create({
      eventId,
      name,
      description: description || '',
      parentAlbumId: parentAlbumId || null,
      isCollaborative: isCollaborative || false,
      createdById: req.user.id,
      coverPhotoId: null,
      photoCount: 0,
    });

    sendSuccess(res, album, 201);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── PATCH /api/albums/:id ─────────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const album = await db.albums.findById(req.params.id);
    if (!album) return sendError(req, res, 'Album not found', 404, 'NOT_FOUND');
    if (album.createdById !== req.user.id)
      return sendError(req, res, 'Forbidden', 403, 'FORBIDDEN');

    const { name, description, coverPhotoId } = req.body;
    const updated = await db.albums.update(req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(coverPhotoId && { coverPhotoId }),
    });

    sendSuccess(res, updated);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── DELETE /api/albums/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const album = await db.albums.findById(req.params.id);
    if (!album) return sendError(req, res, 'Album not found', 404, 'NOT_FOUND');
    if (album.createdById !== req.user.id)
      return sendError(req, res, 'Forbidden', 403, 'FORBIDDEN');

    await db.albums.delete(req.params.id);
    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ── POST /api/albums/:id/featured ─────────────────────────────────────────────
// Organizer can mark individual photos as "featured" in the album
router.post('/:id/featured', authenticate, async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) return sendError(req, res, 'photoId required', 400, 'VALIDATION_ERROR');

    await db.albums.featurePhoto(req.params.id, photoId, req.user.id);
    sendNoContent(res);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

module.exports = router;
