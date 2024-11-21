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
  Collapse ,
  Paper
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { formatDateForDB } from '@/util/formatter'
import { MapView } from './MapView';

export default function EventForm({ onSubmit, initialData }) {
  const [opened, setOpened] = useState(false);
  const [formMap, setFormMap] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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

  // 지도 초기화
  useEffect(() => {
    if (!opened) return;

    const container = document.getElementById('form-map');
    if (!container) return;

    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3
    };

    const map = new kakao.maps.Map(container, options);
    const geocoder = new kakao.maps.services.Geocoder();

    setFormMap(map);
    setGeocoder(geocoder);

    // 초기 데이터가 있는 경우 해당 위치로 이동
    if (formData.lat && formData.lng) {
      const position = new kakao.maps.LatLng(formData.lat, formData.lng);
      map.setCenter(position);
      updateMarker(position);
    }
  }, [opened]);

  // 마커 업데이트 함수
  const updateMarker = (position) => {
    if (selectedMarker) {
      selectedMarker.setMap(null);
    }

    const marker = new kakao.maps.Marker({
      position: position,
      map: formMap
    });

    setSelectedMarker(marker);
  };

  // 주소 검색 처리
  const handleAddressSearch = () => {
    if (!geocoder) return;

    geocoder.addressSearch(formData.address, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

        setFormData(prev => ({
          ...prev,
          lat: coords.getLat(),
          lng: coords.getLng(),
          road_address: result[0].road_address?.address_name || '',
          jibun_address: result[0].address.address_name || ''
        }));

        formMap.setCenter(coords);
        updateMarker(coords);
      }
    });
  };

  // 지도 클릭 처리
  const handleMapClick = (e) => {
    const clickedLatLng = e.latLng;

    geocoder.coord2Address(clickedLatLng.getLng(), clickedLatLng.getLat(), (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const addr = result[0];

        setFormData(prev => ({
          ...prev,
          lat: clickedLatLng.getLat(),
          lng: clickedLatLng.getLng(),
          road_address: addr.road_address?.address_name || '',
          jibun_address: addr.address?.address_name || '',
          address: addr.road_address?.address_name || addr.address?.address_name || ''
        }));

        updateMarker(clickedLatLng);
      }
    });
  };

  // 모달 열릴 때 지도 이벤트 리스너 추가
  useEffect(() => {
    if (!formMap) return;

    const clickListener = kakao.maps.event.addListener(formMap, 'click', handleMapClick);

    return () => {
      kakao.maps.event.removeListener(clickListener);
    };
  }, [formMap]);

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

const handleLocationSelect = (latlng) => {
  // 선택된 좌표에 대한 주소 정보 조회
  geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
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
        <Grid>
          {/* 왼쪽: 폼 입력 영역 */}
          <Grid.Col span={6}>
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

                    <Collapse in={showLocationPicker}>
                      <Paper shadow="sm" p="md" mt="md">
                        <Group position="apart" mb="md">
                          <Text weight={500}>위치 선택</Text>
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => setShowLocationPicker(false)}
                          >
                            접기
                          </Button>
                        </Group>
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
          </Grid.Col>

          {/* 오른쪽: 지도 영역 */}
          <Grid.Col span={6}>
            <Box
              id="form-map"
              sx={{
                height: '400px',
                border: '1px solid #eee',
                borderRadius: '4px'
              }}
            />
            <Text size="sm" mt="xs" color="dimmed">
              지도를 클릭하여 위치를 직접 선택할 수 있습니다.
            </Text>
          </Grid.Col>
        </Grid>
      </Modal>
    </>
  );
}