import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import {LocationCard} from './LocationCard';
import {PASTEL_COLORS} from '@/util/colors'


export const LocationList = ({ items, activeTab, selectedItem, onItemClick, onItemEdit, onItemDelete, type }) => {
  return (
    <div style={{ width: '33.333%', padding: '1rem', overflowY: 'auto' }}>
      <Stack spacing="md">
        {items.map((item, index) => (
          <LocationCard
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedItem?.id === item.id}
            isEvent={type === 'events'}
            onClick={onItemClick}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
            type={type}
            color={PASTEL_COLORS[index % PASTEL_COLORS.length]}
          />
        ))}
      </Stack>
    </div>
  );
};