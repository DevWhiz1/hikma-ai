import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserIcon, 
  LanguageIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  VideoCameraIcon, 
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  StarIcon,
  GlobeAltIcon,
  BookOpenIcon,
  SparklesIcon,
  TrophyIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { applyScholar, uploadPhoto } from '../../services/scholarService';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface FormData {
  bio: string;
  specializations: string;
  languages: string;
  experienceYears: string;
  qualifications: string;
  demoVideoUrl: string;
  photoUrl: string;
  teachingPhilosophy: string;
  availability: string;
  hourlyRate: string;
  certifications: string;
  achievements: string;
  references: string;
}

const ScholarApplyForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    bio: '',
    specializations: '',
    languages: '',
    experienceYears: '',
    qualifications: '',
    demoVideoUrl: '',
    photoUrl: '',
    teachingPhilosophy: '',
    availability: '',
    hourlyRate: '',
    certifications: '',
    achievements: '',
    references: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;

  const isValid = useMemo(() => {
    const has = (s: string) => typeof s === 'string' && s.trim().length > 0;
    const exp = Number(formData.experienceYears);
    return has(formData.bio) && 
           has(formData.specializations) && 
           has(formData.languages) && 
           has(formData.qualifications) && 
           has(formData.demoVideoUrl) && 
           has(formData.photoUrl) && 
           !Number.isNaN(exp) && 
           exp >= 0 && 
           ytRegex.test(formData.demoVideoUrl.trim());
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadPhoto(file);
      if (response?.url) {
        setFormData(prev => ({ ...prev, photoUrl: response.url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    switch (step) {
      case 1:
        if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
        if (!formData.specializations.trim()) newErrors.specializations = 'Specializations are required';
        if (!formData.languages.trim()) newErrors.languages = 'Languages are required';
        break;
      case 2:
        if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
          newErrors.experienceYears = 'Valid experience years required';
        }
        if (!formData.qualifications.trim()) newErrors.qualifications = 'Qualifications are required';
        break;
      case 3:
        if (!formData.teachingPhilosophy.trim()) newErrors.teachingPhilosophy = 'Teaching philosophy is required';
        if (!formData.certifications.trim()) newErrors.certifications = 'Certifications are required';
        break;
      case 4:
        if (!formData.availability.trim()) newErrors.availability = 'Availability is required';
        if (!formData.hourlyRate || Number(formData.hourlyRate) < 0) {
          newErrors.hourlyRate = 'Valid hourly rate is required';
        }
        break;
      case 5:
        if (!formData.demoVideoUrl.trim() || !ytRegex.test(formData.demoVideoUrl.trim())) {
          newErrors.demoVideoUrl = 'Valid YouTube URL is required';
        }
        if (!formData.photoUrl.trim()) newErrors.photoUrl = 'Profile photo is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
        experienceYears: Number(formData.experienceYears)
      };

      await applyScholar(payload);
      alert('Application submitted successfully! Your application is now under review. You will be notified once approved.');
      navigate('/scholars');
    } catch (error: any) {
      console.error('Application failed:', error);
      alert(error?.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Tell us about yourself', icon: UserIcon },
    { number: 2, title: 'Experience & Qualifications', description: 'Share your expertise', icon: AcademicCapIcon },
    { number: 3, title: 'Teaching Philosophy', description: 'Your approach to teaching', icon: LightBulbIcon },
    { number: 4, title: 'Availability & Rates', description: 'When and how much', icon: ClockIcon },
    { number: 5, title: 'Media & Verification', description: 'Add demo video and photo', icon: VideoCameraIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/scholars')}
            className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Scholars
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-6 shadow-lg">
              <AcademicCapIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Apply as Islamic Scholar
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join our community of qualified Islamic scholars and help students learn authentic Islamic knowledge.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <UserIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal Information</h2>
                  <p className="text-gray-600 dark:text-gray-400">Tell us about yourself and your Islamic knowledge</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio *
                  </label>
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about your Islamic background, education, and teaching experience..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.bio ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    required
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.bio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specializations *
                  </label>
                  <Input
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleInputChange}
                    placeholder="e.g., Quran Recitation, Hadith Studies, Islamic Law, Arabic Language"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.specializations ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separate multiple specializations with commas
                  </p>
                  {errors.specializations && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.specializations}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Languages *
                  </label>
                  <Input
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                    placeholder="e.g., Arabic, English, Urdu, French"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.languages ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separate multiple languages with commas
                  </p>
                  {errors.languages && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.languages}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Experience & Qualifications */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <ClockIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Experience & Qualifications</h2>
                  <p className="text-gray-600 dark:text-gray-400">Share your educational background and teaching experience</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.experienceYears ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.experienceYears && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.experienceYears}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qualifications *
                  </label>
                  <textarea
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    placeholder="List your Islamic education, degrees, certifications, and any notable achievements..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.qualifications ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    required
                  />
                  {errors.qualifications && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.qualifications}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Teaching Philosophy */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <LightBulbIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Teaching Philosophy</h2>
                  <p className="text-gray-600 dark:text-gray-400">Share your approach to Islamic education</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teaching Philosophy *
                  </label>
                  <textarea
                    name="teachingPhilosophy"
                    value={formData.teachingPhilosophy}
                    onChange={handleInputChange}
                    placeholder="Describe your teaching approach, methodology, and how you make Islamic knowledge accessible to students..."
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.teachingPhilosophy ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.teachingPhilosophy && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.teachingPhilosophy}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Certifications & Awards *
                  </label>
                  <textarea
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    placeholder="List any Islamic certifications, ijazahs, awards, or recognitions you have received..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.certifications ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.certifications && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.certifications}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notable Achievements
                  </label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    placeholder="Share any notable achievements, publications, or contributions to Islamic education..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    References
                  </label>
                  <textarea
                    name="references"
                    value={formData.references}
                    onChange={handleInputChange}
                    placeholder="Provide contact information for 2-3 references who can vouch for your Islamic knowledge and teaching ability..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Availability & Rates */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <ClockIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Availability & Rates</h2>
                  <p className="text-gray-600 dark:text-gray-400">Set your teaching schedule and pricing</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability *
                  </label>
                  <textarea
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder="Describe your available teaching hours, time zones, and preferred days for sessions..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.availability ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.availability && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.availability}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <input
                    name="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    step="5"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.hourlyRate ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Set your hourly rate for one-on-one sessions with students
                  </p>
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.hourlyRate}
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">Pricing Guidelines</h4>
                  <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                    <li>• $20-40/hour: Beginner scholars or new to online teaching</li>
                    <li>• $40-80/hour: Experienced scholars with proven track record</li>
                    <li>• $80+/hour: Highly qualified scholars with extensive credentials</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 5: Media & Verification */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <VideoCameraIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Media & Verification</h2>
                  <p className="text-gray-600 dark:text-gray-400">Add a demo video and profile photo to showcase your teaching</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Demo Video URL (YouTube) *
                  </label>
                  <input
                    name="demoVideoUrl"
                    value={formData.demoVideoUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.demoVideoUrl ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload a short video demonstrating your teaching style or recitation
                  </p>
                  {errors.demoVideoUrl && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.demoVideoUrl}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Photo *
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        name="photoUrl"
                        value={formData.photoUrl}
                        onChange={handleInputChange}
                        placeholder="Or enter photo URL directly"
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.photoUrl ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        required
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="flex items-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors"
                        >
                          <PhotoIcon className="h-5 w-5 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </label>
                      </div>
                    </div>
                    {formData.photoUrl && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={formData.photoUrl}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo Preview</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This will be displayed on your scholar profile</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.photoUrl && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.photoUrl}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                variant="outline"
              >
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="px-6"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !isValid}
                  className="px-8"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Application Tips */}
        <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-4">Application Tips</h3>
          <ul className="space-y-2 text-emerald-800 dark:text-emerald-200">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Be detailed in your bio and qualifications to help students understand your expertise</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Your demo video should showcase your teaching style and Islamic knowledge</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Applications are reviewed within 2-3 business days</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>You'll receive an email notification once your application is approved</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScholarApplyForm;
