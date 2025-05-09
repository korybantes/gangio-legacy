import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import AppearancePanel from './settings/AppearancePanel';
import AccountPanel from './settings/AccountPanel';
import ProfilePanel from './settings/ProfilePanel';
import SessionsPanel from './settings/SessionsPanel';
import ConnectionsPanel from './settings/ConnectionsPanel';

type SettingsTab = 
  | 'my-account' 
  | 'profile' 
  | 'privacy-safety' 
  | 'appearance' 
  | 'notifications'
  | 'voice-video'
  | 'keybinds'
  | 'language'
  | 'experimental'
  | 'feedback'
  | 'changelog'
  | 'sessions'
  | 'connections';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  defaultTab = 'my-account' 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  
  // Reset to default tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);
  
  const tabs: { id: SettingsTab; label: string; category?: string }[] = [
    { id: 'my-account', label: 'My Account', category: 'USER SETTINGS' },
    { id: 'profile', label: 'Profile', category: 'USER SETTINGS' },
    { id: 'privacy-safety', label: 'Privacy & Safety', category: 'USER SETTINGS' },
    { id: 'connections', label: 'Connections', category: 'CONNECTIONS' },
    { id: 'appearance', label: 'Appearance', category: 'APP SETTINGS' },
    { id: 'notifications', label: 'Notifications', category: 'APP SETTINGS' },
    { id: 'voice-video', label: 'Voice & Video', category: 'APP SETTINGS' },
    { id: 'keybinds', label: 'Keybinds', category: 'APP SETTINGS' },
    { id: 'language', label: 'Language', category: 'APP SETTINGS' },
    { id: 'experimental', label: 'Experimental Features', category: 'APP SETTINGS' },
    { id: 'feedback', label: 'Feedback', category: 'INFO' },
    { id: 'changelog', label: 'Changelog', category: 'INFO' },
    { id: 'sessions', label: 'Active Sessions', category: 'INFO' },
  ];
  
  // Group tabs by category
  const groupedTabs: { [key: string]: typeof tabs } = {};
  tabs.forEach(tab => {
    const category = tab.category || 'OTHER';
    if (!groupedTabs[category]) {
      groupedTabs[category] = [];
    }
    groupedTabs[category].push(tab);
  });
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearancePanel />;
      case 'my-account':
        return <AccountPanel onNavigate={(section) => setActiveTab(section as SettingsTab)} />;
      case 'profile':
        return <ProfilePanel />;
      case 'sessions':
        return <SessionsPanel />;
      case 'connections':
        return <ConnectionsPanel />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              This settings panel is not yet implemented.
            </p>
          </div>
        );
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">User Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 overflow-y-auto border-r border-gray-800">
            <div className="p-4">
              {Object.keys(groupedTabs).map((category) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 mb-2">
                    {category}
                  </h3>
                  <ul>
                    {groupedTabs[category].map((tab) => (
                      <li key={tab.id}>
                        <button
                          className={`w-full text-left px-2 py-1.5 rounded text-sm mb-0.5 ${
                            activeTab === tab.id
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 