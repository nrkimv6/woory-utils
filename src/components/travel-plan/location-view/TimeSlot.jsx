import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text, Group } from '@mantine/core';
import { format } from 'date-fns';
import { useDroppable, useDndContext,
  MeasuringStrategy } from '@dnd-kit/core';
import { ZOOM_LEVELS } from '../types';

export const CollapsedRangeState = {
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
  USER_EXPANDED: 'user-expanded' // 사용자가 명시적으로 확장한 상태
};

export const TimeSlot = React.memo(function TimeSlot({
  time,
  zoomLevel,
  isCollapsed,
  onToggleCollapse,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${time.getTime()}`
  });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onToggleCollapse(time.getHours())}
      className={`
          relative
          ${isOver ? 'bg-blue-50' : ''}
          transition-all duration-200
        `}
      style={{
        height: isCollapsed ? '30px' : ZOOM_LEVELS[zoomLevel].height,
        borderBottom: '1px dashed #ddd',
        cursor: 'pointer',
        zIndex: 1
      }}
    >
      <Group position="apart" spacing="xs" className="absolute left-0 top-0 w-[70px]">
        <Text size="sm" weight={500} color="dimmed">
          {format(time, 'HH:mm')}
        </Text>
      </Group>
      <div className="relative ml-[80px] h-full">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200" />
      </div>
    </div>
  );
});

export const CollapsedTimeRange = ({ startHour, endHour, onExpand, rangeState }) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `collapsed-${startHour}-${endHour}`,
    data: {
      type: 'collapsed-range',
      startHour,
      endHour
    },
    // 드롭 가능 영역 설정 추가
    strategy: MeasuringStrategy.Always,
    disabled: false
  });

  useEffect(() => {
    console.log('CollapsedTimeRange ref mounted:', {
      id: `collapsed-${startHour}-${endHour}`,
      node: setNodeRef.current
    });
  }, []);
  const [dragOverTimer, setDragOverTimer] = useState(null);

  // USER_EXPANDED 상태일 때는 렌더링하지 않음
  if (rangeState === CollapsedRangeState.USER_EXPANDED) {
    return null;
  }
  //  const { active2 } = useDndContext();

  // console.log('CollapsedTimeRange state:', {
  //   isOver,
  //   active,
  //   startHour,
  //   endHour,
  //   dragOverTimer
  // });

 useEffect(() => {
    if (isOver) {
      console.log('DragonOver detected in CollapsedTimeRange:', {
        startHour,
        endHour,
        activeId: active?.id,
        isOver
      });
    }
  }, [isOver, active, startHour, endHour]);

  // useEffect(() => {
  //   // active가 있고 isOver가 true일 때만 타이머 시작
  //   console.log('active ' + active);
  //   if (isOver && active && !dragOverTimer) {
  //     console.log('Starting timer for range:', startHour, '-', endHour);
  //     const timer = setTimeout(() => {
  //       onExpand(startHour, endHour);
  //     }, 1000);
  //     setDragOverTimer(timer);
  //   }

  //   if (!isOver && dragOverTimer) {
  //     clearTimeout(dragOverTimer);
  //     setDragOverTimer(null);
  //   }

  //   return () => {
  //     if (dragOverTimer) {
  //       clearTimeout(dragOverTimer);
  //     }
  //   };
  // }, [isOver, active, dragOverTimer]);
  useEffect(() => {
    console.log('active ' + active);

    if (isOver && active) {
      console.log('DragonOver detected:', {
        startHour,
        endHour,
        activeId: active.id
      });

      if (!dragOverTimer) {
        const timer = setTimeout(() => {
          onExpand(startHour, endHour);
          setDragOverTimer(null);
        }, 1000);
        setDragOverTimer(timer);
      }
    } else if (!isOver && dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    return () => {
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }
    };
  }, [isOver, active, startHour, endHour, onExpand]);

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('CollapsedTimeRange mounted:', {
      id: `collapsed-${startHour}-${endHour}`,
      startHour,
      endHour
    });
    
  // useEffect(() => {
  //   const element = document.querySelector(`[data-droppable-id="collapsed-${startHour}-${endHour}"]`);
  //   console.log('DroppableElement:', {
  //     id: `collapsed-${startHour}-${endHour}`,
  //     exists: !!element,
  //     element
  //   });
  // }, [startHour, endHour]);


    return () => {
      console.log('CollapsedTimeRange unmounted:', {
        id: `collapsed-${startHour}-${endHour}`
      });
    };
  }, [startHour, endHour]);

  // Droppable 상태 변화 감지
  useEffect(() => {
    console.log('Droppable state changed:', {
      id: `collapsed-${startHour}-${endHour}`,
      isOver,
      active: active?.id
    });
  }, [isOver, active, startHour, endHour]);

return (
    <div
      ref={setNodeRef}
      onClick={() => onExpand(startHour, endHour)}
      className={`
        relative
        ${isOver ? 'bg-blue-100' : 'bg-gray-50'}
        transition-all duration-200
        cursor-pointer
        hover:bg-blue-50
      `}
      style={{
        height: '40px',
        margin: '0px 0',
        borderBottom: '1px dashed #ddd',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        zIndex: isOver ? 20 : 10,
        // outline: isOver ? '2px solid blue' : 'none',
        border: isOver ? '2px solid yellow' : '1px solid transparent'
      }}
    >
      {/* 드롭 영역이 시각적으로 보이도록 */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundColor: isOver ? 'rgba(0,0,255,0.1)' : 'transparent',
          border: '2px dashed transparent',
          borderColor: isOver ? 'orange' : 'transparent'
        }}
      />
      <Group position="apart" style={{ width: '100%' }}>
        <Text size="sm" color="dimmed">
          {`${String(startHour).padStart(2, '0')}:00`}
        </Text>
        <Text size="sm" color="dimmed">...</Text>
        <Text size="sm" color="dimmed">
          {`${String(endHour).padStart(2, '0')}:00`}
        </Text>
      </Group>
    </div>
  );
};