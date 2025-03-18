import { useState } from 'react';

const ImageWithSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative  bg-gray-200">
      {/* 스켈레톤 UI */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-300"></div>}

      {/* 실제 이미지 */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} rounded-md`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default ImageWithSkeleton;
