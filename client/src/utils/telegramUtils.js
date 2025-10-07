// Enhanced Telegram utilities for client-side
export const isTelegramWebApp = () => {
  // Multiple detection methods for Telegram
  if (window.Telegram?.WebApp) {
    return true;
  }
  
  // Check for Telegram-specific URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('tgWebAppStartParam') || urlParams.has('startapp')) {
    return true;
  }
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('telegram')) {
    return true;
  }
  
  // Check referrer
  if (document.referrer.includes('t.me') || document.referrer.includes('telegram.org')) {
    return true;
  }
  
  return false;
};

// Initialize Telegram Web App if detected
export const initializeTelegramWebApp = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Expand the app to full height
    tg.expand();
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
    
    // Set theme params if available
    if (tg.themeParams) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a1a');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#00e676');
    }
    
    console.log('Telegram Web App initialized:', {
      platform: tg.platform,
      version: tg.version,
      user: tg.initDataUnsafe?.user
    });
    
    return tg;
  }
  return null;
};

// Get Telegram user info
export const getTelegramUser = () => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};

// Enhanced link task handling
export const openLinkTask = async (task, onComplete, onError) => {
  try {
    const { link_url, verification_required, id: taskId } = task;
    
    // Open the link in a new tab
    const newWindow = window.open(link_url, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      throw new Error('Please allow popups to complete this task.');
    }

    // For tasks requiring verification, use enhanced flow
    if (verification_required) {
      // Show a verification dialog with instructions
      const verificationDialog = createVerificationDialog(task, newWindow, onComplete, onError);
      document.body.appendChild(verificationDialog);
    } else {
      // For non-verified links, complete after a short delay
      setTimeout(() => {
        if (onComplete) onComplete(task);
      }, 2000);
    }

    return newWindow;
  } catch (error) {
    if (onError) onError(error.message);
    throw error;
  }
};

// Create a verification dialog for link tasks
const createVerificationDialog = (task, newWindow, onComplete, onError) => {
  const dialog = document.createElement('div');
  dialog.className = 'verification-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  const content = document.createElement('div');
  content.className = 'verification-content';
  content.style.cssText = `
    background: #1e1e1e;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #333;
    max-width: 400px;
    width: 90%;
    text-align: center;
    color: white;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Complete the Action';
  title.style.cssText = 'margin: 0 0 1rem 0; color: #00e676;';

  const instructions = document.createElement('p');
  instructions.textContent = `Please complete the required action in the new tab. Once done, return here and click "Verify Completion".`;
  instructions.style.cssText = 'margin: 0 0 1.5rem 0; color: #b0b0b0; line-height: 1.4;';

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 1rem; justify-content: center;';

  const verifyButton = document.createElement('button');
  verifyButton.textContent = '✅ Verify Completion';
  verifyButton.style.cssText = `
    background: #00e676;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s ease;
  `;

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    background: #666;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s ease;
  `;

  verifyButton.onmouseenter = () => verifyButton.style.background = '#00c853';
  verifyButton.onmouseleave = () => verifyButton.style.background = '#00e676';
  cancelButton.onmouseenter = () => cancelButton.style.background = '#555';
  cancelButton.onmouseleave = () => cancelButton.style.background = '#666';

  verifyButton.onclick = async () => {
    try {
      // Close the dialog
      document.body.removeChild(dialog);
      
      // Close the external window
      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }
      
      // Call the completion callback
      if (onComplete) {
        await onComplete(task);
      }
    } catch (error) {
      if (onError) onError(error.message);
    }
  };

  cancelButton.onclick = () => {
    // Close the dialog and external window
    document.body.removeChild(dialog);
    if (newWindow && !newWindow.closed) {
      newWindow.close();
    }
  };

  buttonContainer.appendChild(verifyButton);
  buttonContainer.appendChild(cancelButton);

  content.appendChild(title);
  content.appendChild(instructions);
  content.appendChild(buttonContainer);
  dialog.appendChild(content);

  return dialog;
};

// Check if user has Telegram connected
export const checkTelegramConnection = async () => {
  try {
    const response = await fetch('/api/tasks/telegram-status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { hasTelegram: false };
  } catch (error) {
    console.error('Error checking Telegram connection:', error);
    return { hasTelegram: false };
  }
};

// Get Telegram connection instructions
export const getTelegramConnectionInstructions = () => {
  return {
    title: 'Connect Telegram Account',
    steps: [
      'Open our Telegram bot: @Zivurlbot',
      'Send the /connect command',
      'Get your connection code',
      'Enter the code in your Ziver app settings'
    ],
    botUsername: 'Zivurlbot'
  };
};