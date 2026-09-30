import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Menu } from 'lucide-react';
import { Button } from '../common/Button';

export default function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-brand-blue" />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">THREATX</span>
              <span className="text-[10px] text-secondary-text font-medium uppercase tracking-wider">Security Operations Center</span>
            </div>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <Link to="#platform" className="text-sm font-medium text-secondary-text hover:text-primary-dark transition-colors">Platform</Link>
            <Link to="#capabilities" className="text-sm font-medium text-secondary-text hover:text-primary-dark transition-colors">Capabilities</Link>
            <Link to="#intelligence" className="text-sm font-medium text-secondary-text hover:text-primary-dark transition-colors">Intelligence</Link>
            <Link to="#monitoring" className="text-sm font-medium text-secondary-text hover:text-primary-dark transition-colors">Monitoring</Link>
            <Link to="#about" className="text-sm font-medium text-secondary-text hover:text-primary-dark transition-colors">About</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-primary-dark hover:text-brand-blue transition-colors">
              Sign In
            </Link>
            <Link to="/login">
              <Button icon={ArrowRight} iconPosition="right">
                Enter SOC Console
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button className="text-primary-dark">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
