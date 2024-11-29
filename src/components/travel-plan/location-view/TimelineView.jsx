import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { DndContext } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import TimeCard from './TimeCard';
import TimeBridge from './TimeBridge';
import { cleanReactStructure } from '@/util/jsfunc'
import {CollapsedRangeState, TimeSlot, CollapsedTimeRange} from './TimeSlot'
import { ZOOM_LEVELS } from '../types';

export const TimelineView = ({
  items,
  date,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemsChange
}) => {
  const [localItems, setLocalItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [collapsedRanges, setCollapsedRanges] = useState([]);
  const [rangeStates, setRangeStates] = useState({}); // 각 범위의 상태를 추적
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const sortedItems = items
      .filter(item => {
        const itemDate = new Date(item.visitTime);
        const baseDate = new Date(date);
        return itemDate.toDateString() === baseDate.toDateString();
      })
      .sort((a, b) => {
        const timeA = new Date(a.visitTime).getTime();
        const timeB = new Date(b.visitTime).getTime();
        return timeA - timeB;
      });

    console.log("*** renderItems localItems ***");
    console.log(JSON.stringify(localItems));
    console.log("****************");
    setLocalItems(sortedItems);
    setVisibleItems(sortedItems);
  }, [items, date]);

  // 범위 상태 관리를 위한 새로운 함수
  const updateRangeState = useCallback((start, end, state) => {
    setRangeStates(prev => ({
      ...prev,
      [`${start}-${end}`]: state
    }));
  }, []);


  const getCollapsedRangeHeight = useCallback((start, end) => {
    return 40; // CollapsedRange의 고정 높이
  }, []);

  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTimer, setDragOverTimer] = useState(null);
  const [activeRange, setActiveRange] = useState(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    // CollapsedRange 위에서 드래그 중일 때
    if (over.id.startsWith('collapsed-')) {
      const [, start, end] = over.id.split('-').map(Number);
      
      // 이전 타이머 취소
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }

      // 새로운 범위가 활성화되면 이전 타이머 취소하고 새로 시작
      if (activeRange?.start !== start || activeRange?.end !== end) {
        setActiveRange({ start, end });
        const timer = setTimeout(() => {
          handleRangeExpand(start, end);
          setDragOverTimer(null);
          setActiveRange(null);
        }, 1000);
        setDragOverTimer(timer);
      }
    } else {
      // CollapsedRange를 벗어나면 타이머 취소
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
        setDragOverTimer(null);
      }
      setActiveRange(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setIsDragging(false);
    
    // 드래그 종료 시 남아있는 타이머 정리
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }
    setActiveRange(null);

    if (!over) return;

    const itemId = active.id;
    const itemType = active.data.current?.type;
    const newTime = parseInt(over.id.split('-')[1]);
    
    try {
      await onItemsChange(itemId, itemType, { visitTime: new Date(newTime).toISOString() });
    } catch (error) {
      console.error('Failed to update timeline item:', error);
    }
  };

  const handleDragCancel = () => {
    setIsDragging(false);
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }
    setActiveRange(null);
  };


  // 특정 시간 이전의 CollapsedRange들의 총 높이를 계산
  const getPrecedingCollapsedHeight = useCallback((targetTime) => {
    const targetHour = new Date(targetTime).getHours();
    let totalCollapsedHeight = 0;

    collapsedRanges.forEach(([start, end]) => {
      const rangeKey = `${start}-${end}`;
      // USER_EXPANDED 상태가 아닌 경우에만 높이를 계산
      if (end < targetHour && rangeStates[rangeKey] !== CollapsedRangeState.USER_EXPANDED) {
        // 원래 타임슬롯들의 총 높이
        const originalHeight = (end - start + 1) * (60 / ZOOM_LEVELS[zoomLevel].interval) * ZOOM_LEVELS[zoomLevel].height;
        // CollapsedRange의 높이
        const collapsedHeight = getCollapsedRangeHeight(start, end);
        // 차이를 누적
        totalCollapsedHeight += (originalHeight - collapsedHeight);
      }
    });

    return totalCollapsedHeight;
  }, [collapsedRanges, rangeStates, zoomLevel]);

  const onToggleCollapse = useCallback((hour) => {
    setCollapsedRanges(prev => {
      const existingRangeIndex = prev.findIndex(([start, end]) =>
        hour >= start && hour <= end
      );

      let newRanges = [...prev];
      let updatedRangeStates = { ...rangeStates };

      if (existingRangeIndex !== -1) {
        const [start, end] = prev[existingRangeIndex];
        const rangeKey = `${start}-${end}`;

        // 사용자가 명시적으로 확장한 범위는 제거하지 않음
        if (updatedRangeStates[rangeKey] === CollapsedRangeState.USER_EXPANDED) {
          return newRanges;
        }

        // 범위 제거
        newRanges = newRanges.filter((_, index) => index !== existingRangeIndex);
        updatedRangeStates[rangeKey] = CollapsedRangeState.EXPANDED;
      } else {
        // 새로운 범위 추가 로직
        if (!localItems.some(v => new Date(v.visitTime).getHours() === hour)) {
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
            newRanges = [...newRanges, newRange];
            updatedRangeStates[`${start}-${end}`] = CollapsedRangeState.COLLAPSED;
          }
        }
      }

      // 상태 업데이트
      setRangeStates(updatedRangeStates);

      // visibleItems 업데이트 (CollapsedRange 내의 아이템 필터링)
      const updatedVisibleItems = localItems.filter(item => {
        const itemHour = new Date(item.visitTime).getHours();
        return !newRanges.some(([start, end]) => {
          const rangeKey = `${start}-${end}`;
          return itemHour >= start &&
            itemHour <= end &&
            updatedRangeStates[rangeKey] !== CollapsedRangeState.USER_EXPANDED;
        });
      });

      setVisibleItems(updatedVisibleItems);

      return newRanges;
    });
  }, [localItems, rangeStates]);


  const handleRangeExpand = useCallback((start, end) => {
    // 범위를 USER_EXPANDED 상태로 변경
    updateRangeState(start, end, CollapsedRangeState.USER_EXPANDED);

    // visibleItems 업데이트
    const updatedVisibleItems = localItems.filter(item => {
      const itemHour = new Date(item.visitTime).getHours();
      return !collapsedRanges.some(([rStart, rEnd]) => {
        const rangeKey = `${rStart}-${rEnd}`;
        return itemHour >= rStart &&
          itemHour <= rEnd &&
          rangeStates[rangeKey] !== CollapsedRangeState.USER_EXPANDED;
      });
    });

    setVisibleItems(updatedVisibleItems);
  }, [localItems, collapsedRanges, rangeStates]);

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
    const localStartTime = new Date(startTime);
    const localMidnight = new Date(localStartTime);
    localMidnight.setHours(0, 0, 0, 0);

    const minutesSinceMidnight = differenceInMinutes(localStartTime, localMidnight);
    const slotHeight = ZOOM_LEVELS[zoomLevel].height;
    const slotInterval = ZOOM_LEVELS[zoomLevel].interval;

    // 기본 위치 계산
    let position = (minutesSinceMidnight / slotInterval) * slotHeight;

    // CollapsedRange에 의한 위치 조정
    const collapsedHeight = getPrecedingCollapsedHeight(startTime);
    position -= collapsedHeight;

    return position;
  }, [zoomLevel, getPrecedingCollapsedHeight]);


  const calculateHeight = useCallback((duration) => {
    const slotHeight = ZOOM_LEVELS[zoomLevel].height;
    const slotInterval = ZOOM_LEVELS[zoomLevel].interval;

    const height = (duration / slotInterval) * slotHeight;

    // console.log('calculateHeight:', {
    //   duration,
    //   slotHeight,
    //   slotInterval,
    //   calculatedHeight: height
    // });

    return height;
  }, [zoomLevel]);

  const getSlotWidth = useCallback(() => {
    const timeSlot = document.querySelector('.time-slot');
    return timeSlot?.offsetWidth || 0;
  }, []);

  const renderItems = useCallback(() => {
    const itemsByTime = {};
    visibleItems.forEach(item => {
      const timeKey = new Date(item.visitTime).getTime();
      if (!itemsByTime[timeKey]) itemsByTime[timeKey] = [];
      itemsByTime[timeKey].push(item);
    });

    return visibleItems.map((item) => {
      const startTime = new Date(item.visitTime);
      const timeKey = startTime.getTime();
      const sameTimeItems = itemsByTime[timeKey].filter(i => i.type === item.type);
      const itemIndex = sameTimeItems.findIndex(i => i.id === item.id);
      const topPosition = calculateTopPosition(startTime);
      const duration = item.duration || (item.type === 'bridge' ? 5 : 30);
      const itemHeight = calculateHeight(duration);

      const commonStyle = {
        position: 'absolute',
        top: topPosition,
        height: itemHeight,
        zIndex: selectedItem?.id === item.id ? 100 : 10
      };

      if (item.type === 'bridge') {
        const slotWidth = document.querySelector('.timeline-slots')?.offsetWidth - 100 || 0;
        const itemWidth = slotWidth / Math.max(sameTimeItems.length, 1);

        return (
          <TimeBridge
            key={`bridge-${item.id}`}
            {...item}
            style={{
              ...commonStyle,
              left: `${80 + (itemWidth * itemIndex)}px`,
              width: `${itemWidth * 0.9}px`,
            }}
            name={item.notes}
            isSelected={selectedItem?.id === item.id}
            onClick={onItemClick}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
          />
        );
      }

      return (
        <TimeCard
          key={`visit-${item.id}`}
          item={item}
          index={itemIndex}
          style={{
            ...commonStyle,
            left: `${80 + (itemIndex * 15)}px`,
            right: `${20 + ((sameTimeItems.length - itemIndex - 1) * 15)}px`,
          }}
          isDragging={false}
          isSelected={selectedItem?.id === item.id}
          onClick={onItemClick}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
        />
      );
    });
  }, [visibleItems, selectedItem?.id, calculateTopPosition, calculateHeight]);

return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis]}
    >
      <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
        <div className="relative timeline-slots">
          {renderTimeSlots()}
          {renderItems()}
        </div>
      </ScrollArea>
    </DndContext>
  );

};