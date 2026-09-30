import React, { useState } from 'react';
import { Save, Shield, Bell, HardDrive, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account');
  
  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">Company Name</label>
                <input type="text" defaultValue="ThreatX Demo Corp" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-brand-blue focus:border-brand-blue outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">Contact Email</label>
                <input type="email" defaultValue="admin@threatx.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-brand-blue focus:border-brand-blue outline-none" />
              </div>
            </CardContent>
          </Card>
        );
      case 'Security':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>Manage password policies and MFA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-primary-dark">Require MFA</h4>
                  <p className="text-xs text-secondary-text">Enforce multi-factor authentication for all users.</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-primary-dark">Session Timeout</h4>
                  <p className="text-xs text-secondary-text">Automatically log out idle users.</p>
                </div>
                <select className="border border-border rounded-lg px-3 py-1 text-sm outline-none">
                  <option>15 Minutes</option>
                  <option>30 Minutes</option>
                  <option>1 Hour</option>
                </select>
              </div>
            </CardContent>
          </Card>
        );
      case 'Notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how alerts are delivered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-primary-dark">Email Alerts</h4>
                  <p className="text-xs text-secondary-text">Receive critical alerts via email.</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-brand-blue border-gray-300 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-primary-dark">Slack Integration</h4>
                  <p className="text-xs text-secondary-text">Push alerts to Slack channels.</p>
                </div>
                <Button variant="outline" size="sm">Connect Slack</Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{activeTab} Settings</CardTitle>
              <CardDescription>Configuration options for {activeTab.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-text">Settings for this section are under construction.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Platform Settings</h1>
          <p className="text-sm text-secondary-text mt-1">Configure global SOC preferences.</p>
        </div>
        <Button variant="primary" icon={Save} onClick={handleSave}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <nav className="flex flex-col space-y-1">
            {['Account', 'Security', 'Notifications', 'System', 'Appearance'].map((item) => (
              <button 
                key={item} 
                onClick={() => setActiveTab(item)}
                className={`px-4 py-2 text-sm font-medium text-left rounded-xl transition-colors ${
                  activeTab === item 
                    ? 'bg-white shadow-sm text-brand-blue border border-border' 
                    : 'text-secondary-text hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
