import React from 'react';
import '@/styles/LocationMarker.css'  // 상단에 추가
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

 const markerPath = "M17 50L2 17.5C2 8.4 8.4 2 17 2s15 6.4 15 15.5L17 50z";

 return (
   <div 
     onClick={onClick}
     style={{ 
       width: '34px',
       height: '50px',
       position: 'relative',
       cursor: 'pointer',
       transition: 'transform 0.2s',
       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
     }}
     onMouseEnter={e => {
       e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
     }}
     onMouseLeave={e => {
       e.currentTarget.style.transform = 'scale(1) translateY(0)';
     }}
   >
     {/* Border layer */}
     <div
       style={{
         position: 'absolute',
         width: '100%',
         height: '100%',
         clipPath: `path("${markerPath}")`,
         background: darkenColor(color, 0.3),
         transform: 'scale(1.04)',
       }}
     />
     
     {/* Main marker */}
     <div
       style={{
         position: 'absolute',
         width: '100%',
         height: '100%',
         clipPath: `path("${markerPath}")`,
         background: color,
         border: `1.5px solid ${darkenColor(color, 0.3)}`,
         boxSizing: 'border-box',
       }}
     >
       {/* Center circle */}
       <div 
         style={{
           position: 'absolute',
           top: '4px',
           left: '50%',
           transform: 'translateX(-50%)',
           width: '22px',
           height: '22px',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           background: 'white',
           borderRadius: '50%',
           color: darkenColor(color, 0.4),
           fontFamily: 'Inter, system-ui',
           fontSize: '12px',
           fontWeight: '600',
           border: `1.5px solid ${darkenColor(color, 0.3)}`,
           boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
         }}
       >
         {markerText}
       </div>
       
       {/* Gradient effect */}
       <div 
         style={{
           position: 'absolute',
           inset: 0,
           background: 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)',
           clipPath: `path("${markerPath}")`,
         }}
       />
     </div>

     <link
       href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap"
       rel="stylesheet"
     />
   </div>
 );
};

export default LocationMarker;