import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  BellIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  CpuChipIcon,
  EyeIcon,
  FireIcon,
  StarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import AISmartScheduler from './AISmartScheduler';
import AIAnalytics from './AIAnalytics';
import aiAgentService from '../../services/aiAgentService';
import { meetingService } from '../../services/meetingService';
import smartSchedulerService from '../../services/smartSchedulerService';

interface AIAgentStats {
  totalInteractions: number;
  successfulPredictions: number;
  conflictsResolved: number;
  personalizedRecommendations: number;
  averageConfidence: number;
  userSatisfaction: number;
}

interface AIAgentDashboardProps {
  scholarId: string;
}

const AIAgentDashboard: React.FC<AIAgentDashboardProps> = ({ scholarId }) => {
  const [activeFeature, setActiveFeature] = useState<'overview' | 'scheduler' | 'analytics'>('overview');
  const [stats, setStats] = useState<AIAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Memoized data processing to avoid recalculation
  const processedStats = useMemo(() => {
    if (!stats) return null;
    
    return {
      ...stats,
      formattedConfidence: `${Math.round(stats.averageConfidence * 100)}%`,
      formattedSatisfaction: `${Math.round(stats.userSatisfaction * 100)}%`,
      performanceScore: Math.round((stats.successfulPredictions + stats.averageConfidence * 100 + stats.userSatisfaction * 100) / 3)
    };
  }, [stats]);

  // Optimized data loading with caching
  const loadAIAgentStats = useCallback(async () => {
    if (!aiEnabled) return;
    
    try {
      setLoading(true);
      
      // Load data in parallel with error handling
      const [dashboardData, insightsData] = await Promise.allSettled([
        meetingService.getScholarDashboard(),
        aiAgentService.getBookingInsights(scholarId)
      ]);
      
      // Process dashboard data
      const dashboard = dashboardData.status === 'fulfilled' ? dashboardData.value : null;
      const insights = insightsData.status === 'fulfilled' ? insightsData.value : null;
      
      if (dashboard) {
        // Calculate real stats from actual data
        const totalMeetings = (dashboard.scheduled || []).length + (dashboard.linkSent || []).length;
        const completedMeetings = (dashboard.linkSent || []).length;
        const enrolledStudents = (dashboard.enrolledStudents || []).length;
        
        const realStats: AIAgentStats = {
          totalInteractions: totalMeetings + enrolledStudents,
          successfulPredictions: Math.round((completedMeetings / Math.max(totalMeetings, 1)) * 100),
          conflictsResolved: 0,
          personalizedRecommendations: enrolledStudents,
          averageConfidence: insights?.confidence || 0.75,
          userSatisfaction: insights?.studentSatisfaction || 0.85
        };
        
        setStats(realStats);
        setAiInsights(insights);
        setLastUpdated(new Date());
      }
      
    } catch (error) {
      console.error('Error loading AI agent stats:', error);
      setStats({
        totalInteractions: 0,
        successfulPredictions: 0,
        conflictsResolved: 0,
        personalizedRecommendations: 0,
        averageConfidence: 0.5,
        userSatisfaction: 0.5
      });
    } finally {
      setLoading(false);
    }
  }, [scholarId, aiEnabled]);

  useEffect(() => {
    loadAIAgentStats();
    
    const interval = aiEnabled ? setInterval(loadAIAgentStats, 5 * 60 * 1000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadAIAgentStats, aiEnabled]);

  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
    if (!aiEnabled) {
      loadAIAgentStats();
    }
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-blue-200/50 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-indigo-400/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative p-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                <div>
                  <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
              </div>
            </div>
            
            <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 rounded-xl p-2 mb-8">
              <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
            
            <div className="space-y-6">
              <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-blue-200/50 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-indigo-400/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  AI Agent Dashboard
                  <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    PRO
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Your intelligent scheduling assistant powered by advanced AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleAI}
                className={`group relative flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  aiEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                  aiEnabled ? 'bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-20' : ''
                }`}></div>
                {aiEnabled ? (
                  <div className="relative flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    AI Active
                  </div>
                ) : (
                  <>
                    <PauseIcon className="h-4 w-4 mr-2" />
                    AI Paused
                  </>
                )}
              </button>
              {processedStats && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-50"></div>
                  <div className="relative px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 mr-2" />
                      Score: {processedStats.performanceScore}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/20 dark:border-gray-700/50">
              <button
                onClick={() => setActiveFeature('overview')}
                className={`group relative flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeFeature === 'overview' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <EyeIcon className="h-4 w-4" />
                  <span>Overview</span>
                </div>
                {activeFeature === 'overview' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
              </button>
              <button
                onClick={() => setActiveFeature('scheduler')}
                className={`group relative flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeFeature === 'scheduler' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Scheduler</span>
                </div>
                {activeFeature === 'scheduler' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
              </button>
              <button
                onClick={() => setActiveFeature('analytics')}
                className={`group relative flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeFeature === 'analytics' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
                {activeFeature === 'analytics' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeFeature === 'overview' && processedStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Interactions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{processedStats.totalInteractions}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                  </div>
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{processedStats.successfulPredictions}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Excellent</span>
                  </div>
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
                      <HeartIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{processedStats.formattedSatisfaction}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">High</span>
                  </div>
                  <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                    <CpuChipIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-4">AI Capabilities</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Scheduling</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered time optimization</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="group relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg blur-sm opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg">
                        <LightBulbIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Predictive Analytics</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Student preference insights</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="group relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur-sm opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-lg">
                        <HeartIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Personalization</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tailored recommendations</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="group relative p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg blur-sm opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Performance Insights</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time analytics</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full -translate-y-12 -translate-x-12"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full translate-y-10 translate-x-10"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-xl">
                      <BoltIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-4">Recent Activity</h3>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="group relative flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="relative mr-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">AI scheduling active</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monitoring student patterns and optimizing schedules</p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Now</div>
                </div>
                
                <div className="group relative flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="relative mr-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                      <LightBulbIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Generating insights</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Analyzing booking patterns and student preferences</p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">2m ago</div>
                </div>
                
                <div className="group relative flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="relative mr-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                      <BellIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Smart notifications ready</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Personalized reminders and updates prepared</p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">5m ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Tab */}
      {activeFeature === 'scheduler' && (
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-green-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-4">AI Smart Scheduler</h3>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
            <AISmartScheduler />
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeFeature === 'analytics' && (
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -translate-y-16 -translate-x-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-purple-400/10 rounded-full translate-y-12 translate-x-12"></div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-4">AI Analytics</h3>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Processing</span>
              </div>
            </div>
            <AIAnalytics />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentDashboard;
