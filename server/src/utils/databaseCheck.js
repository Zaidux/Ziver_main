const db = require('../config/db');

const checkDatabaseTables = async () => {
  const requiredTables = [
    'telegram_user_map',
    'telegram_notifications', 
    'telegram_announcements',
    'telegram_direct_messages',
    'users'
  ];

  console.log('🔍 Checking database tables...');

  for (const table of requiredTables) {
    try {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);

      if (!exists) {
        console.log(`   ⚠️  Table ${table} is missing - some features may not work`);
      }
    } catch (error) {
      console.error(`❌ Error checking table ${table}:`, error);
    }
  }
};

const checkTelegramBotConfig = () => {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  console.log(`${hasToken ? '✅' : '❌'} Telegram Bot Token: ${hasToken ? 'CONFIGURED' : 'MISSING'}`);
  
  if (!hasToken) {
    console.log('   ⚠️  Set TELEGRAM_BOT_TOKEN environment variable for Telegram features');
  }
  
  return hasToken;
};

module.exports = {
  checkDatabaseTables,
  checkTelegramBotConfig
};