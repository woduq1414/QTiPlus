import { useState } from 'react';

const ImageWithSkeleton = ({
  src,
  alt,
  doubleConType = -1,
}: {
  src: string;
  alt: string;
  doubleConType: number | undefined;
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative  ">
      {/* 스켈레톤 UI */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-300"></div>}

      {/* 실제 이미지 */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} 
        ${doubleConType === 0 ? 'rounded-tl-md rounded-bl-md' : ''}
        ${doubleConType === 1 ? 'rounded-tr-md rounded-br-md' : ''}
        ${doubleConType === -1 ? 'rounded-md' : ''}
        
        `}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default ImageWithSkeleton;
