import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventCardContent} from './EventCardContent';
import { VisitCardContent} from './VisitCardContent';

export const LocationCard = ({ 
  item, 
  index, 
  isSelected, 
  isEvent, 
  onClick, 
  onEdit, 
  onDelete 
}) => {
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
      {cardContent}
    </Card>
  );
};
