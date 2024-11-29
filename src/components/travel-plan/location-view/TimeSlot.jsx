import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
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

  const [dragOverTimer, setDragOverTimer] = useState(null);
  const formattedTime = format(time, 'HH:mm');

  const handleDragOver = useCallback((e) => {
    if (!dragOverTimer && isCollapsed) {
      const timer = setTimeout(() => {
        onToggleCollapse(time.getHours());
      }, 1000);
      setDragOverTimer(timer);
    }
  }, [dragOverTimer, isCollapsed, onToggleCollapse, time]);

  const handleDragLeave = useCallback(() => {
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }
  }, [dragOverTimer]);

  useEffect(() => {
    return () => {
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }
    };
  }, [dragOverTimer]);

  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${time.getTime()}`
  });


  return (
    <div
      ref={setNodeRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
          {formattedTime}
        </Text>
      </Group>
      <div className="relative ml-[80px] h-full">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200" />
      </div>
    </div>
  );
});

export const CollapsedTimeRange = ({ startHour, endHour, onExpand, rangeState }) => {
  const [expandTimer, setExpandTimer] = useState(null);
  const { setNodeRef, isOver } = useDroppable({
    id: `collapsed-${startHour}-${endHour}`
  });

  // USER_EXPANDED 상태일 때는 렌더링하지 않음
  if (rangeState === CollapsedRangeState.USER_EXPANDED) {
    return null;
  }

  useEffect(() => {
    if (isOver && !expandTimer) {
      // 드래그 아이템이 hover 상태로 1초 이상 머무르면 expand
      const timer = setTimeout(() => {
        onExpand(startHour, endHour);
      }, 1000);
      setExpandTimer(timer);
    } else if (!isOver && expandTimer) {
      // hover 상태가 해제되면 타이머 제거
      clearTimeout(expandTimer);
      setExpandTimer(null);
    }

    return () => {
      if (expandTimer) {
        clearTimeout(expandTimer);
      }
    };
  }, [isOver, expandTimer, startHour, endHour, onExpand]);

  return (
    <div
      ref={setNodeRef}
      onClick={() => onExpand(startHour, endHour)}
      style={{
        height: '40px',
        margin: '0px 0',
        borderBottom: '1px dashed #ddd',
        backgroundColor: isOver ? '#e9ecef' : '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        padding: '0 10px',
        transition: 'all 0.2s ease',
        transform: isOver ? 'scale(1.01)' : 'scale(1)',
      }}
    >
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