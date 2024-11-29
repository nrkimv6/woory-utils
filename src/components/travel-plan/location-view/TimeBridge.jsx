import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Bus, Coffee, Clock } from 'lucide-react';
import { addMinutes, differenceInMinutes } from 'date-fns';
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
  slotInterval,
  style,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `bridge-${id}`,
    data: {
      type: 'bridge',
      id
    },
    disabled: !isSelected // 선택된 상태에서만 드래그 가능
  });

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

  return (
    <div ref={setNodeRef} {...(isSelected ? { ...listeners, ...attributes } : {})}>
      <div 
        style={{
          ...style,
          backgroundColor: 'transparent',
          cursor: isSelected ? 'grab' : 'pointer' // 선택된 상태에서만 grab 커서
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick({ id, type: 'bridge', name, duration });
        }}
      >
        <div className={`absolute h-full border-l border-dashed ${isSelected ? 'border-blue-500' : 'border-gray-300'}`} 
             style={{ left: '50%' }} />
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'bg-blue-50' : 'bg-white'} px-3 py-2 shadow-sm rounded ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500">{duration}분</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TimeBridge;