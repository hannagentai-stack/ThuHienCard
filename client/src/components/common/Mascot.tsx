import React from 'react';

export type MascotId = 'bunny_pink' | 'kitty_purple' | 'star_gold' | 'boba_mint';
export type MascotMood = 'normal' | 'happy' | 'winking' | 'shy' | 'studying';

interface MascotProps {
  id?: MascotId;
  mood?: MascotMood;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-36 h-36',
};

export const Mascot: React.FC<MascotProps> = ({
  id = 'bunny_pink',
  mood = 'normal',
  className = '',
  size = 'md',
  animate = true,
}) => {
  const sizeClass = sizeMap[size];
  const animClass = animate ? 'animate-bounce-soft' : '';

  if (id === 'kitty_purple') {
    return (
      <div className={`relative inline-block ${sizeClass} ${animClass} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Tai mèo */}
          <polygon points="20,40 32,15 45,35" fill="#C084FC" stroke="#9333EA" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="25,38 33,22 40,35" fill="#F3E8FF" />
          <polygon points="55,35 68,15 80,40" fill="#C084FC" stroke="#9333EA" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="60,35 67,22 75,38" fill="#F3E8FF" />
          {/* Đầu mèo */}
          <circle cx="50" cy="55" r="34" fill="#E9D5FF" stroke="#A855F7" strokeWidth="2.5" />
          {/* Má hồng */}
          <circle cx="32" cy="62" r="6" fill="#F472B6" opacity="0.6" />
          <circle cx="68" cy="62" r="6" fill="#F472B6" opacity="0.6" />
          {/* Mắt */}
          {mood === 'winking' ? (
            <>
              <path d="M 28 52 Q 34 46 40 52" stroke="#4C1D95" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="64" cy="52" r="4.5" fill="#4C1D95" />
              <circle cx="66" cy="50" r="1.5" fill="#FFFFFF" />
            </>
          ) : mood === 'happy' ? (
            <>
              <path d="M 28 54 Q 34 47 40 54" stroke="#4C1D95" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 60 54 Q 66 47 72 54" stroke="#4C1D95" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="34" cy="52" r="4.5" fill="#4C1D95" />
              <circle cx="36" cy="50" r="1.5" fill="#FFFFFF" />
              <circle cx="66" cy="52" r="4.5" fill="#4C1D95" />
              <circle cx="68" cy="50" r="1.5" fill="#FFFFFF" />
            </>
          )}
          {/* Mũi & Miệng */}
          <polygon points="48,58 52,58 50,61" fill="#F43F5E" />
          <path d="M 45 62 Q 50 66 55 62" stroke="#4C1D95" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Râu */}
          <line x1="16" y1="58" x2="26" y2="60" stroke="#7E22CE" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="65" x2="27" y2="64" stroke="#7E22CE" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="84" y1="58" x2="74" y2="60" stroke="#7E22CE" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="82" y1="65" x2="73" y2="64" stroke="#7E22CE" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (id === 'star_gold') {
    return (
      <div className={`relative inline-block ${sizeClass} ${animClass} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Ngôi sao vàng */}
          <polygon
            points="50,10 62,35 88,38 68,58 74,85 50,71 26,85 32,58 12,38 38,35"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Má hồng */}
          <circle cx="38" cy="55" r="4" fill="#F87171" opacity="0.7" />
          <circle cx="62" cy="55" r="4" fill="#F87171" opacity="0.7" />
          {/* Mắt */}
          <circle cx="42" cy="48" r="3.5" fill="#78350F" />
          <circle cx="43.5" cy="46.5" r="1.2" fill="#FFFFFF" />
          <circle cx="58" cy="48" r="3.5" fill="#78350F" />
          <circle cx="59.5" cy="46.5" r="1.2" fill="#FFFFFF" />
          {/* Miệng cười */}
          <path d="M 46 54 Q 50 58 54 54" stroke="#78350F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (id === 'boba_mint') {
    return (
      <div className={`relative inline-block ${sizeClass} ${animClass} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Ống hút */}
          <line x1="50" y1="10" x2="55" y2="40" stroke="#FB7185" strokeWidth="7" strokeLinecap="round" />
          {/* Cốc trà sữa */}
          <path d="M 30,35 L 70,35 L 64,85 C 64,88 60,90 50,90 C 40,90 36,88 36,85 Z" fill="#A7F3D0" stroke="#059669" strokeWidth="2.5" />
          <ellipse cx="50" cy="35" rx="20" ry="6" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
          {/* Trân châu */}
          <circle cx="42" cy="82" r="4" fill="#064E3B" />
          <circle cx="52" cy="84" r="4" fill="#064E3B" />
          <circle cx="59" cy="80" r="3.5" fill="#064E3B" />
          {/* Mắt & Miệng trên cốc */}
          <circle cx="44" cy="54" r="3" fill="#065F46" />
          <circle cx="56" cy="54" r="3" fill="#065F46" />
          <circle cx="39" cy="58" r="3" fill="#F472B6" opacity="0.6" />
          <circle cx="61" cy="58" r="3" fill="#F472B6" opacity="0.6" />
          <path d="M 47 60 Q 50 63 53 60" stroke="#065F46" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Mặc định: bunny_pink (Thỏ Sakura) 🐰
  return (
    <div className={`relative inline-block ${sizeClass} ${animClass} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Tai trái */}
        <ellipse cx="36" cy="24" rx="8" ry="22" fill="#FF8FB8" stroke="#FF5C9E" strokeWidth="2" transform="rotate(-10 36 24)" />
        <ellipse cx="36" cy="24" rx="4" ry="14" fill="#FFF0F5" transform="rotate(-10 36 24)" />
        {/* Tai phải */}
        <ellipse cx="64" cy="24" rx="8" ry="22" fill="#FF8FB8" stroke="#FF5C9E" strokeWidth="2" transform="rotate(10 64 24)" />
        <ellipse cx="64" cy="24" rx="4" ry="14" fill="#FFF0F5" transform="rotate(10 64 24)" />
        {/* Đầu thỏ */}
        <circle cx="50" cy="58" r="32" fill="#FFFFFF" stroke="#FF8FB8" strokeWidth="2.5" />
        {/* Má hồng phấn */}
        <circle cx="30" cy="66" r="6" fill="#FFA8CA" opacity="0.8" />
        <circle cx="70" cy="66" r="6" fill="#FFA8CA" opacity="0.8" />
        {/* Mắt */}
        {mood === 'winking' ? (
          <>
            <path d="M 33 54 Q 38 48 43 54" stroke="#4A1528" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="62" cy="54" r="4.5" fill="#4A1528" />
            <circle cx="64" cy="52" r="1.5" fill="#FFFFFF" />
          </>
        ) : mood === 'happy' ? (
          <>
            <path d="M 33 56 Q 38 49 43 56" stroke="#4A1528" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 57 56 Q 62 49 67 56" stroke="#4A1528" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : mood === 'studying' ? (
          <>
            <circle cx="38" cy="54" r="5" fill="#4A1528" />
            <circle cx="40" cy="52" r="2" fill="#FFFFFF" />
            <circle cx="62" cy="54" r="5" fill="#4A1528" />
            <circle cx="64" cy="52" r="2" fill="#FFFFFF" />
            {/* Kính ngộ nghĩnh */}
            <circle cx="38" cy="54" r="9" stroke="#FF5C9E" strokeWidth="1.8" fill="none" opacity="0.8" />
            <circle cx="62" cy="54" r="9" stroke="#FF5C9E" strokeWidth="1.8" fill="none" opacity="0.8" />
            <line x1="47" y1="54" x2="53" y2="54" stroke="#FF5C9E" strokeWidth="1.8" />
          </>
        ) : (
          <>
            <circle cx="38" cy="54" r="4.5" fill="#4A1528" />
            <circle cx="40" cy="52.5" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="54" r="4.5" fill="#4A1528" />
            <circle cx="64" cy="52.5" r="1.5" fill="#FFFFFF" />
          </>
        )}
        {/* Mũi & Miệng thỏ */}
        <ellipse cx="50" cy="62" rx="2" ry="1.5" fill="#FF5C9E" />
        <path d="M 46 64 Q 50 67 54 64" stroke="#4A1528" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Hoa anh đào nhỏ trên tai */}
        <circle cx="68" cy="38" r="3.5" fill="#FF5C9E" />
        <circle cx="68" cy="38" r="1.5" fill="#FEF08A" />
      </svg>
    </div>
  );
};
