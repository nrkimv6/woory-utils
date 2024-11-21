import React from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group } from '@mantine/core';
import { format } from 'date-fns';

const TimeSlot = ({ time, visits }) => {
  console.log('timeSlot '+formattedTime.toString());
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <Group position="apart" mb="xs">
        <Text size="sm" weight={500} color="dimmed">
          {formattedTime}
        </Text>
        <div style={{ flex: 1, borderBottom: '1px dashed #ddd', marginLeft: '1rem' }} />
      </Group>
      {visits.map((visit) => (
        <Card 
          key={visit.id} 
          shadow="sm" 
          p="sm" 
          withBorder
          mb="xs"
          style={{ 
            borderLeft: '4px solid #228be6',
            marginLeft: '2rem' 
          }}
        >
          <Text weight={500} size="sm" mb="xs">
            {visit.tp_events.title}
          </Text>
          <Text size="sm" color="dimmed" mb="xs">
            {visit.tp_events.description}
          </Text>
          <Group spacing={5}>
            {visit.tp_events.tags?.split(',').map((tag, index) => (
              <Badge 
                key={index} 
                size="sm" 
                variant="outline"
              >
                {tag.trim()}
              </Badge>
            ))}
          </Group>
        </Card>
      ))}
    </div>
  );
};

export const TimelineView = ({ visits, date }) => {
  // 24시간 타임슬롯 생성
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const slotDate = new Date(date);
    slotDate.setHours(i, 0, 0, 0);
    return slotDate;
  });

  // 각 시간대별 방문 계획 그룹화
  const getVisitsForTimeSlot = (time) => {
    return visits.filter(visit => {
      const visitTime = new Date(visit.visit_date);
      return visitTime.getHours() === time.getHours();
    });
  };

  return (
    <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
      <Stack spacing="md" p="md">
        {timeSlots.map((time) => (
          <TimeSlot 
            key={time.getTime()} 
            time={time}
            visits={getVisitsForTimeSlot(time)}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
};