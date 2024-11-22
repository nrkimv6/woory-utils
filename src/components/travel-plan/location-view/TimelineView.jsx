import React, { useState, useRef, useEffect  } from 'react';
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

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <Card
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
          overflow: 'visible',
          opacity: isDragging ? 0.6 : 1,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.2s, opacity 0.2s'
        }}
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

const TimeSlot = ({
  time,
  visits,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  zoomLevel,
  isCollapsed,
  onToggleCollapse
}) => {
  const formattedTime = format(time, 'HH:mm');
  const hasVisits = visits.length > 0;

  return (
    <div
      style={{
        position: 'relative',
        height: isCollapsed && !hasVisits ? '30px' : ZOOM_LEVELS[zoomLevel].height,
        borderBottom: '1px dashed #ddd',
        transition: 'height 0.2s ease'
      }}
      onClick={() => !hasVisits && onToggleCollapse()}
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
};
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

  useEffect(() => {
    setLocalVisits(originalVisits);
  }, [originalVisits]);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedHours, setCollapsedHours] = useState(
    Array.from({ length: 24 }, (_, i) => !localVisits.some(v => new Date(v.visit_time).getHours() === i))
  );

  const getTimeSlots = () => {
    const slots = [];
    const interval = ZOOM_LEVELS[zoomLevel].interval;

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
    const interval = ZOOM_LEVELS[zoomLevel].interval;
    const slotEnd = addMinutes(time, interval);

    return localVisits.filter(visit => {
      const visitTime = new Date(visit.visit_time);
      return visitTime >= time && visitTime < slotEnd;
    });
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ position: 'relative' }}>
        <Group position="right" p="xs" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'white',
          borderBottom: '1px solid #eee'
        }}>
          <ActionIcon
            onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}
            disabled={zoomLevel === 1}
            variant="light"
          >
            <ZoomOut size={18} />
          </ActionIcon>
          <Text size="sm" color="dimmed">{zoomLevel}x</Text>
          <ActionIcon
            onClick={() => setZoomLevel(prev => Math.min(prev + 1, 4))}
            disabled={zoomLevel === 4}
            variant="light"
          >
            <ZoomIn size={18} />
          </ActionIcon>
        </Group>

        <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
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
                zoomLevel={zoomLevel}
                isCollapsed={collapsedHours[time.getHours()]}
                onToggleCollapse={() => {
                  const hour = time.getHours();
                  setCollapsedHours(prev => {
                    const newState = [...prev];
                    newState[hour] = !newState[hour];
                    return newState;
                  });
                }}
              />
            ))}
          </Stack>
        </ScrollArea>
      </div>
    </DragDropContext>
  );
};