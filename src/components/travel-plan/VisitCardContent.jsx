import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import {formatDateTime} from '@/util/formatter'

export const VisitCardContent = ({ item, isCollapsed = false }) => {
  return (
    <div style={{ flex: 1 }}>
      <Text size="lg" fw={500}>{item.tp_events?.name}</Text>
      <Stack spacing="xs" mt="md">
        {!isCollapsed && (
          <>
            <Text size="sm">방문예정: {formatDateTime(item.visit_time)}</Text>
            <Text size="sm">방문순서: {item.visit_order || '-'}</Text>
            {item.is_reserved && (
              <Text size="sm">예약시간: {formatDateTime(item.reservation_time)}</Text>
            )}
          </>
        )}
        <Group spacing="xs">
          {item.is_important && (
            <Badge variant="filled" color="red">중요</Badge>
          )}
          {item.is_reserved && (
            <Badge variant="filled" color="green">예약완료</Badge>
          )}
        </Group>
        {!isCollapsed && item.notes && (
          <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{item.notes}</Text>
        )}
      </Stack>
    </div>
  );
};