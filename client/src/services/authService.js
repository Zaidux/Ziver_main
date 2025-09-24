import api from './api';

// Register user with enhanced referral support
const register = async (username, email, password, referralCode = null) => {
  try {
    // Get Telegram user info if available
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id;

    // Prepare registration data
    const registrationData = {
      username,
      email,
      password,
      referralCode,
      ...(telegramId && { telegramId })
    };

    console.log('Registering user with data:', { 
      username, 
      email, 
      hasReferralCode: !!referralCode,
      hasTelegramId: !!telegramId 
    });

    const response = await api.post('/auth/register', registrationData);
    
    // Clear referral code from storage after successful registration
    if (referralCode) {
      localStorage.removeItem('ziver_referral_code');
      sessionStorage.removeItem('referralCode');
    }

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    
    // Enhanced error handling
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.response) {
      const { data, status } = error.response;
      
      if (status === 400) {
        errorMessage = data.message || 'Invalid registration data.';
      } else if (status === 409) {
        errorMessage = data.message || 'User already exists with this email or username.';
      } else if (status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = data.message || errorMessage;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Login user
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Logout user
const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// Validate referral code
const validateReferralCode = async (referralCode) => {
  try {
    const response = await api.get(`/auth/referrer-info/${referralCode}`);
    return response.data;
  } catch (error) {
    console.error('Error validating referral code:', error);
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  validateReferralCode
};

export default authService;