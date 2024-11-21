
"use client"
import { useState, useEffect } from 'react';
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
  Box,
  Collapse,
  Paper
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { formatDateForDB } from '@/util/formatter';
import { MapView } from './MapView';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
export default function EventForm({ onSubmit, initialData }) {

  const [opened, setOpened] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [geocoder, setGeocoder] = useState(null);
  const isKakaoLoaded = useKakaoLoader();

  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: null,
    start_date: new Date(),
    end_date: new Date(),
    open_time: '10:00',
    close_time: '20:00',
    address: null,
    road_address: null,
    jibun_address: null,
    address_detail: null,
    lat: null,
    lng: null,
    need_reservation: false,
    category: '',
    district: null,
    url: null,
    content: null
  });

  useEffect(() => {
    if (!isKakaoLoaded) return;
    setGeocoder(new window.kakao.maps.services.Geocoder());
  }, [isKakaoLoaded]);
  // 주소 검색 처리
  const handleAddressSearch = () => {
    if (!geocoder || !formData.address) return;

    geocoder.addressSearch(formData.address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const lat = Number(result[0].y);
        const lng = Number(result[0].x);
        
        setFormData(prev => ({
          ...prev,
          lat: lat,
          lng: lng,
          road_address: result[0].road_address?.address_name || '',
          jibun_address: result[0].address.address_name || ''
        }));
      }
    });
  };

  // ... 나머지 EventForm 코드는 동일

  const handleLocationSelect = (latlng) => {
    if (!geocoder) return;

    geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const addr = result[0];

        setFormData(prev => ({
          ...prev,
          lat: latlng.getLat(),
          lng: latlng.getLng(),
          road_address: addr.road_address?.address_name || '',
          jibun_address: addr.address?.address_name || '',
          address: addr.road_address?.address_name || addr.address?.address_name || ''
        }));
      }
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
      district: formData.district || null,
      start_date: formatDateForDB(formData.start_date),
      end_date: formatDateForDB(formData.end_date),
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
            <Grid>
              <Grid.Col span={6}>
                <DateInput
                  label="시작일"
                  value={new Date(formData.start_date)}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    start_date: format(date, 'yyyy-MM-dd')
                  }))}
                  valueFormat="YYYY-MM-DD"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label="종료일"
                  value={new Date(formData.end_date)}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    end_date: format(date, 'yyyy-MM-dd')
                  }))}
                  valueFormat="YYYY-MM-DD"
                />
              </Grid.Col>
            </Grid>

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
            <Group position="apart">
              <Text weight={500}>위치 정보</Text>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
              >
                {showLocationPicker ? '접기' : '펼치기'}
              </Button>
            </Group>
            
            <Collapse in={showLocationPicker}>
              <Paper shadow="sm" p="md" mt="md">
                <Group spacing="xs" mb="md">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="주소 검색"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                  />
                  <Button onClick={handleAddressSearch}>검색</Button>
                </Group>
                <Box sx={{ height: 400 }}>
                  <MapView
                    items={[formData]}
                    type="events-form"
                    onLocationSelect={handleLocationSelect}
                  />
                </Box>
                {formData.lat && formData.lng && (
                  <Text size="sm" color="dimmed" mt="xs">
                    선택된 위치: {formData.road_address || formData.jibun_address}
                  </Text>
                )}
              </Paper>
            </Collapse>
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
            <Button type="submit">
              {initialData ? '수정' : '추가'}
            </Button>
            </Stack>
            </form>
      </Modal>
    </>
  );
}