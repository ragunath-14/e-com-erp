import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

import { API_URLS } from '../api/config';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    taxRate: 18,
    currency: 'INR',
    globalDiscount: { enabled: false, type: 'percentage', value: 0 }
  });

  const [loaded, setLoaded] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(API_URLS.SETTINGS);
      if (res.data) { setSettings(res.data); setLoaded(true); }
    } catch (err) { console.error('Failed to fetch settings:', err); }
  };

  // Browser tab / installed-app window title = the shop name from Settings.
  // Waits for the real settings so the placeholder default never flashes in.
  useEffect(() => {
    if (loaded && settings.shopName) document.title = settings.shopName;
  }, [loaded, settings.shopName]);

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
