import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#1A1D26] flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 min-h-screen ${
          collapsed ? 'ml-[84px]' : 'ml-[280px]'
        }`}
      >
        <div className="animate-fade-in max-w-[1720px] mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
