import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group, ActionIcon } from '@mantine/core';
import { format, addMinutes } from 'date-fns';
import { ChevronRight, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

const ZOOM_LEVELS = {
  1: { interval: 60, height: 80 },
  2: { interval: 30, height: 60 },
  3: { interval: 15, height: 40 },
  4: { interval: 10, height: 30 }
};
const TimeCard = ({ provided, isDragging, visit, index, isSelected, onClick, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardStyle = {
    position: 'absolute',
    left: '80px',
    right: '20px',
    top: '10px',
    borderLeft: '4px solid #228be6',
    backgroundColor: isSelected ? '#f0f7ff' : 'white',
    border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
    cursor: 'pointer',
    zIndex: isSelected ? 100 : index,
    overflow: 'visible',
    opacity: isDragging ? 0.6 : 1,
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 0.2s, opacity 0.2s'
  };

  return (
    <div
      ref={provided?.innerRef}
      {...(provided.draggableProps )}
      {...( provided.dragHandleProps)}
    >
      <Card
        shadow="sm"
        p="sm"
        pl="xl"
        withBorder
        onClick={() => onClick(visit)}
        style={cardStyle}
      >
        <div style={{
          position: 'absolute',
          left: -15,
          top: -5,
          transform: 'scale(0.8)',
          transformOrigin: 'center left',
          zIndex: 1,
          overflow: 'visible'
        }}>
          <LocationMarker
            markerText={visit.markerText}
            color={PASTEL_COLORS[visit.pin_idx % PASTEL_COLORS.length]}
          />
        </div>
        <Text weight={500} size="sm" mb="xs">
          {visit.tp_events?.name}
        </Text>
        <Text size="sm" color="dimmed" mb="xs" lineClamp={1}>
          {visit.tp_events?.description}
        </Text>
        <Group spacing={5}>
          {visit.tp_events?.tags?.split(',').map((tag, index) => (
            <Badge key={index} size="sm" variant="outline">
              {tag.trim()}
            </Badge>
          ))}
        </Group>
        {isSelected && (
          <CollapsibleEventActions
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            item={visit}
            onEdit={onEdit}
            onDelete={onDelete}
            type="visit"
          />
        )}
      </Card>
    </div>
  );
};

const TimeSlot = React.memo(function TimeSlot({ time,
  visits,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  zoomLevel,
  isCollapsed,
  onExpandCollapsed }) {
  const [dragOverTimer, setDragOverTimer] = useState(null);
  const formattedTime = format(time, 'HH:mm');
  const hasVisits = visits.length > 0;

  const handleDragOver = () => {
    if (isCollapsed) {
      if (dragOverTimer) clearTimeout(dragOverTimer);
      const timer = setTimeout(() => {
        onExpandCollapsed();
      }, 3000);
      setDragOverTimer(timer);
    }
  };

  const handleDragLeave = () => {
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }
  };


  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        position: 'relative',
        height: isCollapsed && !hasVisits ? '30px' : ZOOM_LEVELS[zoomLevel].height,
        borderBottom: '1px dashed #ddd',
        transition: 'height 0.2s ease'
      }}
    >
      {/* onClick={() => !hasVisits && onToggleCollapse(time.getHours())} */}
      <Group position="apart" spacing="xs" style={{ position: 'absolute', left: 0, top: 0, width: '70px' }}>
        <Text size="sm" weight={500} color="dimmed">
          {formattedTime}
        </Text>
        {!hasVisits && (
          <ActionIcon size="xs" variant="subtle">
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </ActionIcon>
        )}
      </Group>

      <Droppable droppableId={`timeslot-${time.getTime()}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              marginLeft: '80px',
              height: '100%',
              backgroundColor: snapshot.isDraggingOver ? '#e6f4ff' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >
            {visits.map((visit, index) => (
              <Draggable
                key={visit.id}
                draggableId={`visit-${visit.id}`}
                index={index}
                isDragDisabled={selectedItem?.id !== visit.id}
              >
                {(provided, snapshot) => (
                  <TimeCard
                    provided={provided}
                    isDragging={snapshot.isDragging}
                    visit={visit}
                    index={visit.pin_idx}
                    isSelected={selectedItem?.id === visit.id}
                    onClick={onItemClick}
                    onEdit={onItemEdit}
                    onDelete={onItemDelete}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

export const TimelineView = ({
  visits: originalVisits,
  date,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onUpdateVisit,
  ...props
}) => {
  const [localVisits, setLocalVisits] = useState(originalVisits);
  const [collapsedRanges, setCollapsedRanges] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const onToggleCollapse = useCallback((hour) => {
    setCollapsedRanges(prev => {
      const existingRangeIndex = prev.findIndex(([start, end]) =>
        hour >= start && hour <= end
      );

      if (existingRangeIndex !== -1) {
        return prev.filter((_, index) => index !== existingRangeIndex);
      }

      if (localVisits.some(v => new Date(v.visit_time).getHours() === hour)) {
        return prev;
      }

      const hoursWithVisits = new Array(24).fill(false);
      localVisits.forEach(visit => {
        const visitHour = new Date(visit.visit_time).getHours();
        hoursWithVisits[visitHour] = true;
      });

      let start = hour;
      let end = hour;

      while (start > 1 && !hoursWithVisits[start - 1]) {
        start--;
      }

      while (end < 22 && !hoursWithVisits[end + 1]) {
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
  }, [localVisits]);

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
            key={`collapsed-${range[0]}-${range[1]}`}
            startHour={range[0]}
            endHour={range[1]}
            onExpand={() => expandRange(range[0], range[1])}
          />
        );
      } else if (!range) {
        renderedSlots.push(
          <TimeSlot
            key={time.getTime()}
            time={time}
            visits={getVisitsForTimeSlot(time)}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onDelete={onItemDelete}
            zoomLevel={zoomLevel}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
            onExpandCollapsed={() => {
              const range = getCollapsedRange(hour);
              if (range) expandRange(range[0], range[1]);
            }}
          />
        );
      }
    }

    return renderedSlots;
  }, [
    zoomLevel,
    selectedItem,
    localVisits,
    collapsedRanges,
    onItemClick,
    onItemEdit,
    onItemDelete,
    onToggleCollapse
  ]);


  useEffect(() => {
    setLocalVisits(originalVisits);
  }, [originalVisits]);

  useEffect(() => {
    // Initialize collapsed ranges
    const ranges = [];
    let start = null;

    // Create array marking hours with visits
    const hoursWithVisits = new Array(24).fill(false);
    localVisits.forEach(visit => {
      const hour = new Date(visit.visit_time).getHours();
      hoursWithVisits[hour] = true;
    });

    // Find ranges of empty hours
    for (let hour = 1; hour < 23; hour++) {
      if (!hoursWithVisits[hour]) {
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
  }, [localVisits]);

  const isHourCollapsed = (hour) => {
    return collapsedRanges.some(([start, end]) => hour >= start && hour <= end);
  };

  const getCollapsedRange = (hour) => {
    return collapsedRanges.find(([start, end]) => hour >= start && hour <= end);
  };

  const expandRange = (start, end) => {

    console.log(
      'expandRange : ' + JSON.stringify(prev => prev.filter(range =>
        range[0] !== start || range[1] !== end
      ))
    );

    setCollapsedRanges(prev => prev.filter(range =>
      range[0] !== start || range[1] !== end
    ));
  };

  const getVisitsForTimeSlot = (time) => {
    const interval = ZOOM_LEVELS[zoomLevel].interval;
    const slotEnd = addMinutes(time, interval);
    const hour = time.getHours();

    const visitsInSlot = localVisits.filter(visit => {
      const visitTime = new Date(visit.visit_time);
      return visitTime >= time && visitTime < slotEnd;
    });

    // Calculate offset for overlapping cards
    if (visitsInSlot.length > 0) {
      const prevHourVisits = localVisits.filter(v =>
        new Date(v.visit_time).getHours() === hour - 1
      );
      const nextHourVisits = localVisits.filter(v =>
        new Date(v.visit_time).getHours() === hour + 1
      );

      visitsInSlot.forEach((visit, idx) => {
        const offset = (prevHourVisits.length > 0 || nextHourVisits.length > 0) ? idx * 15 : 0;
        visit.offset = offset;
      });
    }

    return visitsInSlot;
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const visitId = result.draggableId.split('-')[1];
    const newTime = new Date(parseInt(result.destination.droppableId.split('-')[1]));

    // 로컬 상태 즉시 업데이트
    setLocalVisits(prev => prev.map(visit =>
      visit.id === parseInt(visitId)
        ? { ...visit, visit_time: newTime.toISOString() }
        : visit
    ));

    try {
      // 백그라운드에서 서버 업데이트
      await onUpdateVisit(visitId, { visit_time: newTime.toISOString() });
    } catch (error) {
      // 실패시 로컬 상태 복구
      setLocalVisits(originalVisits);
      console.error('Failed to update visit:', error);
    }
  };
  const getTimeSlots = () => {
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
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ position: 'relative' }}>
        {/* ... existing zoom controls */}
        <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
          <Stack spacing={0} p="md">
            {renderTimeSlots()}
          </Stack>
        </ScrollArea>
      </div>
    </DragDropContext>
  );
};

const CollapsedTimeRange = ({ startHour, endHour, onExpand }) => (
  <div
    onClick={onExpand}
    style={{
      height: '30px',
      borderBottom: '1px dashed #ddd',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '0 10px'
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