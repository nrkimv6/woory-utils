import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Bus, Coffee, Clock } from 'lucide-react';
import { addMinutes, differenceInMinutes } from 'date-fns';
const BRIDGE_TYPES = {
  TRANSPORT: 'TRANSPORT',
  REST: 'REST',
  GENERIC: 'GENERIC'
} ;

const TimeBridge = ({ 
  id, 
  name, 
  duration, 
  type, 
  location, 
  startTime,
  isSelected,
  onClick,
  index = 0,
  total = 1,
  slotHeight,
  slotInterval
}) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `bridge-${id}`,
    data: {
      type: 'bridge',
      id
    }
  });

  // 타입에 따른 아이콘 선택
  const getIcon = () => {
    switch (type) {
      case 'TRANSPORT':
        return <Bus className="w-4 h-4" />;
      case 'REST':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate position and height based on time
  const start = new Date(startTime);
  const end = addMinutes(start, duration);
  const heightInSlots = Math.ceil(duration / slotInterval);
  const heightInPixels = heightInSlots * slotHeight;

  // Calculate horizontal position based on index and total bridges
  const horizontalGap = 100 / (total + 1);
  const leftPosition = `${horizontalGap * (index + 1)}%`;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute left-[80px] right-[20px]"
      style={{
        height: `${heightInPixels}px`,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.({ id, type: 'bridge' });
      }}
    >
      {/* Vertical dashed line */}
      <div 
        className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-300"
        style={{ left: leftPosition }}
      />
      
      {/* Content card */}
      <div 
        className={`
          absolute p-2 -translate-x-1/2 bg-white rounded-sm shadow-sm
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
        `}
        style={{ 
          left: leftPosition,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-gray-500">{duration}분</div>
            {location && (
              <div className="text-xs text-gray-500">{location}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeBridge;