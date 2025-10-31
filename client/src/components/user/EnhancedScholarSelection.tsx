import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { getScholars } from '../../services/scholarService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ScholarImage from '../shared/ScholarImage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Scholar {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  bio: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  qualifications: string;
  photoUrl?: string;
  approved: boolean;
  teachingPhilosophy?: string;
  availability?: string;
  hourlyRate: number;
  monthlyRate: number;
  certifications?: string;
  achievements?: string;
  socialMedia?: string;
  website?: string;
  country?: string;
  timezone?: string;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  totalSessions: number;
  isActive: boolean;
  isVerified: boolean;
  subscriptionPlans: Array<{
    name: string;
    price: number;
    duration: 'monthly' | 'quarterly' | 'yearly';
    features: string[];
    isActive: boolean;
  }>;
}

interface EnhancedScholarSelectionProps {
  onScholarSelect?: (scholar: Scholar) => void;
}

const EnhancedScholarSelection: React.FC<EnhancedScholarSelectionProps> = ({ onScholarSelect }) => {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);

  useEffect(() => {
    loadScholars();
    loadFavorites();
  }, []);

  const loadScholars = async () => {
    try {
      setLoading(true);
      const response = await getScholars();
      setScholars(response || []);
    } catch (error) {
      console.error('Failed to load scholars:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favoriteScholars');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const toggleFavorite = (scholarId: string) => {
    const newFavorites = favorites.includes(scholarId)
      ? favorites.filter(id => id !== scholarId)
      : [...favorites, scholarId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteScholars', JSON.stringify(newFavorites));
  };

  const filteredScholars = scholars.filter(scholar => {
    const matchesSearch = scholar.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialization = specializationFilter === 'all' || 
                                  scholar.specializations.includes(specializationFilter);
    
    const matchesCountry = countryFilter === 'all' || scholar.country === countryFilter;
    
    const matchesRate = rateFilter === 'all' || 
                       (rateFilter === 'low' && scholar.hourlyRate < 50) ||
                       (rateFilter === 'medium' && scholar.hourlyRate >= 50 && scholar.hourlyRate < 100) ||
                       (rateFilter === 'high' && scholar.hourlyRate >= 100);
    
    const matchesRating = ratingFilter === 'all' ||
                         (ratingFilter === 'excellent' && scholar.averageRating >= 4.5) ||
                         (ratingFilter === 'good' && scholar.averageRating >= 4.0 && scholar.averageRating < 4.5) ||
                         (ratingFilter === 'average' && scholar.averageRating >= 3.0 && scholar.averageRating < 4.0);
    
    const matchesAvailability = availabilityFilter === 'all' ||
                               (availabilityFilter === 'available' && scholar.isActive) ||
                               (availabilityFilter === 'busy' && !scholar.isActive);

    return matchesSearch && matchesSpecialization && matchesCountry && matchesRate && matchesRating && matchesAvailability;
  });

  const sortedScholars = [...filteredScholars].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'price-low':
        return a.hourlyRate - b.hourlyRate;
      case 'price-high':
        return b.hourlyRate - a.hourlyRate;
      case 'students':
        return b.totalStudents - a.totalStudents;
      case 'experience':
        return b.experienceYears - a.experienceYears;
      default:
        return 0;
    }
  });

  const getSpecializations = () => {
    const allSpecs = scholars.flatMap(s => s.specializations);
    return [...new Set(allSpecs)];
  };

  const getCountries = () => {
    const allCountries = scholars.map(s => s.country).filter(Boolean);
    return [...new Set(allCountries)];
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Find Your Perfect Scholar</h2>
          <p className="text-gray-600 dark:text-gray-400">Connect with verified Islamic scholars for personalized learning</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="h-1 bg-gray-400 rounded"></div>
                <div className="h-1 bg-gray-400 rounded"></div>
                <div className="h-1 bg-gray-400 rounded"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search scholars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Specialization Filter */}
          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Specializations</option>
            {getSpecializations().map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Countries</option>
            {getCountries().map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* Rate Filter */}
          <select
            value={rateFilter}
            onChange={(e) => setRateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Rates</option>
            <option value="low">Under $50/hr</option>
            <option value="medium">$50-100/hr</option>
            <option value="high">$100+/hr</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Ratings</option>
            <option value="excellent">4.5+ Stars</option>
            <option value="good">4.0+ Stars</option>
            <option value="average">3.0+ Stars</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="students">Most Students</option>
            <option value="experience">Most Experience</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {sortedScholars.length} of {scholars.length} scholars
        </p>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filters applied</span>
        </div>
      </div>

      {/* Scholars Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedScholars.map((scholar) => (
            <Card key={scholar._id} className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Scholar Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <ScholarImage
                      src={scholar.photoUrl}
                      alt={scholar.user.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{scholar.user.name}</h3>
                      <div className="flex items-center">
                        {scholar.isVerified && (
                          <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-1" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {scholar.country || 'Global'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => toggleFavorite(scholar._id)}
                    variant="ghost"
                    className={`p-2 rounded-full transition-colors ${
                      favorites.includes(scholar._id)
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <HeartIcon className={`h-5 w-5 ${favorites.includes(scholar._id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {renderStars(scholar.averageRating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {scholar.averageRating.toFixed(1)} ({scholar.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ${scholar.hourlyRate}/hr
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {scholar.totalStudents} students
                    </div>
                    <div className="mt-2">
                      <Link
                        to={`/scholars/${scholar._id}/reviews`}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                      >
                        See All Reviews
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {scholar.specializations.slice(0, 3).map((spec, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                  {scholar.specializations.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      +{scholar.specializations.length - 3}
                    </span>
                  )}
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {scholar.bio}
                </p>

                {/* Actions */}
                {user?.role !== 'scholar' && (
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/scholar/${scholar._id}`}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                    <Button
                      onClick={() => setSelectedScholar(scholar)}
                      variant="outline"
                      className="flex items-center"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedScholars.map((scholar) => (
            <Card key={scholar._id} className="rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <ScholarImage
                    src={scholar.photoUrl}
                    alt={scholar.user.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{scholar.user.name}</h3>
                      {scholar.isVerified && (
                        <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center">
                        {renderStars(scholar.averageRating)}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {scholar.averageRating.toFixed(1)} ({scholar.totalReviews})
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {scholar.country || 'Global'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {scholar.totalStudents} students
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/scholars/${scholar._id}/reviews`}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                        >
                          See All Reviews
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Right actions (hidden for scholars) */}
                  {user?.role !== 'scholar' && (
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/scholar/${scholar._id}`}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 inline mr-2" /> View Profile
                      </Link>
                      <Button
                        onClick={() => setSelectedScholar(scholar)}
                        variant="outline"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" /> Chat
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedScholar} onOpenChange={() => setSelectedScholar(null)}>
        <DialogContent className="sm:max-w-2xl">
      {selectedScholar && (
            <>
              <DialogHeader>
                <DialogTitle>Quick Scholar Info</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <ScholarImage
                    src={selectedScholar.photoUrl}
                    alt={selectedScholar.user.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-lg font-semibold">{selectedScholar.user.name}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        {renderStars(selectedScholar.averageRating)}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {selectedScholar.averageRating.toFixed(1)} ({selectedScholar.totalReviews} reviews)
                        </span>
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ${selectedScholar.hourlyRate}/hr
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Specializations</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedScholar.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Bio</h5>
                  <p className="text-sm text-muted-foreground">{selectedScholar.bio}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Experience</h5>
                    <p className="text-sm text-muted-foreground">{selectedScholar.experienceYears} years</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Students</h5>
                    <p className="text-sm text-muted-foreground">{selectedScholar.totalStudents} students</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedScholar(null)}>Close</Button>
                <Link to={`/scholar/${selectedScholar._id}`} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">View Full Profile</Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedScholarSelection;
