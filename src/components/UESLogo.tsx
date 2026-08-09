import React from 'react';
import { ASSETS } from '../assets';

interface UESLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
}

export const UESLogo: React.FC<UESLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  textColor = 'text-[#2D0A0C]'
}) => {
  const sizeMap = {
    sm: { imgSize: 'h-7 w-7', text: 'text-xs' },
    md: { imgSize: 'h-9 w-9', text: 'text-sm' },
    lg: { imgSize: 'h-12 w-12', text: 'text-base' },
    xl: { imgSize: 'h-14 w-14', text: 'text-lg' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Logo Mark: JPEG Image */}
      <img
        src={ASSETS.logo.jpeg}
        alt="UES Logo"
        className={`${dim.imgSize} object-contain rounded-lg shrink-0 transition-transform duration-300 hover:scale-105 shadow-2xs`}
      />

      {/* Clean Tagline beside logo mark */}
      {showText && size !== 'sm' && (
        <div className="flex flex-col justify-center leading-tight border-l border-[#B03A40]/20 pl-2.5">
          <span className={`font-black tracking-tight ${dim.text} ${textColor}`}>
            Undergraduate Economics
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#B03A40]">
            Society
          </span>
        </div>
      )}
    </div>
  );
};

