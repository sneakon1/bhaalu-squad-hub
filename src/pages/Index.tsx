import { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import PlayersView from '@/components/PlayersView';
import ShopView from '@/components/ShopView';
import CaptainView from '@/components/CaptainView';
import AdminView from '@/components/AdminView';
import ProfileView from '@/components/ProfileView';
import AuthView from '@/components/AuthView';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'players':
        return <PlayersView />;
      case 'shop':
        return <ShopView />;
      case 'captain':
        return <CaptainView />;
      case 'admin':
        return <AdminView />;
      case 'profile':
        return <ProfileView />;
      case 'auth':
        return <AuthView onBack={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard />;
    }
  };

  // Don't render Layout for auth view
  if (activeTab === 'auth') {
    return renderActiveView();
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveView()}
    </Layout>
  );
};

export default Index;
