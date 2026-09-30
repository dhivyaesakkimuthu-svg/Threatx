import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.substring(1).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary-dark">{pageName}</h1>
        <p className="text-secondary-text">This page is currently under construction.</p>
      </div>
    </div>
  );
}
