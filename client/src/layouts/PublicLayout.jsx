import React from 'react';
import { Outlet } from 'react-router-dom';
import LandingNavbar from '../components/layout/LandingNavbar';
import Footer from '../components/layout/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
