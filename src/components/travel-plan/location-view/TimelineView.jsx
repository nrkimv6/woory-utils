import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
// import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { DndContext } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import TimeCard from './TimeCard'
import TimeBridge from './TimeBridge'
import { cleanReactStructure } from '@/util/jsfunc'

const ZOOM_LEVELS = {
  1: { interval: 60, height: 80 },
  2: { interval: 30, height: 60 },
  3: { interval: 15, height: 40 },
  4: { interval: 10, height: 30 }
};
const TimeSlot = React.memo(function TimeSlot({
  time, zoomLevel,
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
        cursor: 'pointer'
      }}
    >
      <Group position="apart" spacing="xs" className="absolute left-0 top-0 w-[70px]">
        <Text size="sm" weight={500} color="dimmed">
          {formattedTime}
        </Text>
      </Group>

      {/* 시간 슬롯의 그리드 라인 */}
      <div className="relative ml-[80px] h-full">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200" />
      </div>
    </div>
  );
});

const CollapsedTimeRange = ({ time, startHour, endHour, onExpand, items, selectedItem }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `collapsed-${startHour}-${endHour}`
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onExpand}
      style={{
        height: '40px',
        margin: '-5px 0',
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
export const TimelineView = ({
  items,
  date,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onUpdateVisit,
  onUpdateBridge,
}) => {
  const [localItems, setLocalItems] = useState([]);
  const [collapsedRanges, setCollapsedRanges] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const sortedItems = items.sort((a, b) => {
      if (a.visitTime && b.visitTime) {
        const timeA = new Date(a.visitTime).getTime();
        const timeB = new Date(b.visitTime).getTime();
        return timeA - timeB;
      }
      return a.visitTime ? 1 : -1;
    });
    setLocalItems(sortedItems);
  }, [items]);


  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id;
    const itemType = active.data.current?.type;
    const newTime = parseInt(over.id.split('-')[1]);

    try {
      if (itemType === 'visit') {
        await onUpdateVisit(itemId, { visitTime: new Date(newTime).toISOString() });
      } else if (itemType === 'bridge') {
        await onUpdateBridge(itemId, { visitTime: new Date(newTime).toISOString() });
      }
    } catch (error) {
      console.error('Failed to update timeline item:', error);
    }
  };

  const onToggleCollapse = useCallback((hour) => {
    setCollapsedRanges(prev => {
      const existingRangeIndex = prev.findIndex(([start, end]) =>
        hour >= start && hour <= end
      );

      if (existingRangeIndex !== -1) {
        return prev.filter((_, index) => index !== existingRangeIndex);
      }

      if (localItems.some(v => new Date(v.visitTime).getHours() === hour)) {
        return prev;
      }

      const itemByHour = new Array(24).fill(false);
      localItems.forEach(item => {
        const visitHour = new Date(item.visitTime).getHours();
        itemByHour[visitHour] = true;
      });

      let start = hour;
      let end = hour;

      while (start > 1 && !itemByHour[start - 1]) {
        start--;
      }

      while (end < 22 && !itemByHour[end + 1]) {
        end++;
      }

      if (end - start >= 1) {
        const newRange = [start, end];
        const nonOverlapping = prev.filter(([rStart, rEnd]) =>
          rEnd < start - 1 || rStart > end + 1
        );
        return [...nonOverlapping, newRange];
      }

      return prev;
    });
  }, [localItems, zoomLevel]);

  const getCollapsedRange = useCallback((hour) => {
    return collapsedRanges.find(([start, end]) => hour >= start && hour <= end);
  }, [collapsedRanges]);


  const expandRange = useCallback((start, end) => {
    const interval = ZOOM_LEVELS[zoomLevel].interval;
    const slots = [];

    for (let hour = start; hour <= end; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(
          <TimeSlot
            key={`slot-${slotDate.getTime()}`}
            time={slotDate}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
            zoomLevel={zoomLevel}
          />
        );
      }
    }

    // 해당 범위를 collapsedRanges에서 제거
    setCollapsedRanges(prev => prev.filter(range =>
      range[0] !== start || range[1] !== end
    ));

    return slots;
  }, [date, zoomLevel, onToggleCollapse]);

  const getTimeSlots = useCallback(() => {
    const slots = [];
    const interval = ZOOM_LEVELS[zoomLevel].interval;  // 60, 30, 15, 10분

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(slotDate);
      }
    }
    return slots;
  }, [date, zoomLevel]);

  useEffect(() => {
    // Initialize collapsed ranges
    const ranges = [];
    let start = null;

    // Create array marking hours with items
    const itemByHour = new Array(24).fill(false);
    localItems.forEach(visit => {
      const hour = new Date(visit.visitTime).getHours();
      itemByHour[hour] = true;
    });

    // Find ranges of empty hours
    for (let hour = 1; hour < 23; hour++) {
      if (!itemByHour[hour]) {
        if (start === null) start = hour;
      } else if (start !== null) {
        if (hour - start >= 2) {
          ranges.push([start, hour - 1]);
        }
        start = null;
      }
    }

    // Handle case where empty range extends to end
    if (start !== null && 22 - start >= 2) {
      ranges.push([start, 22]);
    }
    console.log(
      'expandRange : ' + JSON.stringify(ranges)
    );
    setCollapsedRanges(ranges);
  }, [localItems]);



  const renderTimeSlots = () => {
    return getTimeSlots().map(time => {
      const hour = time.getHours();
      const range = getCollapsedRange(hour);

      if (range && hour === range[0]) {
        return (
          <CollapsedTimeRange
            key={`collapsed-${time.getTime()}`}
            startHour={range[0]}
            endHour={range[1]}
            onExpand={() => expandRange(range[0], range[1])}
          />
        );
      }

      if (!range) {
        return (
          <TimeSlot
            key={`slot-${time.getTime()}`}
            time={time}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
            zoomLevel={zoomLevel}
          />
        );
      }

      return null;
    });
  };
