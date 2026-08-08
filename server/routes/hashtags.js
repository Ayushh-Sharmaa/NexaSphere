import express from 'express';
import { getTrending, followHashtag, unfollowHashtag, getFollowing } from '../controllers/hashtagController.js';
import { requireStudentAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/trending', getTrending);
router.get('/following', requireStudentAuth, getFollowing);
router.post('/:tag/follow', requireStudentAuth, followHashtag);
router.delete('/:tag/follow', requireStudentAuth, unfollowHashtag);

export default router;

