import React, { useEffect, useRef } from 'react';

interface ShinyTextProps {
  text: string;
  fontSize?: string;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  fontSize = '3.2rem',
  className = ''
}) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Animate the shine effect
    let animationFrame: number;
    let startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000; // in seconds
      const progress = (elapsed % 3) / 3; // 3 second loop
      const position = progress * 200 - 50; // -50% to 150%

      element.style.backgroundPosition = `${position}% center`;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div
      ref={textRef}
      className={`shiny-text ${className}`}
      style={{ fontSize }}
    >
      {text}
    </div>
  );
};
