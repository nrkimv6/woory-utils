
import React, { useEffect, useState, useRef } from 'react';
import { Card, Text, Badge, Group } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

const TimeCard = ({ item, style, isSelected, onClick, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { position, top, left, right, width, height, ...remainStyle } = style;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingNow,
    over
  } = useDraggable({
    id: item.id,
    data: {
      type: item.type,
      item: item
    }
  });

  const containerStyle = {
    position,
    top,
    left,
    right,
    width,
    height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDraggingNow ? 50 : 10,
  };

  const cardStyle={
 ...remainStyle,
    borderLeft: '4px solid #228be6',
    backgroundColor: isSelected ? '#f0f7ff' : 'white',
    border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
    cursor: isSelected ? 'grab' : 'pointer', // 선택된 상태에서만 grab 커서
    opacity: isDraggingNow ? 0.6 : 1,
    overflow: 'visible'
  } 
  
  
  useEffect(() => {
    if (isDraggingNow) {
      console.log('Dragging over:', {
        itemId: item.id,
        overNodeId: over?.id,
        overData: over?.data
      });
    }
  }, [isDraggingNow, over, item.id]);

   const handleMouseUp = (event) => {
    console.log("handleMouseUp");
    if (!mouseDownTime.current)
      return;

    const timeDiff = Date.now() - mouseDownTime.current;
    if (timeDiff < 200) { // 200ms 이내면 클릭으로 간주
      console.log("handleMouseUp-click");
      event.stopPropagation();
      onClick(item);
    }
    console.log("handleMouseUp-drag");
    mouseDownTime.current = null;
  };


  return (
    <div
      style={containerStyle}
      ref={setNodeRef}
      {...attributes}
      className={`
        ${isDraggingNow ? 'bg-blue-60' : ''}  // 디버깅을 위한 border 추가
      `}
    >
      {/* 드래그 영역 - attributes까지 전달 */}
      <div {...listeners} {...attributes} className="absolute inset-0 z-10" />
      
      <Card shadow="sm" padding="sm" style={cardStyle}>
        {/* LocationMarker */}
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

        {/* 클릭 영역 */}
        <div 
          className="absolute inset-0 z-20"
          onClick={(e) => {
            if (!isDraggingNow) {
            e.stopPropagation();
            onClick(item);

            }          }}
        />

        <div className="relative h-full">
          <Card.Section>
            <Text size="xs" weight={500}>{item.tp_events?.name}</Text>
          </Card.Section>

          <Group position="apart" mt="xs">
            <Text size="xs" color="dimmed">
              {item.tp_events?.description}
            </Text>
          </Group>

          {item.tp_events?.tags?.split(',').map((tag, index) => (
            <Badge key={index} size="sm" variant="outline">
              {tag.trim()}
            </Badge>
          ))}
          {isSelected && (
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30" 
              onClick={e => e.stopPropagation()}
            >
              <CollapsibleEventActions
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                type="item"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
export default TimeCard;