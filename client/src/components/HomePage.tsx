import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, ChatBubbleLeftRightIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col p-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to <span className="text-emerald-600 dark:text-emerald-400">Islamic Scholar AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Explore Islamic knowledge with our AI-powered scholar assistant. Get answers to your questions, find your Qibla direction, and access reliable Islamic resources.
        </p>
        <div className="relative rounded-xl overflow-hidden h-64 md:h-96 shadow-xl">
          <img 
            src="https://media.istockphoto.com/id/1011940756/photo/muslim-men-praying-during-ramadan.webp?a=1&b=1&s=612x612&w=0&k=20&c=cCDd3Yj5WHUqmq5YElnhZacyMwEMKIbVXdrMDOPkx2c=" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-8">
            <h2 className="text-white text-2xl font-semibold px-4 text-center">
              "The key to Paradise is Salat, and the key to Salat is Wudu"
            </h2>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Our Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Chat with Scholar
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Get answers to your questions about Islam from our AI-powered scholar based on authentic sources.
            </p>
          </div>

          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <GlobeAltIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Qibla Finder
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Easily find the direction of the Kaaba from your current location to perform your prayers correctly.
            </p>
          </div>

    
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <BookOpenIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Islamic Resources
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Access reliable Islamic resources, including Quran, Hadith, and scholarly interpretations.
            </p>
          </div>
        </div>
      </section> */}

      {/* Call to Action */}
      <section className="mb-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Start Your Islamic Learning Journey
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Whether you're a new Muslim or seeking to deepen your understanding, our AI scholar is here to guide you with knowledge based on authentic sources.
        </p>
        <button 
          onClick={() => navigate('/chat')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md"
        >
          Chat with Scholar Now
        </button>
      </section>

      {/* Testimonials */}
      {/* <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          What Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-300 italic mb-4">
              "This app has been incredibly helpful for me as a new Muslim. I can get instant answers to my questions about Islam from reliable sources."
            </p>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                SA
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Sarah Ahmed</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">New Muslim</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-300 italic mb-4">
              "The Qibla finder feature is precise and easy to use. This app has become an essential tool for my daily practice of Islam."
            </p>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                MK
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Mohammed Khan</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default HomePage;
