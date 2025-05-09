import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ServerSettingsButtonProps {
  serverId: string;
  isOwner: boolean;
}

export const ServerSettingsButton: React.FC<ServerSettingsButtonProps> = ({ serverId, isOwner }) => {
  const router = useRouter();

  if (!isOwner) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/server-settings/${serverId}`);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="p-1.5 rounded-md bg-gray-700/50 text-gray-300 hover:text-emerald-400 hover:bg-emerald-800/30 transition-all duration-200"
      title="Server Settings"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    </motion.button>
  );
};

interface ServerSettingsProps {
  serverId: string;
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSave: (language: string) => Promise<void>;
}

export const ServerSettings: React.FC<ServerSettingsProps> = ({
  serverId,
  isOpen,
  onClose,
  currentLanguage,
  onSave
}) => {
  const [language, setLanguage] = useState(currentLanguage);
  const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Korean'];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, isOpen, onClose]);

  const handleSave = async () => {
    await onSave(language);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <h3 className="text-xl font-bold mb-4">Server Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Server Language
                <span className="text-xs text-gray-400 ml-2">(Enter to save)</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center"
              >
                Cancel <span className="text-xs ml-2 text-gray-400">(Esc)</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 flex items-center"
              >
                Save Changes <span className="text-xs ml-2 text-gray-200">(Enter)</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 