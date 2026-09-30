import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  ShieldAlert, 
  Server, 
  UsersRound, 
  BarChart3, 
  BrainCircuit, 
  FileText, 
  ClipboardList, 
  UserRoundCog, 
  Settings 
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Threats', to: '/threats', icon: ShieldAlert },
  { name: 'Servers', to: '/servers', icon: Server },
  { name: 'Sessions', to: '/sessions', icon: UsersRound },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Intelligence', to: '/intelligence', icon: BrainCircuit },
  { name: 'Reports', to: '/reports', icon: FileText },
  { name: 'Audit Logs', to: '/audit-logs', icon: ClipboardList },
  { name: 'Users', to: '/users', icon: UserRoundCog },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-primary-dark text-gray-300 flex flex-col h-full flex-shrink-0 border-r border-gray-800">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-primary-darker">
        <Shield className="h-6 w-6 text-brand-cyan mr-2" />
        <span className="font-bold text-white text-lg tracking-wider">THREATX</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) => cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors",
                isActive 
                  ? "bg-brand-blue/10 text-brand-cyan border border-brand-blue/20" 
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0")} aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="bg-primary-darker rounded-xl p-4 flex flex-col items-center text-center border border-gray-800">
          <BrainCircuit className="h-6 w-6 text-brand-teal mb-2" />
          <p className="text-xs text-gray-400 mb-2 font-medium">AI Engine Active</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-900/20 text-status-success border border-status-success/30">
            SYSTEM NORMAL
          </span>
        </div>
      </div>
    </div>
  );
}
