import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen relative data-stream-bg overflow-x-hidden">
      <div className="scanline-overlay" />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        style={{ marginLeft: `${sidebarWidth}px` }}
        className="transition-[margin] duration-300 ease-out p-6 md:p-8 min-h-screen min-w-0"
      >
        <div className="animate-fade-in max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
