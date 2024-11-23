import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format, addMinutes } from 'date-fns';
// import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { DndContext } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

import TimeCard from './TimeCard'
import TimeBridge from './TimeBridge'

const ZOOM_LEVELS = {
  1: { interval: 60, height: 80 },
  2: { interval: 30, height: 60 },
  3: { interval: 15, height: 40 },
  4: { interval: 10, height: 30 }
};
const TimeSlot = React.memo(function TimeSlot({ time,
  items,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  zoomLevel,
  isCollapsed,
  onToggleCollapse }) {
  // const [dragOverTimer, setDragOverTimer] = useState(null);
  const formattedTime = format(time, 'HH:mm');
  const hasVisits = items.length > 0;

  const handleClick = () => {
    if (!hasVisits) {
      onToggleCollapse(time.getHours());
    }
  };

  const {setNodeRef} = useDroppable({
  id: `timeslot-${time.getTime()}`
});

  return (
    <div
      onClick={handleClick}
      // onDragOver={handleDragOver}
      // onDragLeave={handleDragLeave}
      style={{
        position: 'relative',
        height: isCollapsed && !hasVisits ? '30px' : ZOOM_LEVELS[zoomLevel].height,
        borderBottom: '1px dashed #ddd',
        transition: 'height 0.2s ease, background-color 0.2s ease',
        cursor: hasVisits ? 'default' : 'pointer'
      }}
    >
      <Group position="apart" spacing="xs" style={{ position: 'absolute', left: 0, top: 0, width: '70px' }}>
        <Text size="sm" weight={500} color="dimmed">
          {formattedTime}
        </Text>
      </Group>
      <div ref={setNodeRef}>
          {/* 타임슬롯의 속성대로 Droppable 있어야 할 것 같은데...? 잘 모르겠음... */}
      </div>
      {/* 
      //#TODO DragOver상태에서 선표시
      //#question : provided는 뭔가?
      <Droppable droppableId={`timeslot-${time.getTime()}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              marginLeft: '80px',
              height: '100%',
              backgroundColor: snapshot.isDraggingOver ? '#e6f4ff' : 'transparent',  (추측 : 드래그오버 상태에서 색상변경)
              transition: 'background-color 0.2s ease'
            }}
          >
            {items.map((visit, index) => (


            // #question : 이걸 날렸으면 useDraggable을 넣어야 하지 않나..?
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
      </Droppable> */}
    </div>
  );
});

//요약 : TimeCard가 존재하지 않는 영역(timeSlot 2개 이상)을 접었다 펼수있음
//접은 경우 시간부분이 ... 로 보임
//가장 첫시간과 가장 끝시간은 접히지 않음
const CollapsedTimeRange = ({ startHour, endHour, onExpand }) => {
  //TODO DND중 1초간 머무르면 Collapsed가 풀리게 구현
const {setNodeRef} = useDroppable({
  id:`collapsed-${startHour}-${endHour}`
});
  return (
    <div ref={setNodeRef}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={onExpand}
          // onDragOver={handleDragOver} --> 접힌영역에 1초간 머무르면 저절로 펴져야 함
          // onDragEnd={handleDragEnd} --> 나머지는 잘모르겠음 일단
          // onDragLeave={handleDragLeave}
          style={{
            height: '40px',  // 높이를 늘림
            margin: '-5px 0', // 위아래 여백을 음수로 주어 인접 요소와 겹치게 함
            borderBottom: '1px dashed #ddd',
            backgroundColor: snapshot.isDraggingOver ? '#e9ecef' : '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '0 10px',
            transition: 'all 0.2s ease',
            transform: snapshot.isDraggingOver ? 'scale(1.01)' : 'scale(1)',
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
          {provided.placeholder}
        </div>
      )}
    </div>
  )
};

export const TimelineView = ({
  items: originalVisits,
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

//이전 답변으로 추가
  const renderTimelineItem = (item) => {
    if (item.type === 'visit') {
      return (

// TimeCard의 특징
//카드모양으로 TimeSlot의 일부를 차지
//선택된 경우 isSelected DND 가능
// 떨군 위치에 visit_time 업데이트 (--> onItemEdit)
        <TimeCard
          key={`visit-${item.id}`}
          provided={provided}
          isDragging={snapshot.isDragging}
          visit={item}
          index={visit.pin_idx}
          isSelected={selectedItem?.id === visit.id}
          onClick={onItemClick}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
        />
      );
    }

    return (
// TimeBridge 특징은 아래와 같아
// - 카드형식으로 차지하는게 아니라 빈 형태에 세로로 가운데에 점선을 잇고 있어
// - 그래프에 노드처럼 라벨을 1개 가지고 있어
// - 이름, 소요시간, 타입, 위치 정보를 가져 (visit과 비슷할 것 같아)
// - 이 영역 사이에 time card를 둘 수 있어(dnd) 둔다면 크기가 축소될거야
// - 여행에서 이동수단, 휴식시간 등의 역할을 할거야.
// DND를 할 필요는 없음.
      <TimeBridge
        key={`bridge-${item.id}`}
        isDragging={snapshot.isDragging}
        data={item}
        index={visit.pin_idx}
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
  }, [zoomLevel, date]);

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
            items={getVisitsForTimeSlot(time)}
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
  }, [getTimeSlots, getCollapsedRange, expandRange, getVisitsForTimeSlot, selectedItem, onItemClick, onItemEdit, onItemDelete, zoomLevel, onToggleCollapse]);


  useEffect(() => {
    setLocalVisits(originalVisits);
  }, [originalVisits]);

  useEffect(() => {
    // Initialize collapsed ranges
    const ranges = [];
    let start = null;

    // Create array marking hours with items
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

  const getCollapsedRange = useCallback((hour) => {
    return collapsedRanges.find(([start, end]) => hour >= start && hour <= end);
  }, [collapsedRanges]);

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
            items={getVisitsForTimeSlot(slotDate)}
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
    }

    // Remove the range from collapsedRanges
    setCollapsedRanges(prev => prev.filter(range =>
      range[0] !== start || range[1] !== end
    ));

    return slots;
  }, [zoomLevel, date, getVisitsForTimeSlot, selectedItem, onItemClick, onItemEdit, onItemDelete, onToggleCollapse]);

  const getVisitsForTimeSlot = useCallback((time) => {
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
  }, [zoomLevel, localVisits]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const visitId = result.draggableId.split('-')[1];
    const newTimeValue = parseInt(result.destination.droppableId.split('-')[1]);
    const newTime = new Date(newTimeValue);

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

  // return (
  //   <DragDropContext
  //     onDragEnd={handleDragEnd}
  //     onDragStart={handleDragStart}
  //   >
  //     <div style={{ position: 'relative' }}>
  //       {/* ... existing zoom controls */}
  //       <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
  //         <Stack spacing={0} p="md">
  //           {renderTimeSlots()}
  //         </Stack>
  //       </ScrollArea>
  //     </div>
  //   </DragDropContext>
  // );

  return (
    
    <DndContext onDragEnd={(result) => {
      const { active, over } = result;
      if (!over) return;

      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);

      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);

      // 순서 재계산
      newItems.forEach((item, index) => {
        item.visitOrder = index + 1;
      });

      onItemsChange(newItems);
    }}>
      <div className="timeline-container">
        <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
          <Stack spacing={0} p="md">
            {renderTimeSlots()}
          </Stack>
        </ScrollArea>
        {items.map(renderTimelineItem)}
      </div>
    </DndContext>
  );
};

