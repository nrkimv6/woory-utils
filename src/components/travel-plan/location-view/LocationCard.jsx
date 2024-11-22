import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventCardContent } from '../EventCardContent';
import { VisitCardContent } from '../VisitCardContent';
import CollapsibleEventActions from '@/components/travel-plan/location-view/CollapsibleEventActions'
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { PASTEL_COLORS } from '@/util/colors';

export const LocationCard = ({
  item,
  index,
  isSelected,
  isEvent,
  onClick,
  onEdit,
  onDelete,
  type
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardContent = isEvent ? (
    <EventCardContent item={item} isCollapsed={!isSelected}/>
  ) : (
    <VisitCardContent item={item} isCollapsed={!isSelected}/>
  );
  // console.log('LocationCard Marker Index'+index+', color:'+PASTEL_COLORS[index % PASTEL_COLORS.length]);

  return (
    <Card
      shadow="sm"
      padding="md"
      onClick={() => onClick(item)}
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        border: isSelected ? '2px solid #228be6' : '1px solid #dee2e6',
        position: 'relative'
      }}
    >
      <Group align="flex-start" nowrap>
        <LocationMarker
              markerText={item.markerText}
          color={PASTEL_COLORS[index % PASTEL_COLORS.length]}
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