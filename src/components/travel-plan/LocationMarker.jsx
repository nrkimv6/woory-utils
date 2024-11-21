import React from 'react';

const LocationMarker = ({ index, isEvent, color, onClick }) => {
  const markerText = isEvent ? String.fromCharCode(65 + index) : (index + 1).toString();
  
  const darkenColor = (color, amount = 0.2) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const darkerR = Math.floor(r * (1 - amount));
    const darkerG = Math.floor(g * (1 - amount));
    const darkerB = Math.floor(b * (1 - amount));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Inter 폰트 import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');
      `}</style>
      
      <div 
        onClick={onClick}
        className="relative cursor-pointer group"
        style={{ 
          width: '32px',
          height: '48px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        <div
          className="absolute w-full h-full"
          style={{
            background: color,
            clipPath: 'polygon(50% 100%, 0 60%, 0 0, 100% 0, 100% 60%)',
            transition: 'all 0.2s ease',
          }}
        >
          <div 
            className={`absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 
              flex items-center justify-center
              bg-white
              ${isEvent ? 'rounded' : 'rounded-full'}`}
            style={{
              color: darkenColor(color, 0.35), // 텍스트를 좀 더 어둡게
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
              fontSize: '12px', // 크기를 약간 줄임
              fontWeight: '600',
              letterSpacing: '-0.01em',
              transform: 'translateY(-1px)', // 시각적 중앙 정렬을 위한 미세 조정
            }}
          >
            {markerText}
          </div>
          
          {/* Inner Shadow - 더 강한 그림자 효과 */}
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              background: 'linear-gradient(145deg, transparent 0%, rgba(0,0,0,0.5) 100%)',
            }}
          />
          
          {/* Highlight - 더 선명한 하이라이트 */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, transparent 65%)',
            }}
          />
        </div>

        <style jsx>{`
          .group:hover > div {
            transform: scale(1.1) translateY(-2px);
            filter: brightness(1.05);
          }
        `}</style>
      </div>
    </>
  );
};

export default LocationMarker;