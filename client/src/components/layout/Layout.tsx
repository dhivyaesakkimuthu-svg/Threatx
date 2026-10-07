import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen relative data-stream-bg overflow-x-hidden flex">
      <div className="scanline-overlay" />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        style={{ marginLeft: `${sidebarWidth}px` }}
        className="transition-[margin] duration-300 ease-out flex-1 min-w-0 min-h-screen pl-6 lg:pl-8 pr-6 lg:pr-8 py-6 lg:py-8"
      >
        <div className="animate-fade-in max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
