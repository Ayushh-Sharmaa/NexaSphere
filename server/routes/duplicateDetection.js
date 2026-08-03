const express = require('express');
const router = express.Router();

const controller = require('../controllers/duplicateDetectionController');

router.get('/overview', controller.getOverview);

router.post('/check', controller.checkRecord);

router.get('/events', controller.getDuplicateEvents);

router.get('/media', controller.getDuplicateMedia);

router.get('/portfolios', controller.getPortfolioDuplicates);

router.get('/clubs', controller.getClubDuplicates);

router.post('/merge', controller.mergeDuplicates);

router.delete('/:id', controller.deleteDuplicate);

router.get('/stats', controller.getStatistics);

module.exports = router;
