import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

type Theme = 'dark' | 'light' | 'system';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';

interface AppearanceSettings {
  theme: Theme;
  compactMode: boolean;
  messageGrouping: boolean;
  fontSize: number;
  colorScheme: ColorScheme;
  animationsEnabled: boolean;
  saturation: number;
}

const AppearancePanel: React.FC = () => {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'dark',
    compactMode: false,
    messageGrouping: true,
    fontSize: 16,
    colorScheme: 'blue',
    animationsEnabled: true,
    saturation: 100,
  });
  
  const handleThemeChange = (value: Theme) => {
    setSettings({ ...settings, theme: value });
    // In a real app, save to user preferences
  };
  
  const handleToggleChange = (key: keyof AppearanceSettings, value: boolean) => {
    setSettings({ ...settings, [key]: value });
    // In a real app, save to user preferences
  };
  
  const handleSliderChange = (key: 'fontSize' | 'saturation', value: number[]) => {
    setSettings({ ...settings, [key]: value[0] });
    // In a real app, save to user preferences
  };
  
  const handleColorSchemeChange = (value: ColorScheme) => {
    setSettings({ ...settings, colorScheme: value });
    // In a real app, save to user preferences
  };
  
  // Color scheme preview dots
  const colorSchemes = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Appearance</h2>
      
      {/* Theme Section */}
      <div className="mb-8">
        <h3 className="uppercase text-xs font-semibold text-gray-400 mb-2">THEME</h3>
        <div className="bg-gray-800 rounded-md p-4">
          <RadioGroup 
            value={settings.theme} 
            onValueChange={(value) => handleThemeChange(value as Theme)}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="text-white cursor-pointer">Dark</Label>
              </div>
              <div className="w-10 h-6 bg-gray-900 rounded border border-gray-700"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="text-white cursor-pointer">Light</Label>
              </div>
              <div className="w-10 h-6 bg-gray-100 rounded border border-gray-300"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="text-white cursor-pointer">Sync with system</Label>
              </div>
              <div className="w-10 h-6 bg-gradient-to-r from-gray-900 to-gray-100 rounded border border-gray-700"></div>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      {/* Layout Section */}
      <div className="mb-8">
        <h3 className="uppercase text-xs font-semibold text-gray-400 mb-2">LAYOUT</h3>
        <div className="bg-gray-800 rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Compact Mode</h4>
              <p className="text-sm text-gray-400 mt-1">
                Make messages take up less vertical space.
              </p>
            </div>
            <Switch 
              checked={settings.compactMode}
              onCheckedChange={(checked) => handleToggleChange('compactMode', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Message Grouping</h4>
              <p className="text-sm text-gray-400 mt-1">
                Group messages from the same user.
              </p>
            </div>
            <Switch 
              checked={settings.messageGrouping}
              onCheckedChange={(checked) => handleToggleChange('messageGrouping', checked)}
            />
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Font Size</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">12px</span>
              <Slider 
                value={[settings.fontSize]}
                min={12}
                max={20}
                step={1}
                onValueChange={(value) => handleSliderChange('fontSize', value)}
                className="flex-grow"
              />
              <span className="text-xs text-gray-400">20px</span>
            </div>
            <div className="text-center text-sm text-gray-400 mt-1">
              {settings.fontSize}px
            </div>
          </div>
        </div>
      </div>
      
      {/* Colors Section */}
      <div className="mb-8">
        <h3 className="uppercase text-xs font-semibold text-gray-400 mb-2">COLORS</h3>
        <div className="bg-gray-800 rounded-md p-4 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Color Scheme</h4>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(colorSchemes) as ColorScheme[]).map((color) => (
                <button
                  key={color}
                  className={`w-full aspect-square rounded-full border-2 transition-all ${
                    settings.colorScheme === color 
                      ? 'border-white scale-110' 
                      : 'border-transparent hover:border-gray-400'
                  } ${colorSchemes[color]}`}
                  onClick={() => handleColorSchemeChange(color)}
                  aria-label={`${color} theme`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Saturation</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">50%</span>
              <Slider 
                value={[settings.saturation]}
                min={50}
                max={150}
                step={5}
                onValueChange={(value) => handleSliderChange('saturation', value)}
                className="flex-grow"
              />
              <span className="text-xs text-gray-400">150%</span>
            </div>
            <div className="text-center text-sm text-gray-400 mt-1">
              {settings.saturation}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Accessibility Section */}
      <div>
        <h3 className="uppercase text-xs font-semibold text-gray-400 mb-2">ACCESSIBILITY</h3>
        <div className="bg-gray-800 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Animations</h4>
              <p className="text-sm text-gray-400 mt-1">
                Enable or disable animations and transitions.
              </p>
            </div>
            <Switch 
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) => handleToggleChange('animationsEnabled', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearancePanel; 