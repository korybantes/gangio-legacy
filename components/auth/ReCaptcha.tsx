"use client";

import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

// For debugging
const DEBUG = process.env.NODE_ENV === 'development';

interface ReCaptchaProps {
  siteKey: string;
  onChange: (token: string | null) => void;
  size?: "compact" | "normal";
}

const ReCaptchaComponent = ({ siteKey, onChange, size = "normal" }: ReCaptchaProps) => {
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if dark mode is enabled
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    
    // Listen for changes in color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }
    
    // Log site key for debugging
    if (DEBUG) {
      console.log('ReCaptcha site key:', siteKey);
      console.log('ReCaptcha size:', size);
    }
    
    // Reset recaptcha on unmount
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [siteKey, size]);

  const handleChange = (token: string | null) => {
    onChange(token);
  };

  // Handle reCAPTCHA errors - must match the expected event handler type
  const handleError = () => {
    if (DEBUG) {
      console.error("reCAPTCHA error occurred");
      console.error("Site key used:", siteKey);
    }
    
    // Log detailed error information
    console.error("reCAPTCHA error or network failure", {
      siteKey: siteKey ? `${siteKey.substring(0, 8)}...` : 'undefined', // Only log part of the key for security
      size,
      isDarkMode
    });
    
    setLoadError(true);
  };

  const handleExpired = () => {
    console.warn("reCAPTCHA expired, resetting");
    onChange(null);
  };

  if (!mounted) return null;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center my-4 p-4 border border-red-300 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load reCAPTCHA. Please refresh the page and try again.</p>
        <button 
          onClick={() => setLoadError(false)}
          className="mt-2 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-4">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onError={handleError}
        onExpired={handleExpired}
        theme={isDarkMode ? "dark" : "light"}
        size={size}
      />
    </div>
  );
};

export default ReCaptchaComponent;
