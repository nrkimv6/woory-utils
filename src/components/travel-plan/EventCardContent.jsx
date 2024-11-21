import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
export const EventCardContent = ({ item }) => {
  return (
    <div style={{ flex: 1 }}>
      <Text size="lg" fw={500}>{item.name}</Text>
      <Text size="sm" c="dimmed">{item.description}</Text>
      <Stack spacing="xs" mt="md">
        <Text size="sm">기간: {item.start_date} ~ {item.end_date}</Text>
        <Text size="sm">시간: {item.open_time} ~ {item.close_time}</Text>
        <Text size="sm">주소: {item.address}</Text>
        <Text size="sm">
          예약: {item.need_reservation ? "필요" : "불필요"}
        </Text>
        <Group spacing="xs">
          <Badge variant="light" color="blue">{item.category}</Badge>
          <Badge variant="light" color="green">{item.district}</Badge>
        </Group>
      </Stack>
    </div>
  );
};
