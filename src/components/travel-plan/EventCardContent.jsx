import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { formatDateStr } from '@/util/formatter';

export const EventCardContent = ({ item, isCollapsed = false }) => {
  const formatPeriod = (start, end) => {
    return `${formatDateStr(start)} ~ ${formatDateStr(end)}`;
  };

  return (
    <div style={{ flex: 1 }}>
      <Text size="lg" fw={500}>{item.name}</Text>
      <Text size="sm" c="dimmed">{item.description}</Text>
      <Stack spacing="xs" mt="md">
        <Text size="sm">기간: {formatPeriod(item.start_date, item.end_date)}</Text>
        {!isCollapsed && (
          <>
            <Text size="sm">
              영업시간: {format(new Date(`2000-01-01T${item.open_time}`), 'HH:mm')} ~ 
              {format(new Date(`2000-01-01T${item.close_time}`), 'HH:mm')}
            </Text>
            <Text size="sm">주소: {item.address}</Text>
            <Text size="sm">
              예약: {item.need_reservation ? "필요" : "불필요"}
            </Text>
          </>
        )}
        <Group spacing="xs">
          <Badge variant="light" color="blue">{item.category}</Badge>
          <Badge variant="light" color="green">{item.district}</Badge>
        </Group>
      </Stack>
    </div>
  );
};
