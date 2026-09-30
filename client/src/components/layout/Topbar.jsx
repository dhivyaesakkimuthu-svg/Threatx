import React from 'react';
import { Search, Bell, UserRound, ChevronDown, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 relative z-10">
      
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search threats, IP addresses, servers..."
            className="block w-full pl-10 pr-3 py-1.5 border border-border rounded-lg text-sm text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-shadow bg-gray-50"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 mr-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success"></span>
          </span>
          <span className="text-xs font-medium text-secondary-text">SOC Online</span>
        </div>
        
        <button className="text-gray-400 hover:text-primary-dark transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="h-6 w-px bg-border mx-2"></div>

        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-primary-dark leading-tight group-hover:text-brand-blue transition-colors">Admin User</span>
            <span className="text-[10px] text-secondary-text font-medium uppercase">Lead Analyst</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-primary-dark transition-colors hidden md:block" />
        </div>

        <Link to="/" className="text-gray-400 hover:text-status-danger transition-colors ml-2" title="Logout">
          <LogOut className="h-5 w-5" />
        </Link>
      </div>

    </header>
  );
}
