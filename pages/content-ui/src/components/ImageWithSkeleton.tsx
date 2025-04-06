import { useEffect, useState, useRef } from 'react';

const ImageWithSkeleton = ({
  src,
  alt,

  doubleConType = -1,
  maxRetries = 5,
  retryDelay = 2000,

  setIsImageLoaded,
}: {
  src: string | undefined;
  alt: string | undefined;

  doubleConType: number | undefined;
  maxRetries?: number;
  retryDelay?: number;

  setIsImageLoaded?: (isImageLoaded: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [displaySrc, setDisplaySrc] = useState<string | undefined>(src);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 이미지 로드 함수
  const loadImage = () => {
    if (!currentSrc) {
      setError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    // 이전 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 이전 이미지 객체 정리
    if (imgRef.current) {
      imgRef.current.onload = null;
      imgRef.current.onerror = null;
    }

    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      setIsLoading(false);
      setRetryCount(0);
      setError(false);
      if (setIsImageLoaded) {
        setIsImageLoaded(true);
      }
    };

    img.onerror = () => {
      if (retryCount < maxRetries) {
        const delay = retryDelay * retryCount;

        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
      } else {
        setError(true);
        setIsLoading(false);
      }
    };

    // 재시도 시 타임스탬프를 쿼리스트링에 추가하여 캐시 문제 해결
    let imageSrc = currentSrc;
    if (retryCount > 0) {
      const timestamp = new Date().getTime();
      const separator = currentSrc.includes('?') ? '&' : '?';
      imageSrc = `${currentSrc}${separator}t=${timestamp}`;
    }

    // displaySrc 상태 업데이트
    setDisplaySrc(imageSrc);
    img.src = imageSrc;
  };

  // src 변경 시 이미지 다시 로드
  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    loadImage();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  // 재시도 횟수 변경 시 이미지 다시 로드
  useEffect(() => {
    if (retryCount > 0) {
      loadImage();
    }
  }, [retryCount]);

  return (
    <div className="relative w-full h-full">
      {/* 스켈레톤 UI */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-300"></div>}

      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        className={`object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} 
        ${doubleConType === 0 ? 'rounded-tl-md rounded-bl-md' : ''}
        ${doubleConType === 1 ? 'rounded-tr-md rounded-br-md' : ''}
        ${doubleConType === -1 ? 'rounded-md' : ''}
        ${error ? 'hidden' : ''}
        `}
      />
    </div>
  );
};

export default ImageWithSkeleton;
