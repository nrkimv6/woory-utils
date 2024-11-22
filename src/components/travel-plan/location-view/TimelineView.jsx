import React, { useState, useRef, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group, Button, ActionIcon } from '@mantine/core';
import { format, addMinutes } from 'date-fns';
import { ChevronRight, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions'
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

// 줌 레벨에 따른 시간 간격 (분)
const ZOOM_INTERVALS = {
  1: 60, // 1시간
  2: 30, // 30분
  3: 15, // 15분
  4: 10  // 10분
};

export const TimeCard = ({ visit, index, isSelected, onClick, onEdit, onDelete, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      key={visit.id}
      shadow="sm"
      p="sm"
      pl="xl"
      withBorder
      onClick={() => onClick(visit)}
      style={{
        position: 'absolute',
        left: `${80 + (index * 15)}px`,
        right: `${20 - (index * 15)}px`,
        top: '10px',
        borderLeft: '4px solid #228be6',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
        cursor: 'pointer',
        zIndex: isSelected ? 100 : index,
        overflow: 'visible'  // 추가
      }}
    >
      <div style={{
        position: 'absolute',
        left: -15,  // 더 왼쪽으로 이동
        top: -5,
        transform: 'scale(0.7)',  // 크기만 줄임
        transformOrigin: 'center left', // 왼쪽을 기준으로 크기 조절
        zIndex: 1,  // 카드보다 위에 보이도록
        overflow: 'visible'  // 부모 요소에서 잘리지 않도록
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
  );
};

export const TimeSlot = ({
  time,
  visits,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  isCollapsed,
  onToggleCollapse,
  height,
  zoomLevel
}) => {
  const formattedTime = format(time, 'HH:mm');
  const hasVisits = visits.length > 0;

  if (isCollapsed && !hasVisits) {
    return null;
  }

  return (
    <div
      style={{
        position: 'relative',
        height: height,
        borderBottom: '1px dashed #ddd',
        backgroundColor: hasVisits ? 'transparent' : '#f8f9fa',
        transition: 'height 0.3s ease'
      }}
      onClick={() => !hasVisits && onToggleCollapse(time.getHours())}
    >
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
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ marginLeft: '80px', height: '100%' }}
          >
            {visits.map((visit, index) => (
              <Draggable key={visit.id} draggableId={`visit-${visit.id}`} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TimeCard
                      key={visit.id}
                      visit={visit}
                      index={visit.pin_idx}
                      isSelected={selectedItem?.id === visit.id}
                      onClick={onItemClick}
                      onEdit={onItemEdit}
                      onDelete={onItemDelete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export const TimelineView = ({
  visits,
  date,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onUpdateVisit
}) => {
  const [collapsedHours, setCollapsedHours] = useState(
    Array.from({ length: 24 }, (_, i) => !visits.some(v => new Date(v.visit_time).getHours() === i))
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const scrollRef = useRef(null);

  const handleToggleCollapse = (hour) => {
    setCollapsedHours(prev => {
      const newState = [...prev];
      newState[hour] = !newState[hour];
      return newState;
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  };

  const getTimeSlots = () => {
    const slots = [];
    const interval = ZOOM_INTERVALS[zoomLevel];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(slotDate);
      }
    }
    return slots;
  };

  const getVisitsForTimeSlot = (time) => {
    const interval = ZOOM_INTERVALS[zoomLevel];
    const slotEnd = addMinutes(time, interval);

    return visits.filter(visit => {
      const visitTime = new Date(visit.visit_time);
      return visitTime >= time && visitTime < slotEnd;
    });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const visitId = result.draggableId.split('-')[1];
    const newTime = new Date(parseInt(result.destination.droppableId.split('-')[1]));

    try {
      // Supabase 업데이트
      await onUpdateVisit(visitId, {
        visit_time: newTime.toISOString()
      });
    } catch (error) {
      console.error('Failed to update visit time:', error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Group position="right" p="xs" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'white' }}>
        <ActionIcon onClick={handleZoomOut} disabled={zoomLevel === 1}>
          <ZoomOut size={18} />
        </ActionIcon>
        <ActionIcon onClick={handleZoomIn} disabled={zoomLevel === 4}>
          <ZoomIn size={18} />
        </ActionIcon>
      </Group>

      <ScrollArea ref={scrollRef} style={{ height: 'calc(100vh - 200px)' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Stack spacing={0} p="md">
            {getTimeSlots().map((time) => (
              <TimeSlot
                key={time.getTime()}
                time={time}
                visits={getVisitsForTimeSlot(time)}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                onItemEdit={onItemEdit}
                onDelete={onItemDelete}
                isCollapsed={collapsedHours[time.getHours()]}
                onToggleCollapse={handleToggleCollapse}
                height={collapsedHours[time.getHours()] ? '30px' : '80px'}
                zoomLevel={zoomLevel}
              />
            ))}
          </Stack>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
};