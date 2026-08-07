const express = require('express');
const router = express.Router();
const keyDistributionService = require('../services/keyDistributionService');

// Upload a user's public key
router.post('/upload', (req, res) => {
  const { userId, publicKey } = req.body;
  
  if (!userId || !publicKey) {
    return res.status(400).json({ success: false, message: 'Missing userId or publicKey' });
  }

  keyDistributionService.setPublicKey(userId, publicKey);
  res.json({ success: true, message: 'Public key uploaded successfully' });
});

// Retrieve a user's public key
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const publicKey = keyDistributionService.getPublicKey(userId);
  
  if (!publicKey) {
    return res.status(404).json({ success: false, message: 'Public key not found' });
  }

  res.json({ success: true, publicKey });
});

module.exports = router;
