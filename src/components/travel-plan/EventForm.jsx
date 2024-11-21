"use client"

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Text,
  TextInput, 
  NumberInput,
  Checkbox, 
  Textarea, 
  Button, 
  Modal,
  Select,
  Grid,
  Stack,
  Group,
  Box
} from '@mantine/core';
import { DatePicker, TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';

export default function EventForm({ map, onSubmit, initialData }) {
  const [opened, setOpened] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: null,
    start_date: new Date(),
    end_date: new Date(),
    open_time: '10:00',
    close_time: '20:00',
    address: null,
    lat: null,
    lng: null,
    need_reservation: false,
    category: '',
    district: null,
    url: null,
    content: null
  });

  const handleMapClick = (map) => {
    const clickListener = kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      setFormData(prev => ({
        ...prev,
        lat: latlng.getLat(),
        lng: latlng.getLng()
      }));
      kakao.maps.event.removeListener(clickListener);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanedData = {
      ...formData,
      lat: formData.lat || null,
      lng: formData.lng || null,
      description: formData.description || null,
      address: formData.address || null,
      url: formData.url || null,
      district: formData.district || null
    };
    
    try {
      await onSubmit(cleanedData);
      notifications.show({
        title: "성공",
        message: "이벤트가 등록되었습니다.",
        color: "green"
      });
      setOpened(false);
    } catch (error) {
      notifications.show({
        title: "오류",
        message: "이벤트 등록에 실패했습니다.",
        color: "red"
      });
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>
        이벤트 {initialData ? '수정' : '추가'}
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`이벤트 ${initialData ? '수정' : '추가'}`}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="이름"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Select
                  label="카테고리"
                  value={formData.category}
                  onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  data={["화장품", "게임", "연예인", "캐릭터"].map(cat => ({
                    value: cat,
                    label: cat
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="설명"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <DatePicker
                  label="시작일"
                  value={new Date(formData.start_date)}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    start_date: format(date, 'yyyy-MM-dd')
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <DatePicker
                  label="종료일"
                  value={new Date(formData.end_date)}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    end_date: format(date, 'yyyy-MM-dd')
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TimeInput
                  label="오픈 시간"
                  value={formData.open_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    open_time: e.target.value 
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TimeInput
                  label="마감 시간"
                  value={formData.close_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    close_time: e.target.value 
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  label="주소"
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: e.target.value 
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Group align="center" spacing="md">
                  <Button onClick={() => handleMapClick(map)}>
                    지도에서 위치 선택
                  </Button>
                  <Box>
                    <Group spacing="sm">
                      <NumberInput
                        label="위도"
                        precision={6}
                        value={formData.lat || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          lat: value
                        }))}
                      />
                      <NumberInput
                        label="경도"
                        precision={6}
                        value={formData.lng || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          lng: value
                        }))}
                      />
                    </Group>
                  </Box>
                  <Text size="sm">
                    {formData.lat && formData.lng ?
                      `선택된 좌표: ${formData.lat}, ${formData.lng}` :
                      '지도를 클릭하여 위치를 선택하세요'}
                  </Text>
                </Group>
              </Grid.Col>

              <Grid.Col span={6}>
                <Checkbox
                  label="예약 필요"
                  checked={formData.need_reservation}
                  onChange={(event) => setFormData(prev => ({ 
                    ...prev, 
                    need_reservation: event.currentTarget.checked 
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TextInput
                  label="URL"
                  value={formData.url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    url: e.target.value 
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="상세 내용"
                  value={formData.content || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))}
                  rows={4}
                />
              </Grid.Col>
            </Grid>

            <Group position="right" mt="md">
              <Button type="submit">
                {initialData ? '수정' : '추가'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}