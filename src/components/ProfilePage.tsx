import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const ProfilePage: React.FC = () => {
  const { setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  return null;
};
