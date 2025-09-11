// Helper function to generate a JWT (UPDATED)
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role // Include role in token payload
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// In the login function, update the response:
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const client = await db.getClient();

  try {
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const settingsResult = await client.query('SELECT * FROM app_settings');
      const appSettings = settingsResult.rows.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      // Create user response data with role included
      const userResponseData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // This is CRUCIAL for admin check
        zp_balance: user.zp_balance,
        social_capital_score: user.social_capital_score
      };

      res.json({
        user: userResponseData,
        token: generateToken(user), // Pass user object (not just id)
        appSettings,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } finally {
    client.release();
  }
});