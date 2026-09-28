import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033] flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={`flex-1 transition-all duration-300 p-5 md:p-8 min-h-screen ${
          collapsed ? 'ml-[76px]' : 'ml-[260px]'
        }`}
      >
        <div className="animate-fade-in max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
