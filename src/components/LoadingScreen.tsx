import React, { useEffect, useState } from 'react';
import { FuzzyText } from './FuzzyText';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading with progress
    const duration = 2500; // 2.5 seconds
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <FuzzyText
          text="PLINKO"
          baseIntensity={0.2}
          hoverIntensity={0.5}
          enableHover={false}
          fontSize="5rem"
          className="loading-title"
        />
        <FuzzyText
          text="Welcome to Plinko! Preparing your drops..."
          baseIntensity={0.15}
          hoverIntensity={0.3}
          enableHover={false}
          fontSize="1.2rem"
          className="loading-subtitle"
        />
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};
