import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format, addMinutes } from 'date-fns';
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
  time,
  items,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  zoomLevel,
  isCollapsed,
  onToggleCollapse
}) {
  const [dragOverTimer, setDragOverTimer] = useState(null);
  const formattedTime = format(time, 'HH:mm');
  const hasItems = items.length > 0;

  // DragOver 타이머 처리
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
  const getItemStyle = (index) => ({
    position: 'absolute',
    left: `${80 + (index * 15)}px`,
    right: '20px',
    top: '10px',
    zIndex: index
  });

  return (
    <div
      ref={setNodeRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !hasItems && onToggleCollapse(time.getHours())}
      className={`
        relative
        ${isOver ? 'bg-blue-50' : ''}
        transition-all duration-200
      `}
      style={{
        height: isCollapsed && !hasItems ? '30px' : ZOOM_LEVELS[zoomLevel].height,
        borderBottom: '1px dashed #ddd',
        cursor: hasItems ? 'default' : 'pointer'
      }}
    >
      <Group position="apart" spacing="xs" className="absolute left-0 top-0 w-[70px]">
        <Text size="sm" weight={500} color="dimmed">
          {formattedTime}
        </Text>
      </Group>

      <div className="relative ml-[80px] h-full">
        {items.map((item, index) => {
          if (item.type === 'bridge') {
            return (
              <TimeBridge
                key={`bridge-${item.id}`}
                id={item.id}
                name={item.note}
                duration={item.duration}
                type={item.type}
                location={item.address}
                startTime={item.visitTime}
                isSelected={selectedItem?.id === item.id}
                onClick={onItemClick}
                onEdit={onItemEdit}
                onDelete={onItemDelete}
                index={index}
                total={items.length}
                style={getItemStyle(index)}
              />
            );
          }
          return (
            <TimeCard
              key={`visit-${item.id}`}
              item={item}
              index={index}
              isSelected={selectedItem?.id === item.id}
              onClick={onItemClick}
              onEdit={onItemEdit}
              onDelete={onItemDelete}
              style={getItemStyle(index)}
            />
          );
        })}
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

  // // visits와 bridges를 통합하여 관리
  // useEffect(() => {
  //   const items = [
  //     ...visits.map(v => ({ ...v, type: 'visit' })),
  //     ...bridges.map(b => ({ ...b, type: 'bridge' }))
  //   ].sort((a, b) => {
  //     const timeA = new Date(a.visitTime).getTime();
  //     const timeB = new Date(b.visitTime).getTime();
  //     return timeA - timeB;
  //   });
  //   setLocalItems(items);
  // }, [visits, bridges]);

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

  const renderTimelineItem = (item) => {
    if (item.type === 'visit') {
      return (
        <TimeCard
          key={`visit-${item.id}`}
          item={item}
          index={item.pin_idx}
          isSelected={selectedItem?.id === item.id}
          onClick={onItemClick}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
        />
      );
    }

    return (
      // <TimeBridge
      //   key={`bridge-${item.id}`}
      //   data={item}
      //   index={item.pin_idx}
      //   onClick={onItemClick}
      //   onEdit={onItemEdit}
      //   onDelete={onItemDelete}
      // />

      <TimeBridge
        key={`bridge-${item.id}`}
        // data={item}
        style={getItemStyle(index)}
        id={`bridge-${item.id}`}
        name={item.note}
        duration={item.duration}
        type={item.type}
        location={item.address}
        startTime={item.visitTime}
        endTime={item.visitTime + item.duration}
        index={item.pin_idx}
        onClick={onItemClick}
        onEdit={onItemEdit}
        onDelete={onItemDelete}
      />
    );
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

  const getTimelineItemsForSlot = useCallback((time) => {
    const interval = ZOOM_LEVELS[zoomLevel].interval;
    const slotEnd = addMinutes(time, interval);

    return localItems.filter(item => {
      const itemTime = new Date(item.visitTime);
      // Bridge의 경우 duration을 고려해야 함
      if (item.type === 'bridge') {
        const itemEndTime = addMinutes(itemTime, item.duration || 0);
        return itemTime <= slotEnd && itemEndTime >= time;
      }
      // Visit의 경우 기존 로직 유지
      return itemTime >= time && itemTime < slotEnd;
    });
  }, [localItems, zoomLevel]);

  const expandRange = useCallback((start, end) => {
    const interval = ZOOM_LEVELS[zoomLevel].interval;
    const slots = [];

    // Generate all time slots between start and end
    for (let hour = start; hour <= end; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(
          <TimeSlot
            key={slotDate.getTime()}
            time={slotDate}
            items={getTimelineItemsForSlot(slotDate)}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onDelete={onItemDelete}
            zoomLevel={zoomLevel}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
          />
        );
        console.log('slot time:' + slotDate.getTime());
        console.log('slot sz:' + slots.length);
      }
    }

    console.log("*********expandRange*********");
    console.log(JSON.stringify(slots));
    console.log("******************");

    // Remove the range from collapsedRanges
    setCollapsedRanges(prev => prev.filter(range =>
      range[0] !== start || range[1] !== end
    ));

    return slots;
  }, [date, getTimelineItemsForSlot, selectedItem, onItemClick, onItemEdit, onItemDelete, onToggleCollapse, zoomLevel]);


  // const renderTimeSlots_old = useCallback(() => {
  //   const slots = getTimeSlots();
  //   const renderedSlots = [];

  //   for (let i = 0; i < slots.length; i++) {
  //     const time = slots[i];
  //     const hour = time.getHours();
  //     const range = getCollapsedRange(hour);

  //     if (range && hour === range[0]) {
  //       renderedSlots.push(
  //         <CollapsedTimeRange
  //           key={time.getTime()}
  //           time={time}
  //           items={[]}
  //           selectedItem={null}
  //           // key={`collapsed-${range[0]}-${range[1]}`}
  //           startHour={range[0]}
  //           endHour={range[1]}
  //           onExpand={() => expandRange(range[0], range[1])}
  //         />
  //       );

  //       console.log('CollapsedTimeRange slot time:'+time.getTime());
  //       console.log('slot sz:'+renderedSlots.length);
  //     } else if (!range) {
  //       renderedSlots.push(
  //         <TimeSlot
  //           key={time.getTime()}
  //           time={time}
  //           items={getTimelineItemsForSlot(time)}
  //           selectedItem={selectedItem}
  //           onItemClick={onItemClick}
  //           onItemEdit={onItemEdit}
  //           onDelete={onItemDelete}
  //           zoomLevel={zoomLevel}
  //           isCollapsed={false}
  //           onToggleCollapse={onToggleCollapse}
  //           onExpandCollapsed={() => {
  //             const range = getCollapsedRange(hour);
  //             if (range) expandRange(range[0], range[1]);
  //           }}
  //         />
  //       );

  //       console.log('slot time:'+time.getTime());
  //       console.log('slot sz:'+renderedSlots.length);
  //     }
  //   }

  //   try {

  //     console.log("*********expandRange*********");
  //     console.log(JSON.stringify(renderedSlots));
  //     console.log("******************");
  //   } catch (e) {

  //     try {
  //       const cleanData = cleanReactStructure(renderedSlots);
  //       console.log(JSON.stringify(cleanData, null, 2));
  //     } catch (e) {
  //       console.error('Error:', e);
  //     }
  //   }
  //   return renderedSlots;

  // }, [getTimeSlots, getCollapsedRange, expandRange, getTimelineItemsForSlot, selectedItem, onItemClick, onItemEdit, onItemDelete, zoomLevel, onToggleCollapse]);

  const renderTimeSlots = useCallback(() => {
    const slots = getTimeSlots();
    const renderedSlots = [];

    for (let i = 0; i < slots.length; i++) {
      const time = slots[i];
      const hour = time.getHours();
      const range = getCollapsedRange(hour);

      if (range && hour === range[0]) {
        renderedSlots.push(
          <CollapsedTimeRange
            key={`collapsed-${time.getTime()}`}
            time={time}
            items={[]}
            selectedItem={null}
            startHour={range[0]}
            endHour={range[1]}
            onExpand={() => expandRange(range[0], range[1])}
          />
        );
      } else if (!range) {
        renderedSlots.push(
          <TimeSlot
            key={`slot-${time.getTime()}`}
            time={time}
            items={getTimelineItemsForSlot(time)}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onDelete={onItemDelete}
            zoomLevel={zoomLevel}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
          />
        );
      }
      console.log("*********renderTimeSlots*********");
      const cleanData = cleanReactStructure(renderedSlots);
      console.log(JSON.stringify(cleanData, null, 2));
    }

    return renderedSlots;
  }, [getTimeSlots, getCollapsedRange, expandRange, getTimelineItemsForSlot, selectedItem, onItemClick, onItemEdit, onItemDelete, zoomLevel, onToggleCollapse]);

  // useEffect(() => {
  //   setLocalItems(originalVisits);
  // }, [originalVisits]);

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




  const handleDragLeave = () => {
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
      console.log('handleDragLeave');
    }
  };
  const onExpand = () => {
    console.log('onExpand');
  }
  const handleDragStart = () => {
    // Expand all collapsed ranges
    collapsedRanges.forEach(([start, end]) => {
      expandRange(start, end);
    });
  };


  return (
    <DndContext
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
        <Stack key={date} spacing={0} p="md">
          {renderTimeSlots()}
        </Stack>
      </ScrollArea>
    </DndContext>
  );
};