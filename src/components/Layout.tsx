import React, { useState } from 'react';
import { Trophy, Users, User, Shield, Menu, X, Settings, ShoppingBag, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SimpleThemeToggle from './SimpleThemeToggle';
import bhaaluSquadIcon from '@/assets/bhaalu_squadIcon.png';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout = ({ children, activeTab, onTabChange }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Shield },
    { id: 'players', name: 'Players', icon: Users },
    { id: 'shop', name: 'Shop', icon: ShoppingBag },
    { id: 'admin', name: 'Admin', icon: Settings },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  // Get user info from localStorage
  const userEmail = localStorage.getItem('userEmail');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button 
              onClick={() => onTabChange('dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center">
                <img src={bhaaluSquadIcon} alt="Bhaalu Squad" className="w-16 h-16 rounded-xl" />
              </div>
              <div>
                <h1 className="text-xl font-poppins font-bold text-foreground">Bhaalu Squad</h1>
                <p className="text-xs text-muted-foreground">Football Portal</p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`nav-link px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      activeTab === item.id ? 'active bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
              

              {/* User Menu or Login Button */}
              {userEmail ? (
                <div className="relative ml-4">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80"
                    onClick={() => setUserMenuOpen((open) => !open)}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{userEmail}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded shadow-lg z-10">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-muted"
                        onClick={handleLogout}
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => onTabChange('auth')}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
              
              {/* Theme Toggle */}
              <div className="ml-4 pl-4 border-l border-border">
                <SimpleThemeToggle />
              </div>
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`nav-link w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                      activeTab === item.id ? 'active bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
              

              {/* Mobile User Menu or Login Button */}
              {userEmail ? (
                <div className="relative w-full mt-2">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 w-full"
                    onClick={() => setUserMenuOpen((open) => !open)}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{userEmail}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded shadow-lg z-10">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-muted"
                        onClick={handleLogout}
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => {
                    onTabChange('auth');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
              
              {/* Mobile Theme Toggle */}
              <div className="pt-2 mt-2 border-t border-border">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium text-muted-foreground">Theme</span>
                  <SimpleThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;