import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';

const threatData = [
  { name: '00:00', threats: 4, alerts: 2 },
  { name: '04:00', threats: 7, alerts: 3 },
  { name: '08:00', threats: 15, alerts: 8 },
  { name: '12:00', threats: 25, alerts: 12 },
  { name: '16:00', threats: 18, alerts: 7 },
  { name: '20:00', threats: 9, alerts: 4 },
  { name: '24:00', threats: 5, alerts: 1 },
];

const severityData = [
  { name: 'Critical', value: 12 },
  { name: 'High', value: 34 },
  { name: 'Medium', value: 156 },
  { name: 'Low', value: 430 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Security Analytics</h1>
          <p className="text-sm text-secondary-text mt-1">Visualize threat patterns and system telemetry.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Threat Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={threatData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#667085" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#667085" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="threats" stroke="#2563EB" fillOpacity={1} fill="url(#colorThreats)" />
                  <Area type="monotone" dataKey="alerts" stroke="#DC2626" fillOpacity={1} fill="url(#colorAlerts)" />
                  
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#667085" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#667085" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
