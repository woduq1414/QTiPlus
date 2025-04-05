import { useEffect, useState } from 'react';

const ImageWithSkeleton = ({
  src,
  alt,
  doubleConType = -1,
}: {
  src: string | undefined;
  alt: string | undefined;
  doubleConType: number | undefined;
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const img = new Image();
    img.src = src || '';
    img.onload = () => setIsLoading(false);

    return () => {
      img.onload = null;
    };
  }, [src]);
  return (
    <div className="relative  w-full h-full">
      {/* 스켈레톤 UI */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-300"></div>}

      <img
        src={src}
        alt={alt}
        className={` object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} 
        ${doubleConType === 0 ? 'rounded-tl-md rounded-bl-md' : ''}
        ${doubleConType === 1 ? 'rounded-tr-md rounded-br-md' : ''}
        ${doubleConType === -1 ? 'rounded-md' : ''}
        
        `}
      />
    </div>
  );
};

export default ImageWithSkeleton;
