const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

const appearanceController = {
  // Update theme preference
  updateTheme: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { theme } = req.body;

    if (!['light', 'dark', 'auto'].includes(theme)) {
      res.status(400);
      throw new Error('Invalid theme selection');
    }

    // Store in user_preferences table
    const query = `
      INSERT INTO user_preferences (user_id, preference_key, preference_value) 
      VALUES ($1, 'theme', $2)
      ON CONFLICT (user_id, preference_key) 
      DO UPDATE SET preference_value = $2, updated_at = NOW()
      RETURNING preference_value
    `;
    
    const { rows } = await db.query(query, [userId, theme]);

    res.json({
      success: true,
      message: 'Theme updated successfully',
      theme: rows[0].preference_value
    });
  }),

  // Update language preference
  updateLanguage: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { language } = req.body;

    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh'];
    if (!supportedLanguages.includes(language)) {
      res.status(400);
      throw new Error('Unsupported language');
    }

    const query = `
      INSERT INTO user_preferences (user_id, preference_key, preference_value) 
      VALUES ($1, 'language', $2)
      ON CONFLICT (user_id, preference_key) 
      DO UPDATE SET preference_value = $2, updated_at = NOW()
      RETURNING preference_value
    `;
    
    const { rows } = await db.query(query, [userId, language]);

    res.json({
      success: true,
      message: 'Language updated successfully',
      language: rows[0].preference_value
    });
  }),

  // Get all appearance settings
  getAppearanceSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = $1 AND preference_key IN ('theme', 'language')
    `;
    
    const { rows } = await db.query(query, [userId]);

    // Convert to object with defaults
    const settings = rows.reduce((acc, row) => {
      acc[row.preference_key] = row.preference_value;
      return acc;
    }, { 
      theme: 'dark', // Default theme
      language: 'en' // Default language
    });

    res.json({
      success: true,
      settings
    });
  })
};

module.exports = appearanceController;