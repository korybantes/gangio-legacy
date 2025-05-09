'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import NavigationBar from '@/components/NavigationBar';
import ThreeBackground from '@/components/ui/ThreeBackground';
import { FaWindows, FaApple, FaLinux, FaAndroid } from 'react-icons/fa'; // Example icons
import { SiIos } from 'react-icons/si'; // Example iOS icon

export default function DownloadPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      try {
        setCurrentUser(JSON.parse(userString));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    window.location.href = '/';
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const downloadOptions = [
    {
      platform: 'Windows',
      icon: FaWindows,
      description: 'Get the full desktop experience.',
      link: '#', // Placeholder link
      image: '/assets/GangDevice-transparent.png'
    },
    {
      platform: 'macOS',
      icon: FaApple,
      description: 'Optimized for your Apple ecosystem.',
      link: '#',
      image: '/assets/GangDevice-transparent.png'
    },
    {
      platform: 'Linux',
      icon: FaLinux,
      description: 'Available in deb and tar.gz formats.',
      link: '#',
      image: '/assets/GangDevice-transparent.png'
    },
    {
      platform: 'Android',
      icon: FaAndroid,
      description: 'Chat on the go with our Android app.',
      link: '#',
      image: '/assets/GangMobile-transparent.png'
    },
    {
      platform: 'iOS',
      icon: SiIos,
      description: 'Stay connected on your iPhone or iPad.',
      link: '#',
      image: '/assets/GangMobile-transparent.png'
    },
    {
      platform: 'Web App',
      icon: () => <span className="text-2xl">🌐</span>, // Simple web icon
      description: 'Access GANGIO directly in your browser.',
      link: '/', // Link to the main app
      image: '/assets/GangScreen-transparent.png'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <NavigationBar currentUser={currentUser} onLogout={handleLogout} />
      <div className="pt-20"> {/* Padding for fixed navbar */}
        <ThreeBackground preset="landing" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4 text-center"
              variants={fadeInUp}
            >
              Get <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">GANGIO</span> Everywhere
            </motion.h1>
            <motion.p
              className="text-xl text-gray-300 mb-16 max-w-2xl mx-auto text-center"
              variants={fadeInUp}
            >
              Stay connected with your communities and friends, no matter your device.
            </motion.p>

            {/* Download Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={fadeInUp}
            >
              {downloadOptions.map((option) => (
                <motion.div
                  key={option.platform}
                  className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 flex flex-col items-center text-center group"
                  whileHover={{ y: -5, scale: 1.02 }}
                  variants={fadeInUp}
                >
                  <img src={option.image} alt={`${option.platform} device mockup`} className="h-32 mb-4 object-contain" />
                  <option.icon className="text-4xl mb-3 text-emerald-400" />
                  <h3 className="text-2xl font-semibold text-white mb-2">{option.platform}</h3>
                  <p className="text-gray-400 mb-4 flex-grow">{option.description}</p>
                  <a
                    href={option.link}
                    target={option.platform === 'Web App' ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="mt-auto inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
                  >
                    {option.platform === 'Web App' ? 'Open Web App' : `Download for ${option.platform}`}
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 