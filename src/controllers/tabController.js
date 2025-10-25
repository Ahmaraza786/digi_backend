const { Tab } = require('../models');

// Get all tabs/features
const getAllTabs = async (req, res) => {
  try {
    const tabs = await Tab.findAll({
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const formattedTabs = tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      displayName: tab.display_name,
      description: tab.description,
      createdAt: tab.created_at
    }));

    res.json({
      success: true,
      data: formattedTabs,
      message: 'Tabs retrieved successfully'
    });
  } catch (error) {
    console.error('Get all tabs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllTabs
};
