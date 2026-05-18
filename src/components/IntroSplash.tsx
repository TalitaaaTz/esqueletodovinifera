import { useState, useRef, useEffect } from 'react';

interface IntroSplashProps {
  onComplete: () => void;
}

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        setShowLogo(true);
      }
    };

    const handleEnded = () => {
      setFadeOut(true);
      setTimeout(() => onComplete(), 600);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        className={`w-full h-full transition-all duration-700 ${
          showLogo ? 'object-contain' : 'object-cover object-bottom'
        }`}
        style={{ filter: 'brightness(0.85) contrast(1.4)' }}
      />
    </div>
  );
};

export default IntroSplash;
