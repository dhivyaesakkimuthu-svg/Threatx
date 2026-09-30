import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LockKeyhole, Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, perform auth here. For this demo, just navigate.
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-background items-center justify-center p-4">
      <Card className="w-full max-w-5xl flex flex-col md:flex-row overflow-hidden border-none shadow-xl rounded-2xl">
        
        {/* Left Panel - Dark Branding */}
        <div className="hidden md:flex md:w-1/2 bg-primary-dark text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-blue/10"></div>
          <div className="relative z-10 flex items-center space-x-3 mb-12">
            <Shield className="h-8 w-8 text-brand-blue" />
            <span className="font-bold text-2xl tracking-tight">THREATX</span>
          </div>
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-bold leading-tight">Secure your infrastructure. <br/> Defend in real-time.</h2>
            <p className="text-gray-400 text-lg">
              Access the Security Operations Center to monitor active threats, analyze risks, and manage your network health.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ThreatX Security.
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="md:hidden flex items-center space-x-2 mb-8">
            <Shield className="h-6 w-6 text-brand-blue" />
            <span className="font-bold text-xl text-primary-dark">THREATX</span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-primary-dark mb-2">Welcome Back</h3>
            <p className="text-secondary-text">Please sign in to access the SOC console.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary-dark">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-shadow" 
                  placeholder="analyst@threatx.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary-dark">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockKeyhole className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-border rounded-xl text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-shadow" 
                  placeholder="••••••••" 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-text">
                  Remember me
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" icon={LogIn} iconPosition="left">
              Login to SOC
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
