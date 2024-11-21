"use client"
import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { format } from 'date-fns';
import { eventApi, visitApi } from '@/lib/travel-plan/api';

import EventForm from '@/components/travel-plan/EventForm';
import VisitForm from '@/components/travel-plan/VisitForm';
import { Filters } from '@/components/travel-plan/Filters';
import { LocationList } from '@/components/travel-plan/LocationList';
import { MapView } from '@/components/travel-plan/MapView';
import { useLocationFilter } from '@/hooks/travel-plan/useLocationFilter'
import {PASTEL_COLORS} from '@/util/colors'

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
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const { filters, setFilters, filteredItems } = useLocationFilter(activeTab, events, visits);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 이벤트 카드 클릭 핸들러
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedLocation(event);
    if (map && event.lat && event.lng) {
      const moveLatLon = new window.kakao.maps.LatLng(event.lat, event.lng);
      map.panTo(moveLatLon);
    }
  };

  // 방문계획 카드 클릭 핸들러
  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    // visit.tp_events에 연결된 이벤트 정보가 있으므로 이를 이용
    if (visit.tp_events) {
      setSelectedLocation(visit.tp_events);
      if (map && visit.tp_events.lat && visit.tp_events.lng) {
        const moveLatLon = new window.kakao.maps.LatLng(
          visit.tp_events.lat,
          visit.tp_events.lng
        );
        map.panTo(moveLatLon);
      }
    }
  };

  // 탭 변경 핸들러 수정
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedEvent(null);
    setSelectedVisit(null);
    setSelectedLocation(null);

    // 탭에 따른 데이터 로드
    if (value === "events") {
      fetchEvents();
    } else {
      fetchVisits();
    }
  };


  const handleDelete = async (id, type = 'event') => {
    try {
      if (type === 'event') {
        await eventApi.deleteEvent(id);
        fetchEvents();
      } else {
        await visitApi.deleteVisit(id);
        fetchVisits();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };


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
    fetchVisits();
  }, []);


  // 초기 로드도 수정
  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    } else {
      fetchVisits();
    }
  }, [activeTab]);

  // useEffect(() => {
  //   // 카카오맵 스크립트 로드
  //   const script = document.createElement('script');
  //   script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=ca0816bee0db23ce6c74a1cb0c58b9b4&autoload=false`;
  //   document.head.appendChild(script);

  //   script.onload = () => {
  //     kakao.maps.load(() => {
  //       const container = document.getElementById('map');
  //       const options = {
  //         center: new kakao.maps.LatLng(37.5665, 126.9780),
  //         level: 7
  //       };
  //       const kakaoMap = new kakao.maps.Map(container, options);
  //       setMap(kakaoMap);
  //     });
  //   };
  // }, []);
  useEffect(() => {
    // 카카오맵 스크립트 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=ca0816bee0db23ce6c74a1cb0c58b9b4&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      kakao.maps.load(() => {
        // 현재 활성 탭에 해당하는 map element 선택
        const container = document.getElementById(`map-${activeTab}`);
        if (!container) return;

        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 7
        };
        const kakaoMap = new kakao.maps.Map(container, options);
        setMap(kakaoMap);
      });
    };
  }, [activeTab]);

  useEffect(() => {
    setFilteredLocations(filteredItems);
  }, [filteredItems]);

  const fitBoundsToMarkers = (map, locations) => {
    if (!locations?.length) return;

    const bounds = new kakao.maps.LatLngBounds();

    locations.forEach(location => {
      const lat = activeTab === "events" ? location.lat : location.tp_events?.lat;
      const lng = activeTab === "events" ? location.lng : location.tp_events?.lng;

      if (lat && lng) {
        bounds.extend(new kakao.maps.LatLng(lat, lng));
      }
    });

    map.setBounds(bounds);
  };

  const updateMarkers = (locations) => {
    if (!map) return;

    customOverlays.forEach(overlay => overlay.setMap(null));
    const newOverlays = [];

    locations.forEach((location, index) => {
      // 방문 계획일 경우 연결된 이벤트의 좌표 사용
      const lat = activeTab === "events" ? location.lat : location.tp_events?.lat;
      const lng = activeTab === "events" ? location.lng : location.tp_events?.lng;

      if (lat && lng) {
        const position = new window.kakao.maps.LatLng(lat, lng);
        const markerText = activeTab === "events"
          ? String.fromCharCode(65 + index)
          : (index + 1).toString();

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
    fitBoundsToMarkers(map, locations);
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
        <EventForm
          map={map}
          onSubmit={handleEventSubmit}
          initialData={editingEvent}
        />
        {selectedLocation && (
          // <VisitForm eventId={selectedLocation.id} onSubmit={handleVisitSubmit} />
          <VisitForm
            eventId={selectedEvent?.id || selectedVisit?.tp_events?.id}
            onSubmit={handleVisitSubmit}
          />
        )}
      </Group>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Tab value="events">이벤트 목록</Tabs.Tab>
          <Tabs.Tab value="visits">방문 계획</Tabs.Tab>
        </Tabs.List>

        {["events", "visits"].map(tabValue => (
          <Tabs.Panel key={tabValue} value={tabValue}>
            <Filters
              activeTab={tabValue}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <div style={{ display: 'flex', flex: 1 }}>
              <LocationList
                items={filteredItems}
                activeTab={tabValue}
                selectedItem={tabValue === "events" ? selectedEvent : selectedVisit}
                onItemClick={tabValue === "events" ? handleEventClick : handleVisitClick}
                onItemEdit={setEditingEvent}
                onItemDelete={(id) => handleDelete(id, tabValue)}
                type={tabValue}
              />
              <MapView
                items={filteredItems}
                selectedLocation={selectedLocation}
                activeTab={tabValue}
              />
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
};
export default KakaoMapList;