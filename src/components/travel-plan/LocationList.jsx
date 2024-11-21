import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import {LocationCard} from './LocationCard';

export const LocationList = ({ 
  items, 
  activeTab, 
  selectedItem,
  onItemClick, 
  onItemEdit,
  onItemDelete 
}) => {
  return (
    <Stack spacing="md">
      {items.map((item, index) => (
        <LocationCard
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedItem?.id === item.id}
          isEvent={activeTab === "events"}
          onClick={onItemClick}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
        />
      ))}
    </Stack>
  );
};