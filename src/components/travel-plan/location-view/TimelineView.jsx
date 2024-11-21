import React, { useState } from 'react';
import { Card, Text, Badge, ScrollArea, Stack, Group, Button  } from '@mantine/core';
import { format } from 'date-fns';

const TimeCard = ({ visit, index, isSelected, onClick, onEdit, onDelete }) => {
  return (
    <Card 
      key={visit.id} 
      shadow="sm" 
      p="sm" 
      withBorder
      onClick={() => onClick(visit)}
      style={{ 
        position: 'absolute',
        left: `${80 + (index * 20)}px`,
        right: `${20 - (index * 20)}px`,
        top: '10px',
        borderLeft: '4px solid #228be6',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
        cursor: 'pointer',
        zIndex: isSelected ? 1000 : index,
        transition: 'all 0.2s ease'
      }}
    >
      <Text weight={500} size="sm" mb="xs">
        {visit.tp_events?.name}
      </Text>
      <Text size="sm" color="dimmed" mb="xs" lineClamp={1}>
        {visit.tp_events?.description}
      </Text>
      <Group position="apart">
        <Group spacing={5}>
          {visit.tp_events?.tags?.split(',').map((tag, index) => (
            <Badge key={index} size="sm" variant="outline">
              {tag.trim()}
            </Badge>
          ))}
        </Group>
        <Group spacing={5}>
          <Button 
            variant="subtle" 
            size="xs" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(visit);
            }}
          >
            Edit
          </Button>
          <Button 
            variant="subtle" 
            color="red" 
            size="xs" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(visit.id);
            }}
          >
            Delete
          </Button>
        </Group>
      </Group>
    </Card>
  );
};

const TimeSlot = ({ time, visits, selectedItem, onItemClick, onItemEdit, onItemDelete }) => {
  const formattedTime = format(time, 'HH:mm');
  
  return (
    <div style={{ position: 'relative', height: '80px', borderBottom: '1px dashed #ddd' }}>
      <Text 
        size="sm" 
        weight={500} 
        color="dimmed"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        {formattedTime}
      </Text>
      
      {visits.map((visit, index) => (
        <TimeCard
          key={visit.id}
          visit={visit}
          index={index}
          isSelected={selectedItem?.id === visit.id}
          onClick={onItemClick}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
        />
      ))}
    </div>
  );
};

export const TimelineView = ({ 
  visits, 
  date, 
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete 
}) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const slotDate = new Date(date);
    slotDate.setHours(i, 0, 0, 0);
    return slotDate;
  });

  const getVisitsForTimeSlot = (time) => {
    return visits.filter(visit => {
      const visitTime = new Date(visit.visit_time);
      return visitTime.getHours() === time.getHours();
    });
  };

  return (
    <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
      <Stack spacing={0} p="md">
        {timeSlots.map((time) => (
          <TimeSlot 
            key={time.getTime()} 
            time={time}
            visits={getVisitsForTimeSlot(time)}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onDelete={onItemDelete}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
};