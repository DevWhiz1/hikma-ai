import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  AcademicCapIcon, 
  VideoCameraIcon, 
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  StarIcon,
  ClockIcon,
  GlobeAltIcon,
  BookOpenIcon,
  LightBulbIcon,
  TrophyIcon,
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { getMyScholarProfile, updateMyScholarProfile, uploadPhoto } from '../../services/scholarService';
import { authService } from '../../services/authService';

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
  socialMedia: string;
  website: string;
}

const ScholarProfileEditor = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    socialMedia: '',
    website: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await getMyScholarProfile();
      if (!profile?.approved) {
        setError('Your scholar profile is not yet approved. Editing is enabled after approval.');
        return;
      }
      
      setFormData({
        bio: profile?.bio || '',
        specializations: Array.isArray(profile?.specializations) ? profile.specializations.join(', ') : '',
        languages: Array.isArray(profile?.languages) ? profile.languages.join(', ') : '',
        experienceYears: profile?.experienceYears?.toString() || '',
        qualifications: profile?.qualifications || '',
        demoVideoUrl: profile?.demoVideoUrl || '',
        photoUrl: profile?.photoUrl || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load your scholar profile');
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
    if (!formData.specializations.trim()) newErrors.specializations = 'Specializations are required';
    if (!formData.languages.trim()) newErrors.languages = 'Languages are required';
    if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
      newErrors.experienceYears = 'Valid experience years required';
    }
    if (!formData.qualifications.trim()) newErrors.qualifications = 'Qualifications are required';
    if (!formData.demoVideoUrl.trim() || !ytRegex.test(formData.demoVideoUrl.trim())) {
      newErrors.demoVideoUrl = 'Valid YouTube URL is required';
    }
    if (!formData.photoUrl.trim()) newErrors.photoUrl = 'Profile photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const payload = {
        bio: formData.bio,
        specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
        experienceYears: Number(formData.experienceYears),
        qualifications: formData.qualifications,
        demoVideoUrl: formData.demoVideoUrl,
        photoUrl: formData.photoUrl,
        teachingPhilosophy: formData.teachingPhilosophy,
        availability: formData.availability,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
        certifications: formData.certifications,
        achievements: formData.achievements,
        socialMedia: formData.socialMedia,
        website: formData.website
      };

      await updateMyScholarProfile(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/scholars/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setError(error?.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'scholar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You must be a scholar to edit your profile.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/scholars/dashboard')}
            className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-6 shadow-lg">
              <PencilIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Scholar Profile
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Update your profile information to help students learn more about your expertise and teaching style.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Profile Updated Successfully!</h3>
                <p className="text-green-700 dark:text-green-300">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center mb-6">
                <UserIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio *
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell students about your Islamic background, education, and teaching experience..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.bio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    required
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.bio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specializations *
                  </label>
                  <input
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleInputChange}
                    placeholder="e.g., Quran Recitation, Hadith Studies, Islamic Law, Arabic Language"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.specializations ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separate multiple specializations with commas
                  </p>
                  {errors.specializations && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.specializations}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Languages *
                  </label>
                  <input
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                    placeholder="e.g., Arabic, English, Urdu, French"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.languages ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separate multiple languages with commas
                  </p>
                  {errors.languages && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.languages}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Experience & Qualifications Section */}
            <div>
              <div className="flex items-center mb-6">
                <AcademicCapIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Experience & Qualifications</h2>
              </div>
              
              <div className="space-y-6">
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
                      errors.experienceYears ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.experienceYears && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
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
                      errors.qualifications ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    required
                  />
                  {errors.qualifications && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.qualifications}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Teaching Philosophy Section */}
            <div>
              <div className="flex items-center mb-6">
                <LightBulbIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teaching Philosophy</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teaching Philosophy
                  </label>
                  <textarea
                    name="teachingPhilosophy"
                    value={formData.teachingPhilosophy}
                    onChange={handleInputChange}
                    placeholder="Describe your teaching approach, methodology, and how you make Islamic knowledge accessible to students..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Certifications & Awards
                  </label>
                  <textarea
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    placeholder="List any Islamic certifications, ijazahs, awards, or recognitions you have received..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
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
              </div>
            </div>

            {/* Availability & Rates Section */}
            <div>
              <div className="flex items-center mb-6">
                <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Availability & Rates</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability
                  </label>
                  <textarea
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder="Describe your available teaching hours, time zones, and preferred days for sessions..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hourly Rate (USD)
                  </label>
                  <input
                    name="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    step="5"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Set your hourly rate for one-on-one sessions with students
                  </p>
                </div>
              </div>
            </div>

            {/* Online Presence Section */}
            <div>
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Online Presence</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Social Media
                  </label>
                  <textarea
                    name="socialMedia"
                    value={formData.socialMedia}
                    onChange={handleInputChange}
                    placeholder="List your social media profiles (Twitter, Instagram, YouTube, etc.)..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div>
              <div className="flex items-center mb-6">
                <VideoCameraIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media & Verification</h2>
              </div>
              
              <div className="space-y-6">
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
                      errors.demoVideoUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload a short video demonstrating your teaching style or recitation
                  </p>
                  {errors.demoVideoUrl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
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
                          errors.photoUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.photoUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScholarProfileEditor;
