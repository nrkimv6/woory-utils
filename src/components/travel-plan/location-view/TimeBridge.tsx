import React from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Clock, Bus, Coffee } from 'lucide-react';

// TimeBridge 타입 정의
const BRIDGE_TYPES = {
  TRANSPORT: 'TRANSPORT',
  REST: 'REST',
  GENERIC: 'GENERIC'
} as const;

// TimeBridge 속성 인터페이스
interface TimeBridgeProps {
  id: string;
  name: string;
  duration: number; // minutes
  type: keyof typeof BRIDGE_TYPES;
  location?: string;
  startTime: string;
  // endTime: string;
  onDrop?: (id: string) => void;
}

const TimeBridge: React.FC<TimeBridgeProps> = ({
  id,
  name,
  duration,
  type,
  location,
  startTime,
  // endTime,
  onDrop
}) => {
  // 드롭 영역 설정
  const {isOver, setNodeRef} = useDroppable({
    id: `bridge-${id}`,
    data: {
      type: 'bridge',
      id
    }
  });

  const endTime='00:00';

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

  return (
    <div 
      ref={setNodeRef}
      className={`
        relative w-full min-h-24 px-4 
        ${isOver ? 'bg-blue-50' : 'bg-transparent'}
      `}
    >
      {/* 세로 점선 */}
      <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-300" />
      
      {/* 라벨 컨테이너 */}
      <div className="
        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        bg-white p-2 rounded-lg shadow-sm border border-gray-200
      ">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium text-sm">{name}</span>
        </div>
        
        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
          <div>{duration} minutes</div>
          {location && <div>{location}</div>}
          <div>{startTime} - {endTime}</div>
        </div>
      </div>
    </div>
  );
};

// // 사용 예시를 위한 컨테이너 컴포넌트
// const TimelineContainer = () => {
//   const handleDragEnd = (event: { over: any; }) => {
//     const {over} = event;
//     if (over) {
//       console.log('Dropped on:', over.id);
//     }
//   };

//   return (
//     <DndContext 
//       modifiers={[restrictToVerticalAxis]}
//       onDragEnd={handleDragEnd}
//     >
//       <div className="w-full max-w-md mx-auto space-y-4 p-4">
//         <TimeBridge
//           id="bridge-1"
//           name="Bus to Station"
//           duration={30}
//           type="TRANSPORT"
//           location="Central Station"
//           startTime="09:00"
//           endTime="09:30"
//         />
        
//         <TimeBridge
//           id="bridge-2"
//           name="Coffee Break"
//           duration={15}
//           type="REST"
//           location="Cafe"
//           startTime="10:00"
//           endTime="10:15"
//         />
//       </div>
//     </DndContext>
//   );
// };

// export default TimelineContainer;

export default TimeBridge;