const calculateTopPosition = useCallback((startTime) => {
  // date prop을 사용하여 해당 날짜의 자정 설정
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  
  console.log('Time calculation:', {
    input: startTime,
    midnight,
    date: date
  });
  
  const minutesSinceMidnight = differenceInMinutes(startTime, midnight);
  const slotHeight = ZOOM_LEVELS[zoomLevel].height;
  const slotInterval = ZOOM_LEVELS[zoomLevel].interval;
  
  return (minutesSinceMidnight / slotInterval) * slotHeight;
}, [date, zoomLevel]);

const calculateHeight = useCallback((duration) => {
  const slotHeight = ZOOM_LEVELS[zoomLevel].height;
  const slotInterval = ZOOM_LEVELS[zoomLevel].interval;
  
  const height = (duration / slotInterval) * slotHeight;
  
  console.log('calculateHeight:', {
    duration,
    slotHeight,
    slotInterval,
    calculatedHeight: height
  });

  return height;
}, [zoomLevel]);


  return (
    <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
      <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
        <div className="relative">
          {/* 타임슬롯 그리드 */}
          <Stack spacing={0}>
            {renderTimeSlots()}
          </Stack>

          {/* TimeCard와 TimeBridge 렌더링 */}
          {items.map(item => {
            const startTime = new Date(item.visitTime);
            const duration = item.duration || 0;
            const topPosition = calculateTopPosition(startTime);
            const itemHeight = calculateHeight(duration);

            if (item.type === 'bridge') {
              console.log(`Bridge ${item.id} rendering details:`, {
                name: item.note,
                visitTime: item.visitTime,
                startTime: startTime.toISOString(),
                duration,
                calculatedTop: topPosition,
                calculatedHeight: itemHeight,
                zoomLevel,
                slotHeight: ZOOM_LEVELS[zoomLevel].height,
                slotInterval: ZOOM_LEVELS[zoomLevel].interval
              });
              console.log(JSON.stringify(item));

              return (
                <TimeBridge
                  key={`bridge-${item.id}`}
                  {...item}
                  name={item.notes}
                  style={{
                    position: 'absolute',
                    top: topPosition,
                    height: itemHeight
                  }}
                />
              );
            }

            return (
              <TimeCard
                key={`visit-${item.id}`}
                {...item}
                style={{
                  position: 'absolute',
                  top: topPosition
                }}
              />
            );
          })}
        </div>
      </ScrollArea>
    </DndContext>
  );
};