import React from 'react';
import { Card } from '@/components/ui/card';
import ThemeToggle from '@/components/ui/ThemeToggle';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Theme</h2>
              <p className="text-sm text-muted-foreground">Manually toggle between light and dark.</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2">About Hikmah AI</h2>
          <p className="text-sm text-muted-foreground mb-1">Minimal Islamic learning assistant.</p>
          <p className="text-sm text-muted-foreground">Styled with shadcn and an emerald aesthetic.</p>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;


