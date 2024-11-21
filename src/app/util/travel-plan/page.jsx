"use client"
import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { format } from 'date-fns';
import { eventApi, visitApi } from '@/lib/travel-plan/api';

import EventForm from '@/components/travel-plan/EventForm';
import VisitForm from '@/components/travel-plan/VisitForm';
import LocationMarker from '@/components/travel-plan/LocationMarker';
import { EventActions } from '@/components/travel-plan/EventActions'

const PASTEL_COLORS = [
  '#FFB3BA', // 파스텔 핑크
  '#BAFFC9', // 파스텔 그린
  '#BAE1FF', // 파스텔 블루
  '#FFFFBA', // 파스텔 옐로우
  '#FFB3F7', // 파스텔 퍼플
  '#E0BBE4', // 라벤더
  '#957DAD', // 라이트 퍼플
  '#FEC8D8'  // 라이트 핑크
];

const categories = ["화장품", "게임", "연예인", "캐릭터"];
const districts = ["동대문", "성수", "여의도", "잠실", "강남", "압구정", "홍대"];

const KakaoMapList = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [customOverlays, setCustomOverlays] = useState([]);
  const [events, setEvents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState("events");


  // 이벤트 목록 조회
  const fetchEvents = async () => {
    try {
      const data = await eventApi.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 방문 계획 목록 조회
  const fetchVisits = async (eventId = null) => {
    try {
      const data = await visitApi.getVisits(eventId);
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  // 이벤트 추가 핸들러
  const handleEventSubmit = async (eventData) => {
    try {
      await eventApi.addEvent(eventData);
      fetchEvents(); // 목록 새로고침
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // 방문 계획 추가 핸들러
  const handleVisitSubmit = async (visitData) => {
    try {
      await visitApi.addVisit(visitData);
      fetchVisits(visitData.event_id); // 목록 새로고침
    } catch (error) {
      console.error('Error adding visit:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // 카카오맵 스크립트 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=ca0816bee0db23ce6c74a1cb0c58b9b4&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 7
        };
        const kakaoMap = new kakao.maps.Map(container, options);
        setMap(kakaoMap);
      });
    };
  }, []);
  useEffect(() => {
    let filtered = activeTab === "events" ? events : visits;

    // 날짜 필터링
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(item =>
        item.start_date <= dateStr && dateStr <= item.end_date
      );
    }

    // 카테고리 필터링
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item =>
        item.category === selectedCategory
      );
    }

    // 지역 필터링
    if (selectedDistrict && selectedDistrict !== 'all') {
      filtered = filtered.filter(item =>
        item.district === selectedDistrict
      );
    }

    console.log('Filtered locations:', filtered); // 디버깅용
    setFilteredLocations(filtered);
  }, [selectedDate, selectedCategory, selectedDistrict, events, visits, activeTab]);
  const updateMarkers = (locations) => {
    if (!map) return;

    customOverlays.forEach(overlay => overlay.setMap(null));
    const newOverlays = [];

    locations.forEach((location, index) => {
      if (location.lat && location.lng) {  // 좌표가 있는 경우만 마커 생성
        const position = new window.kakao.maps.LatLng(location.lat, location.lng);
        const markerText = activeTab === "events"
          ? String.fromCharCode(65 + index)
          : (index + 1).toString();

        // 마커 컨텐츠
        const markerContent = `
        <div style="
          background: ${PASTEL_COLORS[index % PASTEL_COLORS.length]};
          padding: 5px 10px;
          border-radius: ${activeTab === "events" ? '4px' : '50%'};
          color: #333;
          font-weight: bold;
          text-align: center;
          min-width: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        ">
          ${markerText}
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid ${PASTEL_COLORS[index % PASTEL_COLORS.length]};
          "></div>
        </div>
      `;

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: markerContent,
          map: map,
          yAnchor: 1.3
        });

        newOverlays.push(customOverlay);
      }
    });

    setCustomOverlays(newOverlays);
  };
  // 위치 클릭 핸들러
  const handleLocationClick = (location) => {
    setSelectedLocation(location);

    if (map) {
      // 선택된 위치로 부드럽게 이동
      const moveLatLon = new window.kakao.maps.LatLng(location.lat, location.lng);
      map.panTo(moveLatLon);

      // 선택된 마커 강조
      markers.forEach((marker, idx) => {
        if (locations[idx].id === location.id) {
          // 선택된 마커/오버레이 강조 효과
          customOverlays[idx].setZIndex(100);
          marker.setZIndex(100);
        } else {
          customOverlays[idx].setZIndex(1);
          marker.setZIndex(1);
        }
      });
    }
  };

  // 초기 마커 표시를 위한 useEffect
  useEffect(() => {
    if (map) {
      updateMarkers(filteredLocations);
    }
  }, [map]); // map이 생성되면 마커 표시


  // 필터링된 locations이 변경될 때 마커 업데이트
  useEffect(() => {
    updateMarkers(filteredLocations);
  }, [filteredLocations]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Group position="right" p="md">
        <EventForm map={map} onSubmit={handleEventSubmit} />
        {selectedLocation && (
          <VisitForm eventId={selectedLocation.id} onSubmit={handleVisitSubmit} />
        )}
      </Group>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="events">이벤트 목록</Tabs.Tab>
          <Tabs.Tab value="visits">방문 계획</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="events">
          {/* 기존의 필터링 섹션 */}
          <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid #eee' }}>
            <Group align="flex-start" spacing="md">
              <div style={{ width: '256px' }}>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>

              <Stack spacing="sm">
                <Select
                  data={[
                    { value: 'all', label: '전체' },
                    ...categories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="카테고리 선택"
                />

                <Select
                  data={[
                    { value: 'all', label: '전체' },
                    ...districts.map(district => ({ value: district, label: district }))
                  ]}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  placeholder="지역 선택"
                />
              </Stack>
            </Group>
          </div>

          {/* 메인 콘텐츠 */}
          <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ width: '33.333%', padding: '1rem', overflowY: 'auto' }}>
              <Stack spacing="md">

                {filteredLocations.map((location, index) => (
                  <Card key={location.id} shadow="sm" padding="md">
                    <Group align="flex-start" noWrap>
                      <LocationMarker
                        index={index}
                        isEvent={activeTab === "events"}
                        color={PASTEL_COLORS[index % PASTEL_COLORS.length]}
                      />
                      <div style={{ flex: 1 }}>
                        <Text size="lg" fw={500}>{location.name}</Text>
                        <Text size="sm" c="dimmed">{location.description}</Text>
                        <Stack spacing="xs" mt="md">
                          <Text size="sm">기간: {location.start_date} ~ {location.end_date}</Text>
                          <Text size="sm">시간: {location.open_time} ~ {location.close_time}</Text>
                          <Text size="sm">주소: {location.address}</Text>
                          <Text size="sm">
                            예약: {location.need_reservation ? "필요" : "불필요"}
                          </Text>
                          <Group spacing="xs">
                            <Badge variant="light" color="blue">
                              {location.category}
                            </Badge>
                            <Badge variant="light" color="green">
                              {location.district}
                            </Badge>
                          </Group>
                        </Stack>
                      </div>
                    </Group>
                    <EventActions
                      event={location}
                      onEdit={() => setEditingEvent(location)}
                      onDelete={() => handleDelete(location.id)}
                    />
                  </Card>
                ))}
              </Stack>
            </div>
            <div style={{ width: '66.666%', position: 'relative' }}>
<div id="map" style={{ 
  width: '100%', 
  height: '100%',  // 66.666%에서 100%로 변경
  position: 'absolute',
  top: 0,
  left: 0
}} />

              {selectedLocation && (
                <Card
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    padding: '1rem',
                    background: 'white'
                  }}
                >
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {selectedLocation.name}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>기간</p>
                      <p>{selectedLocation.startDate} ~ {selectedLocation.endDate}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>운영시간</p>
                      <p>{selectedLocation.openTime} ~ {selectedLocation.closeTime}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontWeight: 'bold' }}>주소</p>
                      <p>{selectedLocation.address}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>예약여부</p>
                      <p>{selectedLocation.needReservation ? "사전예약 필요" : "예약 불필요"}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="visits">
          {/* 방문 계획 탭의 유사한 구조 */}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default KakaoMapList;