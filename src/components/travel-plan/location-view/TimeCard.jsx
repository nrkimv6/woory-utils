
import React, { useState,  } from 'react';
import { Card, Text, Badge,  Group } from '@mantine/core';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

const TimeCard = ({ provided, isDragging, item, index, isSelected, onClick, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

// #TODO 동일한시간대 ~ TimeSlot에 겹치는 시간대의 경우 수평배치 (15px 간격)
// 이거 DND한 뒤에도 적용이 되어야 함. 현재는 처음에만 적용되고 있음.
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
      {...(provided.draggableProps)}
      {...(provided.dragHandleProps)}
    >
      <Card
        shadow="sm"
        p="sm"
        pl="xl"
        withBorder
        onClick={() => onClick(item)}
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
            markerText={item.markerText}
            color={PASTEL_COLORS[item.pin_idx % PASTEL_COLORS.length]}
          />
        </div>
        <Text weight={500} size="sm" mb="xs">
          {item.tp_events?.name}
        </Text>
        <Text size="sm" color="dimmed" mb="xs" lineClamp={1}>
          {item.tp_events?.description}
        </Text>
        <Group spacing={5}>
          {item.tp_events?.tags?.split(',').map((tag, index) => (
            <Badge key={index} size="sm" variant="outline">
              {tag.trim()}
            </Badge>
          ))}
        </Group>
        {isSelected && (
          <CollapsibleEventActions
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            type="item"
          />
        )}
      </Card>
    </div>
  );
};

export default TimeCard;