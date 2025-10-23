import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ArrowPathIcon,
  SparklesIcon,
  UsersIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import aiAgentService from '../../services/aiAgentService';
import smartSchedulerService from '../../services/smartSchedulerService';

interface Conflict {
  id: string;
  type: 'time_overlap' | 'resource_conflict' | 'capacity_exceeded' | 'preference_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
  originalTime: {
    start: string;
    end: string;
    duration: number;
  };
  conflictingWith: {
    type: string;
    title: string;
    time: string;
  };
  impact: string;
}

interface Resolution {
  id: string;
  type: 'reschedule' | 'split' | 'merge' | 'alternative';
  title: string;
  description: string;
  newTime?: {
    start: string;
    end: string;
    duration: number;
  };
  alternatives: Array<{
    start: string;
    end: string;
    duration: number;
    confidence: number;
    reasoning: string;
  }>;
  pros: string[];
  cons: string[];
  aiConfidence: number;
}

interface ConflictResolutionProps {
  conflicts: Conflict[];
  onResolve: (resolution: Resolution) => void;
  onDismiss: (conflictId: string) => void;
}

const IntelligentConflictResolver: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolve,
  onDismiss
}) => {
  const [resolutions, setResolutions] = useState<Record<string, Resolution[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate resolutions for each conflict
    conflicts.forEach(conflict => {
      generateResolutions(conflict);
    });
  }, [conflicts]);

  const generateResolutions = async (conflict: Conflict) => {
    try {
      setLoading(prev => ({ ...prev, [conflict.id]: true }));
      
      // Use AI agent to generate intelligent resolutions
      const aiResolutions = await aiAgentService.resolveConflicts([conflict]);
      
      // Generate additional resolutions based on conflict type
      const resolutions = await generateConflictSpecificResolutions(conflict);
      
      setResolutions(prev => ({
        ...prev,
        [conflict.id]: resolutions
      }));
    } catch (error) {
      console.error('Error generating resolutions:', error);
      // Fallback to basic resolutions
      const basicResolutions = generateBasicResolutions(conflict);
      setResolutions(prev => ({
        ...prev,
        [conflict.id]: basicResolutions
      }));
    } finally {
      setLoading(prev => ({ ...prev, [conflict.id]: false }));
    }
  };

  const generateConflictSpecificResolutions = async (conflict: Conflict): Promise<Resolution[]> => {
    const resolutions: Resolution[] = [];
    
    switch (conflict.type) {
      case 'time_overlap':
        resolutions.push(
          {
            id: `${conflict.id}-reschedule-1`,
            type: 'reschedule',
            title: 'Reschedule to Next Available Slot',
            description: 'Move the session to the next available time slot that doesn\'t conflict.',
            newTime: {
              start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              end: new Date(Date.now() + 24 * 60 * 60 * 1000 + conflict.originalTime.duration * 60000).toISOString(),
              duration: conflict.originalTime.duration
            },
            alternatives: [
              {
                start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + conflict.originalTime.duration * 60000).toISOString(),
                duration: conflict.originalTime.duration,
                confidence: 0.9,
                reasoning: 'Next day has high availability'
              }
            ],
            pros: ['No time conflicts', 'Maintains session duration', 'Quick resolution'],
            cons: ['May not be ideal for students', 'Requires notification'],
            aiConfidence: 0.85
          },
          {
            id: `${conflict.id}-split-1`,
            type: 'split',
            title: 'Split into Two Shorter Sessions',
            description: 'Divide the session into two shorter sessions to avoid conflicts.',
            newTime: {
              start: conflict.originalTime.start,
              end: new Date(new Date(conflict.originalTime.start).getTime() + (conflict.originalTime.duration / 2) * 60000).toISOString(),
              duration: conflict.originalTime.duration / 2
            },
            alternatives: [
              {
                start: new Date(new Date(conflict.originalTime.start).getTime() + (conflict.originalTime.duration / 2) * 60000).toISOString(),
                end: new Date(new Date(conflict.originalTime.start).getTime() + conflict.originalTime.duration * 60000).toISOString(),
                duration: conflict.originalTime.duration / 2,
                confidence: 0.8,
                reasoning: 'Second half of original session'
              }
            ],
            pros: ['Maintains total learning time', 'Flexible scheduling', 'Reduces conflicts'],
            cons: ['May disrupt learning flow', 'Requires coordination'],
            aiConfidence: 0.75
          }
        );
        break;
        
      case 'capacity_exceeded':
        resolutions.push(
          {
            id: `${conflict.id}-alternative-1`,
            type: 'alternative',
            title: 'Create Additional Session',
            description: 'Schedule an additional session to accommodate all students.',
            alternatives: [
              {
                start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + conflict.originalTime.duration * 60000).toISOString(),
                duration: conflict.originalTime.duration,
                confidence: 0.9,
                reasoning: 'Next week has good availability'
              }
            ],
            pros: ['Accommodates all students', 'Maintains session quality', 'Clear solution'],
            cons: ['Requires additional time commitment', 'May need venue'],
            aiConfidence: 0.88
          }
        );
        break;
        
      case 'preference_mismatch':
        resolutions.push(
          {
            id: `${conflict.id}-merge-1`,
            type: 'merge',
            title: 'Find Compromise Time',
            description: 'Find a time that works for all parties involved.',
            alternatives: [
              {
                start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + conflict.originalTime.duration * 60000).toISOString(),
                duration: conflict.originalTime.duration,
                confidence: 0.7,
                reasoning: 'Mid-week compromise time'
              }
            ],
            pros: ['Satisfies all parties', 'Maintains relationships', 'Fair solution'],
            cons: ['May not be ideal for anyone', 'Requires negotiation'],
            aiConfidence: 0.65
          }
        );
        break;
    }
    
    return resolutions;
  };

  const generateBasicResolutions = (conflict: Conflict): Resolution[] => {
    return [
      {
        id: `${conflict.id}-basic-1`,
        type: 'reschedule',
        title: 'Reschedule to Next Available Time',
        description: 'Move the session to the next available time slot.',
        newTime: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + conflict.originalTime.duration * 60000).toISOString(),
          duration: conflict.originalTime.duration
        },
        alternatives: [],
        pros: ['Simple solution', 'Quick resolution'],
        cons: ['May not be ideal timing'],
        aiConfidence: 0.6
      }
    ];
  };

  const handleResolutionSelect = (conflictId: string, resolutionId: string) => {
    setSelectedResolutions(prev => ({
      ...prev,
      [conflictId]: resolutionId
    }));
  };

  const handleApplyResolution = (conflictId: string) => {
    const resolution = resolutions[conflictId]?.find(r => r.id === selectedResolutions[conflictId]);
    if (resolution) {
      onResolve(resolution);
    }
  };

  const handleDismissConflict = (conflictId: string) => {
    onDismiss(conflictId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircleIcon className="h-5 w-5" />;
      case 'medium': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'low': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conflicts Detected</h3>
        <p className="text-gray-600">Your schedule is conflict-free! 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
            Intelligent Conflict Resolution
          </h2>
          <div className="text-sm text-gray-600">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
          </div>
        </div>
        <p className="text-gray-600">
          AI-powered solutions to resolve scheduling conflicts intelligently.
        </p>
      </div>

      {conflicts.map((conflict) => (
        <div key={conflict.id} className="bg-white rounded-lg shadow-lg p-6">
          {/* Conflict Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start">
              <div className={`p-2 rounded-full mr-4 ${getSeverityColor(conflict.severity)}`}>
                {getSeverityIcon(conflict.severity)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{conflict.description}</h3>
                <p className="text-sm text-gray-600 mt-1">{conflict.impact}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Original time: {formatDateTime(conflict.originalTime.start)}</span>
                  <span className="mx-2">•</span>
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{conflict.originalTime.duration} minutes</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDismissConflict(conflict.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>

          {/* AI Resolutions */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
              AI-Generated Solutions
            </h4>
            
            {loading[conflict.id] ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Generating intelligent solutions...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {resolutions[conflict.id]?.map((resolution) => (
                  <div
                    key={resolution.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedResolutions[conflict.id] === resolution.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleResolutionSelect(conflict.id, resolution.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h5 className="font-medium text-gray-900">{resolution.title}</h5>
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {Math.round(resolution.aiConfidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{resolution.description}</p>
                        
                        {resolution.newTime && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-sm text-gray-700">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              <span>New time: {formatDateTime(resolution.newTime.start)}</span>
                              <span className="mx-2">•</span>
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>{resolution.newTime.duration} minutes</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-green-700 mb-1">Pros</h6>
                            <ul className="text-sm text-green-600 space-y-1">
                              {resolution.pros.map((pro, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircleIcon className="h-3 w-3 mr-1 mt-0.5" />
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h6 className="font-medium text-red-700 mb-1">Cons</h6>
                            <ul className="text-sm text-red-600 space-y-1">
                              {resolution.cons.map((con, index) => (
                                <li key={index} className="flex items-start">
                                  <XCircleIcon className="h-3 w-3 mr-1 mt-0.5" />
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {selectedResolutions[conflict.id] === resolution.id ? (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedResolutions[conflict.id] && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Solution selected: {resolutions[conflict.id]?.find(r => r.id === selectedResolutions[conflict.id])?.title}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedResolutions(prev => ({ ...prev, [conflict.id]: '' }))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyResolution(conflict.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Apply Solution
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IntelligentConflictResolver;
