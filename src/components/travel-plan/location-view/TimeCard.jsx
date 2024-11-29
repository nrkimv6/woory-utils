
import React, { useEffect, useState, useRef } from 'react';
import { Card, Text, Badge, Group } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';
const TimeCard = ({ item, style, isSelected, onClick, onEdit, onDelete }) => {
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
    },
    disabled: !isSelected
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const mouseDownTime = useRef(null);

  // // 전체 카드의 위치와 크기를 제어하는 컨테이너 스타일
  // const containerStyle = {
  //   ...style,
  //   borderLeft: '4px solid #228be6',
  //   backgroundColor: isSelected ? '#f0f7ff' : 'white',
  //   border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
  //   cursor: isSelected ? 'grab' : 'pointer', // 선택된 상태에서만 grab 커서
  //   opacity: isDraggingNow ? 0.6 : 1,
  //   transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  //   opacity: isDraggingNow ? 0.5 : 1,
  //   transition: isDraggingNow ? 'none' : 'all 0.2s ease',
  //   overflow: 'visible'
  // };

 const { position, top, left, right, width, height, ...remainStyle } = style;

  // 레이아웃/포지셔닝 관련 스타일
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


  // useEffect(() => {
  //   console.log(item?.id + " isDraggingNow " + isDraggingNow);
  //   console.log(item?.id + " isSelected " + isSelected);
  // }, [isDraggingNow, isSelected]);

  const DragHandle = () => (
    <div
      {...attributes}
      {...listeners}
      className="absolute top-0 left-0 w-full h-6 cursor-grab active:cursor-grabbing"
    />
  );

  // 드래그 시작 시간을 기록하는 핸들러
  // const handleDragStart = (event) => {
  //   setDragStartTime(Date.now());
  //   listeners.onPointerDown(event);
  // };

  // const handleClick = (e) => {
  //   e.stopPropagation();

  //   // dragStartTime이 없거나, 드래그 시간이 짧으면(200ms 이하) 클릭으로 간주
  //   if (!dragStartTime || (Date.now() - dragStartTime < 200)) {
  //     onClick(item);
  //   }
  //   setDragStartTime(null);
  // };

  // mouseup에서 시간 차이를 계산하여 클릭 여부 판단
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
      {...listeners}
      className={`
        ${isDraggingNow ? 'border-2 border-red-500' : ''}  // 디버깅을 위한 border 추가
      `}
    >
      <Card 
        shadow="sm" 
        padding="sm"
        style={cardStyle
    // opacity: isDraggingNow ? 0.5 : 1,
    // transition: isDraggingNow ? 'none' : 'all 0.2s ease',
    // backgroundColor: 'white',
    // Card 컴포넌트의 원래 스타일들...
        }
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

        <div 
          className="absolute inset-0 z-20"
          onClick={(e) => {
            if (!isDraggingNow) {
              e.stopPropagation();
              onClick(item);
            }
          }}
        />

        <Card.Section>
          <Text size="xs" weight={500}>{item.tp_events?.name}</Text>
        </Card.Section>

        <Group position="apart" mt="xs">
          <Text size="xs" color="dimmed">
            {item.tp_events?.description}
          </Text>
          {item.tp_events?.tags?.split(',').map((tag, index) => (
            <Badge key={index} size="sm" variant="outline">
              {tag.trim()}
            </Badge>
          ))}
           {/* Actions positioned absolutely */}
          {isSelected && (
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30" 
              onClick={e => e.stopPropagation()}  // 이벤트 전파 중지
              style={{ pointerEvents: 'auto' }}   // 이벤트 처리 보장
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
        </Group>
      </Card>
    </div>
  );
};
export default TimeCard;