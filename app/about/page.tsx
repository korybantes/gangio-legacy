'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import NavigationBar from '@/components/NavigationBar';
import ThreeBackground from '@/components/ui/ThreeBackground';

export default function AboutPage() {
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
    // Optionally redirect
    window.location.href = '/'; // Simple redirect for now
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <NavigationBar currentUser={currentUser} onLogout={handleLogout} />
      <div className="pt-20"> {/* Padding for fixed navbar */}
        <ThreeBackground preset="landing" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.3 } } }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 text-center"
              variants={fadeInUp}
            >
              About <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">GANGIO</span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto text-center"
              variants={fadeInUp}
            >
              GANGIO was born from a simple idea: to create the ultimate platform where gamers can truly connect, collaborate, and conquer together.
            </motion.p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16"
              variants={fadeInUp}
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-gray-400 mb-4">
                  Founded in 2023 by a team of passionate gamers and developers, GANGIO has quickly grown into a thriving community. Our mission is to break down the barriers between gamers and provide a seamless, immersive communication experience that enhances every gaming session.
                </p>
                <p className="text-gray-400">
                  We believe in the power of community and the connections forged through shared gaming experiences. We're dedicated to building a stable, feature-rich, and fun platform for everyone.
                </p>
              </div>
              <div className="relative h-64 md:h-auto">
                <img
                  src="/assets/gangiobear-wymsical-forest.png"
                  alt="GANGIO Mascot in forest"
                  className="w-full h-full object-cover rounded-lg shadow-xl"
                />
              </div>
            </motion.div>

            <motion.div className="text-center" variants={fadeInUp}>
              <h2 className="text-2xl font-semibold mb-6">Meet the Core Team (Placeholder)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {/* Placeholder Team Members */} 
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 mb-3 flex items-center justify-center">
                       {/* Placeholder for avatar - maybe use initials or a default icon */}
                       <span className="text-4xl text-gray-500">?</span>
                    </div>
                    <h3 className="font-medium text-white">Team Member {i}</h3>
                    <p className="text-sm text-emerald-400">Role {i}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
        {/* You can add a simple footer here or reuse the LandingPage footer component if extracted */}
      </div>
    </div>
  );
} 