import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import AppearancePanel from './AppearancePanel';
import AccountPanel from './AccountPanel';
import ProfilePanel from './ProfilePanel';
import SessionsPanel from './SessionsPanel';
import SteamConnectionPanel from './SteamConnectionPanel';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const [currentSteamId, setCurrentSteamId] = useState<string>('');
  
  // Fetch the user's Steam ID when the modal is opened
  useEffect(() => {
    if (isOpen && session?.user) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/users/current');
          if (response.ok) {
            const userData = await response.json();
            if (userData.steamId) {
              setCurrentSteamId(userData.steamId);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchUserData();
    }
  }, [isOpen, session]);
  
  const tabs: { id: SettingsTab; label: string; category?: string }[] = [
    { id: 'my-account', label: 'My Account', category: 'USER SETTINGS' },
    { id: 'profile', label: 'Profile', category: 'USER SETTINGS' },
    { id: 'connections', label: 'Connections', category: 'USER SETTINGS' },
    { id: 'privacy-safety', label: 'Privacy & Safety', category: 'USER SETTINGS' },
    { id: 'appearance', label: 'Appearance', category: 'APP SETTINGS' },
    { id: 'notifications', label: 'Notifications', category: 'APP SETTINGS' },
    { id: 'voice-video', label: 'Voice & Video', category: 'APP SETTINGS' },
    { id: 'keybinds', label: 'Keybinds', category: 'APP SETTINGS' },
    { id: 'language', label: 'Language', category: 'APP SETTINGS' },
    { id: 'experimental', label: 'Experimental Features', category: 'APP SETTINGS' },
    { id: 'feedback', label: 'Feedback', category: 'INFO' },
    { id: 'changelog', label: 'Changelog', category: 'INFO' },
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
  
  // Handle saving Steam ID
  const handleSaveSteamId = async (steamId: string): Promise<boolean> => {
    try {
      console.log('Saving Steam ID in SettingsModal:', steamId);
      
      // Get user ID from session
      const userId = session?.user ? (session.user as any).id : null;
      
      if (!userId) {
        console.error('No user ID in session');
        return false;
      }
      
      // Use the client-side approach
      const response = await fetch('/api/steam/client-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId,
          steamId: steamId 
        }),
      });
      
      const data = await response.json();
      console.log('Client API response:', data);
      
      if (response.ok) {
        console.log('Steam ID saved successfully');
        setCurrentSteamId(steamId);
        return true;
      }
      
      console.error('Failed to save Steam ID:', data.error || 'Unknown error');
      return false;
    } catch (error) {
      console.error('Error saving Steam ID:', error);
      return false;
    }
  };
  
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
        return <SteamConnectionPanel 
          currentSteamId={currentSteamId} 
          onSave={handleSaveSteamId} 
        />;
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
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="flex h-[80vh] max-h-[80vh]">
        {/* Sidebar */}
        <div className="w-64 min-w-[240px] bg-gray-900 overflow-y-auto border-r border-gray-800 flex-shrink-0">
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
    </Modal>
  );
};

export default SettingsModal; 
 