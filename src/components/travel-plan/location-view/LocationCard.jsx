import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventCardContent } from '../EventCardContent';
import { VisitCardContent } from '../VisitCardContent';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions'

export const LocationCard = ({
  item,
  index,
  isSelected,
  isEvent,
  onClick,
  onEdit,
  onDelete,
  type,
  color
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardContent = isEvent ? (
    <EventCardContent item={item} />
  ) : (
    <VisitCardContent item={item} />
  );
  return (
    <Card
      shadow="sm"
      padding="md"
      onClick={() => onClick(item)}
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6'
      }}
    >
      <Group align="flex-start" noWrap>
        <LocationMarker
          index={index}
          isEvent={isEvent}
          color={color}
        />
        {cardContent}
      </Group>
      {isSelected && (
        <CollapsibleEventActions
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          type={type}
          isExpanded={isExpanded}
          onToggle={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        />
      )}
    </Card>
  );
};