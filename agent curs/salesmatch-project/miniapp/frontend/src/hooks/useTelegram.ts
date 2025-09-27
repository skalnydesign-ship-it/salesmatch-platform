import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/sdk';
import { TelegramUser } from '../types';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      setInitData(tg.initData || '');
      
      // Configure WebApp
      tg.ready();
      tg.expand();
      
      // Enable closing confirmation
      tg.enableClosingConfirmation();
      
      // Set theme
      tg.setHeaderColor('#2481cc');
      tg.setBackgroundColor('#ffffff');
      
      setIsReady(true);
    } else {
      // Fallback for development
      console.warn('Telegram WebApp not available, using mock data');
      setUser({
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en',
      });
      setInitData('mock_init_data');
      setIsReady(true);
    }
  }, []);

  const showAlert = (message: string) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message: string): Promise<boolean> => {
    if (webApp) {
      return new Promise((resolve) => {
        webApp.showConfirm(message, (confirmed) => {
          resolve(confirmed);
        });
      });
    } else {
      return Promise.resolve(confirm(message));
    }
  };

  const showPopup = (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }) => {
    if (webApp) {
      webApp.showPopup(params);
    } else {
      alert(params.message);
    }
  };

  const hapticFeedback = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(type);
    }
  };

  const openLink = (url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp) {
      webApp.openLink(url, options);
    } else {
      window.open(url, '_blank');
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    } else {
      console.log('WebApp close requested');
    }
  };

  const requestContact = (): Promise<{ contact?: any }> => {
    if (webApp) {
      return new Promise((resolve) => {
        webApp.requestContact((contact) => {
          resolve({ contact });
        });
      });
    } else {
      return Promise.resolve({});
    }
  };

  const requestLocation = (): Promise<{ location?: any }> => {
    if (webApp) {
      return new Promise((resolve) => {
        webApp.requestLocation((location) => {
          resolve({ location });
        });
      });
    } else {
      return Promise.resolve({});
    }
  };

  return {
    webApp,
    user,
    initData,
    isReady,
    showAlert,
    showConfirm,
    showPopup,
    hapticFeedback,
    openLink,
    close,
    requestContact,
    requestLocation,
  };
};


