import React, { useState } from 'react';
import { Card, Text, Badge, Group } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

const TimeCard = ({ isDragging, item, index, isSelected, onClick, onEdit, onDelete, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `visit-${item.id}`,
    data: {
      type: 'visit',
      item
    },
    disabled: !isSelected // 선택된 항목만 드래그 가능
  });

const cardStyle = {
  ...style,
  borderLeft: '4px solid #228be6',
  backgroundColor: isSelected ? '#f0f7ff' : 'white',
  border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
  cursor: 'pointer',
  // zIndex: style.zIndex,
  opacity: isDragging ? 0.6 : 1,
  transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  transition: !isDragging ? 'transform 0.2s, opacity 0.2s' : undefined,
  // position: 'absolute',
  overflow: 'visible'
};


  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
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