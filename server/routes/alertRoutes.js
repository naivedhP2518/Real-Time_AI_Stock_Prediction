const express = require('express');
const router = express.Router();
const { 
  createAlert, 
  getUserAlerts, 
  deleteAlert 
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// Secure all alert endpoints
router.use(protect);

router.get('/', getUserAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
