import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';
const categories = ["화장품", "게임", "연예인", "캐릭터"];
const districts = ["동대문", "성수", "여의도", "잠실", "강남", "압구정", "홍대"];

export const Filters = ({ filterType, filters, onFilterChange }) => {
  return (
    <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid #eee' }}>
      <Group align="flex-start" spacing="md">
        <DateInput
          value={filters.date}
          onChange={(value) => onFilterChange('date', value)}
          placeholder="날짜 선택"
          valueFormat="YYYY-MM-DD"
        />
        {filterType === "events" && (
          <Stack spacing="sm">
            <Select
              data={[
                { value: 'all', label: '전체' },
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
              value={filters.category}
              onChange={(value) => onFilterChange('category', value)}
              placeholder="카테고리 선택"
            />
            <Select
              data={[
                { value: 'all', label: '전체' },
                ...districts.map(district => ({ value: district, label: district }))
              ]}
              value={filters.district}
              onChange={(value) => onFilterChange('district', value)}
              placeholder="지역 선택"
            />
          </Stack>
        )}
      </Group>
    </div>
  );
};