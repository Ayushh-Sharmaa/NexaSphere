import logger from '../utils/logger.js';
/**
 * server/services/aiTagging.js
 * AI-powered face detection, object recognition, auto-categorisation,
 * content moderation — backed by AWS Rekognition (swap for Google Vision via adapter)
 */
const AWS = require('aws-sdk');
const db = require('../db');

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'us-east-1',
});

// ── Category mappings ─────────────────────────────────────────────────────────
const CATEGORY_RULES = {
  'Group photos': ['Group', 'People', 'Crowd', 'Audience'],
  'Individual photos': ['Person', 'Face', 'Portrait', 'Selfie'],
  'Venue shots': ['Building', 'Architecture', 'Room', 'Stage', 'Hall', 'Auditorium'],
  Food: ['Food', 'Drink', 'Meal', 'Beverage', 'Cuisine', 'Restaurant'],
  Presentations: [
    'Presentation',
    'Screen',
    'Projector',
    'Whiteboard',
    'Slide',
    'Speaker',
    'Podium',
  ],
};

/**
 * analyzePhoto — face detection + object recognition + auto-categorisation
 * @param {string} photoId
 * @param {Buffer} imageBuffer
 * @returns {Promise<string[]>} array of tag strings
 */
async function analyzePhoto(photoId, imageBuffer) {
  const imageBytes = { Bytes: imageBuffer };
  const tags = new Set();

  // ── 1. Label detection (objects, scenes, activities) ──────────────────────
  const labelRes = await rekognition
    .detectLabels({
      Image: imageBytes,
      MaxLabels: 20,
      MinConfidence: 70,
    })
    .promise();

  const detectedLabels = labelRes.Labels.map((l) => l.Name);
  detectedLabels.forEach((label) => tags.add(label));

  // ── 2. Auto-categorisation ─────────────────────────────────────────────────
  const categories = [];
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((kw) => detectedLabels.includes(kw))) {
      categories.push(category);
    }
  }

  // ── 3. Face detection + user matching ─────────────────────────────────────
  const faceRes = await rekognition
    .detectFaces({
      Image: imageBytes,
      Attributes: ['DEFAULT'],
    })
    .promise();

  const faceCount = faceRes.FaceDetails.length;
  if (faceCount > 0) tags.add(`${faceCount} ${faceCount === 1 ? 'person' : 'people'}`);

  // Try to match faces against the registered attendee face index
  if (faceCount > 0 && process.env.REKOGNITION_COLLECTION_ID) {
    try {
      const searchRes = await rekognition
        .searchFacesByImage({
          CollectionId: process.env.REKOGNITION_COLLECTION_ID,
          Image: imageBytes,
          MaxFaces: 5,
          FaceMatchThreshold: 85,
        })
        .promise();

      const matchedUserIds = searchRes.FaceMatches.map((m) => m.Face.ExternalImageId);
      if (matchedUserIds.length > 0) {
        // Store AI-suggested person tags for organizer review
        await db.photos.addAiSuggestedTags(photoId, matchedUserIds);
      }
    } catch (err) {
      // SearchFacesByImage fails if collection is empty — not fatal
      logger.warn('Face search skipped: {err}', { err: err.message });
    }
  }

  // ── 4. Persist categories to photo record ──────────────────────────────────
  if (categories.length > 0) {
    await db.photos.update(photoId, { categories });
  }

  return [...tags];
}

/**
 * moderateContent — detect inappropriate images
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ rejected: boolean, reason?: string }>}
 */
async function moderateContent(imageBuffer) {
  const res = await rekognition
    .detectModerationLabels({
      Image: { Bytes: imageBuffer },
      MinConfidence: 75,
    })
    .promise();

  const BLOCK_CATEGORIES = [
    'Explicit Nudity',
    'Nudity',
    'Graphic Violence',
    'Violence',
    'Visually Disturbing',
    'Hate Symbols',
  ];

  const flagged = res.ModerationLabels.find((l) =>
    BLOCK_CATEGORIES.some((cat) => l.Name.includes(cat) || l.ParentName?.includes(cat))
  );

  if (flagged) {
    return { rejected: true, reason: flagged.Name };
  }

  return { rejected: false };
}

/**
 * indexFaceForUser — register a user's face in the Rekognition collection
 * so future uploads can suggest tagging them
 * @param {string} userId
 * @param {Buffer} imageBuffer
 */
async function indexFaceForUser(userId, imageBuffer) {
  if (!process.env.REKOGNITION_COLLECTION_ID) return;

  await rekognition
    .indexFaces({
      CollectionId: process.env.REKOGNITION_COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: userId,
      MaxFaces: 1,
      QualityFilter: 'AUTO',
      DetectionAttributes: [],
    })
    .promise();
}

module.exports = { analyzePhoto, moderateContent, indexFaceForUser };
