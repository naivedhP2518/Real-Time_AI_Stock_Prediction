const express = require('express');
const router = express.Router();
const { 
  getAvailableModelsList,
  getModelsPerformanceMetrics,
  getSpecificModelPrediction,
  getEnsemblePredictionConsensus
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

// Secure all endpoints with token protection
router.use(protect);

router.get('/models', getAvailableModelsList);
router.get('/model-performance', getModelsPerformanceMetrics);
router.post('/predict/:model', getSpecificModelPrediction);
router.post('/ensemble-predict', getEnsemblePredictionConsensus);

module.exports = router;
