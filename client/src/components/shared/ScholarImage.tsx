import React, { useState } from 'react';

interface ScholarImageProps {
  src?: string;
  alt: string;
  className?: string;
}

const ScholarImage: React.FC<ScholarImageProps> = ({ 
  src, 
  alt, 
  className = "h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-900"
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // If there's no src or image failed to load, use placeholder
  if (!src || imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800`}>
        <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
          {alt.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      style={{ 
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default ScholarImage;
