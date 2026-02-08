import React, { useEffect, useRef } from 'react';

interface FuzzyTextProps {
  text: string;
  baseIntensity?: number;
  hoverIntensity?: number;
  enableHover?: boolean;
  fontSize?: string;
  className?: string;
}

export const FuzzyText: React.FC<FuzzyTextProps> = ({
  text,
  baseIntensity = 0.2,
  hoverIntensity = 0.5,
  enableHover = false,
  fontSize = '3rem',
  className = ''
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const intensity = enableHover && isHovered ? hoverIntensity : baseIntensity;
    const blur = intensity * 4;
    const spread = intensity * 2;

    element.style.textShadow = `
      0 0 ${blur}px rgba(255, 255, 255, ${intensity}),
      0 0 ${spread}px rgba(0, 231, 255, ${intensity * 0.8}),
      0 0 ${spread * 1.5}px rgba(0, 231, 1, ${intensity * 0.6})
    `;
  }, [isHovered, baseIntensity, hoverIntensity, enableHover]);

  return (
    <div
      ref={textRef}
      className={`fuzzy-text ${className}`}
      style={{ fontSize }}
      onMouseEnter={() => enableHover && setIsHovered(true)}
      onMouseLeave={() => enableHover && setIsHovered(false)}
    >
      {text}
    </div>
  );
};
