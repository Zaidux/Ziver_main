const asyncHandler = require('express-async-handler');
const db = require('../../config/db');
const LanguageUtils = require('../../utils/language');

const appearanceController = {
  // Update theme preference with enhanced validation
  updateTheme: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { theme } = req.body;

    const validThemes = ['light', 'dark', 'auto', 'system'];
    
    if (!theme || !validThemes.includes(theme)) {
      res.status(400);
      throw new Error(`Invalid theme selection. Must be one of: ${validThemes.join(', ')}`);
    }

    // Store in user_preferences table with transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES ($1, 'theme', $2)
        ON CONFLICT (user_id, preference_key) 
        DO UPDATE SET preference_value = $2, updated_at = NOW()
        RETURNING preference_value, updated_at
      `;

      const { rows } = await client.query(query, [userId, theme]);

      // Also update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Theme preference updated successfully',
        theme: rows[0].preference_value,
        updated_at: rows[0].updated_at,
        available_themes: validThemes
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Update language preference with enhanced validation
  updateLanguage: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { language } = req.body;

    if (!language || !LanguageUtils.isValidLanguage(language)) {
      const supportedLanguages = Object.keys(LanguageUtils.getSupportedLanguages());
      res.status(400);
      throw new Error(`Unsupported language. Supported languages: ${supportedLanguages.join(', ')}`);
    }

    const languageInfo = LanguageUtils.getLanguageInfo(language);

    // Store in user_preferences table with transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES ($1, 'language', $2)
        ON CONFLICT (user_id, preference_key) 
        DO UPDATE SET preference_value = $2, updated_at = NOW()
        RETURNING preference_value, updated_at
      `;

      const { rows } = await client.query(query, [userId, language]);

      // Also update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Language preference updated to ${languageInfo.name}`,
        language: rows[0].preference_value,
        language_info: languageInfo,
        updated_at: rows[0].updated_at,
        is_rtl: languageInfo.rtl
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Update multiple appearance settings at once
  updateAppearanceSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { theme, language, fontSize, reducedMotion, highContrast } = req.body;

    const updates = [];
    
    if (theme) {
      const validThemes = ['light', 'dark', 'auto', 'system'];
      if (!validThemes.includes(theme)) {
        res.status(400);
        throw new Error(`Invalid theme. Must be one of: ${validThemes.join(', ')}`);
      }
      updates.push({ key: 'theme', value: theme });
    }

    if (language) {
      if (!LanguageUtils.isValidLanguage(language)) {
        const supportedLanguages = Object.keys(LanguageUtils.getSupportedLanguages());
        res.status(400);
        throw new Error(`Unsupported language. Supported: ${supportedLanguages.join(', ')}`);
      }
      updates.push({ key: 'language', value: language });
    }

    if (fontSize) {
      const validSizes = ['small', 'normal', 'large', 'x-large'];
      if (!validSizes.includes(fontSize)) {
        res.status(400);
        throw new Error(`Invalid font size. Must be one of: ${validSizes.join(', ')}`);
      }
      updates.push({ key: 'font_size', value: fontSize });
    }

    if (reducedMotion !== undefined) {
      updates.push({ key: 'reduced_motion', value: reducedMotion.toString() });
    }

    if (highContrast !== undefined) {
      updates.push({ key: 'high_contrast', value: highContrast.toString() });
    }

    if (updates.length === 0) {
      res.status(400);
      throw new Error('No valid appearance settings provided for update');
    }

    // Use transaction for multiple updates
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const update of updates) {
        const query = `
          INSERT INTO user_preferences (user_id, preference_key, preference_value) 
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, preference_key) 
          DO UPDATE SET preference_value = $3, updated_at = NOW()
        `;
        await client.query(query, [userId, update.key, update.value]);
      }

      // Update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Appearance settings updated successfully',
        updated_settings: updates.map(u => u.key),
        updated_count: updates.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Get all appearance settings with enhanced information
  getAppearanceSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
      SELECT preference_key, preference_value, updated_at
      FROM user_preferences 
      WHERE user_id = $1 AND preference_key IN (
        'theme', 'language', 'font_size', 'reduced_motion', 'high_contrast'
      )
    `;

    const { rows } = await db.query(query, [userId]);

    // Convert to object with intelligent defaults
    const settings = rows.reduce((acc, row) => {
      acc[row.preference_key] = {
        value: row.preference_value,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    // Set defaults for missing values
    const defaultSettings = {
      theme: { value: 'dark', updated_at: null },
      language: { value: 'en', updated_at: null },
      font_size: { value: 'normal', updated_at: null },
      reduced_motion: { value: 'false', updated_at: null },
      high_contrast: { value: 'false', updated_at: null }
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Get language information
    const languageInfo = LanguageUtils.getLanguageInfo(finalSettings.language.value);

    // Get available options
    const availableOptions = {
      themes: ['light', 'dark', 'auto', 'system'],
      languages: LanguageUtils.getSupportedLanguages(),
      font_sizes: ['small', 'normal', 'large', 'x-large'],
      accessibility: ['reduced_motion', 'high_contrast']
    };

    res.json({
      success: true,
      settings: finalSettings,
      current_language: languageInfo,
      available_options: availableOptions,
      is_rtl: languageInfo.rtl
    });
  }),

  // Reset appearance settings to defaults
  resetAppearanceSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Delete all appearance-related preferences
      await client.query(`
        DELETE FROM user_preferences 
        WHERE user_id = $1 AND preference_key IN (
          'theme', 'language', 'font_size', 'reduced_motion', 'high_contrast'
        )
      `, [userId]);

      // Update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Appearance settings reset to defaults',
        reset_settings: ['theme', 'language', 'font_size', 'reduced_motion', 'high_contrast'],
        default_values: {
          theme: 'dark',
          language: 'en',
          font_size: 'normal',
          reduced_motion: false,
          high_contrast: false
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
};

module.exports = appearanceController;