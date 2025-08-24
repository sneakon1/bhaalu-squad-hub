import { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import PlayersView from '@/components/PlayersView';
import CaptainView from '@/components/CaptainView';
import AdminView from '@/components/AdminView';
import ProfileView from '@/components/ProfileView';

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
        return <ProfileView />;
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
