import { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import PlayersView from '@/components/PlayersView';
import CaptainView from '@/components/CaptainView';
import AdminView from '@/components/AdminView';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'players':
        return <PlayersView />;
      case 'captain':
        return <CaptainView />;
      case 'admin':
        return <AdminView />;
      case 'profile':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-poppins font-bold mb-4">Profile Coming Soon</h2>
            <p className="text-muted-foreground">User profile and settings will be available here.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveView()}
    </Layout>
  );
};

export default Index;
