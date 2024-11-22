import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import {LocationCard} from './LocationCard';


export const LocationList = ({ items, activeTab, selectedItem, onItemClick, onItemEdit, onItemDelete, type }) => {
  return (
    <div style={{ padding: '1rem', overflowY: 'auto' }}>
      <Stack spacing="md">
        {items.map((item, index) => (
          <LocationCard
            key={item.id}
            item={item}
            index={item.pin_idx}
            isSelected={selectedItem?.id === item.id}
            isEvent={type === 'events'}
            onClick={onItemClick}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
            type={type}
          />
        ))}
      </Stack>
    </div>
  );
};