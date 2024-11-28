import React from 'react';
import { Card, Text, Group } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import { Bus, Coffee, Clock } from 'lucide-react';


// TimeBridge 타입 정의
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
  total = 1
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

  // Calculate position based on index and total bridges
  const leftPosition = total === 1 ? '50%' : `${(index + 1) * (100 / (total + 1))}%`;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative w-full h-full"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
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
          absolute p-2 -translate-x-1/2 bg-white rounded-sm
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
        `}
        style={{ 
          left: leftPosition,
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        onClick={() => onClick?.({ id, type: 'bridge' })}
      >
        <Group spacing="xs" noWrap>
          {getIcon()}
          <div>
            <Text size="sm" weight={500}>{name}</Text>
            <Text size="xs" color="dimmed">{duration}분</Text>
            {location && <Text size="xs" color="dimmed">{location}</Text>}
          </div>
        </Group>
      </div>
    </div>
  );
};

export default TimeBridge;