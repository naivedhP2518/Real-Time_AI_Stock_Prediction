const Alert = require('../models/Alert');

/**
 * @desc    Create a custom price alert trigger
 * @route   POST /api/alerts
 * @access  Private
 */
const createAlert = async (req, res) => {
  try {
    const { symbol, targetPrice, type } = req.body;
    
    if (!symbol || !targetPrice || !type) {
      return res.status(400).json({ message: 'Stock symbol, target price, and trigger type are required' });
    }
    
    const target = parseFloat(targetPrice);
    const triggerType = type.toUpperCase().trim();
    
    if (target <= 0) {
      return res.status(400).json({ message: 'Target price must be greater than zero' });
    }
    
    if (triggerType !== 'ABOVE' && triggerType !== 'BELOW') {
      return res.status(400).json({ message: 'Trigger type must be ABOVE or BELOW' });
    }
    
    const sym = symbol.toUpperCase().trim();
    
    const alert = await Alert.create({
      user: req.user._id,
      symbol: sym,
      targetPrice: target,
      type: triggerType,
      isActive: true
    });
    
    console.log(`[Alert System] User ${req.user.name} established alert for ${sym} at $${target} (${triggerType})`);
    
    return res.status(201).json(alert);
    
  } catch (error) {
    console.error('Create Alert Core Error:', error.message);
    return res.status(500).json({ message: 'Error establishing price alert' });
  }
};

/**
 * @desc    Get all active alerts for current user
 * @route   GET /api/alerts
 * @access  Private
 */
const getUserAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(alerts);
  } catch (error) {
    console.error('Get User Alerts Core Error:', error.message);
    return res.status(500).json({ message: 'Error retrieving user alerts' });
  }
};

/**
 * @desc    Delete a specific price alert trigger
 * @route   DELETE /api/alerts/:id
 * @access  Private
 */
const deleteAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const alert = await Alert.findOne({ _id: alertId, user: req.user._id });
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert configuration not found or unauthorized' });
    }
    
    await Alert.deleteOne({ _id: alertId });
    console.log(`[Alert System] Deleted price alert with ID: ${alertId}`);
    
    return res.json({ message: 'Alert trigger deleted successfully' });
    
  } catch (error) {
    console.error('Delete Alert Core Error:', error.message);
    return res.status(500).json({ message: 'Error deleting price alert' });
  }
};

module.exports = {
  createAlert,
  getUserAlerts,
  deleteAlert
};
