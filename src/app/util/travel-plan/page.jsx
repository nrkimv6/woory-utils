"use client"
import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { eventApi, visitApi } from '@/lib/travel-plan/api';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';

import EventForm from '@/components/travel-plan/EventForm';
import VisitForm from '@/components/travel-plan/VisitForm';
import { Filters } from '@/components/travel-plan/Filters';
import { LocationView } from '@/components/travel-plan/LocationView';
import { MapView } from '@/components/travel-plan/MapView';
import { useLocationFilter } from '@/hooks/travel-plan/useLocationFilter';
import { showSuccess, showError } from '@/util/notification';

// KakaoMapList.jsx
const KakaoMapList = () => {
  const [activeTab, setActiveTab] = useState("events");

  const [viewMode, setViewMode] = useState('card'); // 'card' | 'timeline'
  const isKakaoLoaded = useKakaoLoader();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  // const [selectedEvent, setSelectedEvent] = useState(null);
  // const [selectedVisit, setSelectedVisit] = useState(null);
  const { filters, setFilters, filteredItems } = useLocationFilter(activeTab, events, visits);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
// const handleEventClick = (event) => {
//   setSelectedEvent(event);
//   setSelectedLocation({
//     id: event.id,
//     lat: event.lat,
//     lng: event.lng,
//     pin_idx: event.pin_idx
//   });
// };

// const handleVisitClick = (visit) => {
//   setSelectedVisit(visit);
//   setSelectedLocation({
//     id: visit.id,
//     lat: visit.tp_events?.lat,
//     lng: visit.tp_events?.lng,
//     pin_idx: visit.pin_idx
//   });
// };

const getLocationInfo = (item, type) => {
  if (type === 'events') {
    const obj = {
      id: item.id,
      event_id: item.id,
      lat: item.lat,
      lng: item.lng,
      pin_idx: item.pin_idx,
      markerText: item.markerText,
      isValid: () => {
        return obj.id && obj.lat && obj.lng
      },
      ...item
    };
    return obj;
  } else {
    const obj = {
      id: item.id,
      event_id: item.tp_events?.id,
      lat: item.tp_events?.lat,
      lng: item.tp_events?.lng,
      pin_idx: item.pin_idx,
      markerText: item.markerText,
      isValid: () => {
        return obj.event_id && obj.lat && obj.lng
      },
      ...item
    };
    return obj;
  }
};

  // const handleEventClick = (event) => {
  //   setSelectedLocation(getLocationInfo(event, 'events'));
  // };

  // const handleVisitClick = (visit) => {
  //   setSelectedLocation(getLocationInfo(visit, 'visits'));
  // };


  const handleEventClick = (event) => {
    console.log('handleEventClick received:', event); // 디버깅 로그
    if (!event) {
      console.warn('Event object is undefined');
      return;
    }
    setSelectedLocation(getLocationInfo(event, 'events'));
  };

  const handleVisitClick = (visit) => {
    console.log('handleVisitClick received:', visit); // 디버깅 로그
    if (!visit) {
      console.warn('Visit object is undefined');
      return;
    }
    setSelectedLocation(getLocationInfo(visit, 'visits'));
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    // setSelectedEvent(null);
    // setSelectedVisit(null);
    setSelectedLocation(null);

    setViewMode(value === 'visits' ? 'timeline' : 'card');
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
        showSuccess("이벤트가 삭제되었습니다.");
      } else {
        await visitApi.deleteVisit(id);
        fetchVisits();
        showSuccess("방문 계획이 삭제되었습니다.");
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showError(`${type === 'event' ? '이벤트' : '방문 계획'} 삭제에 실패했습니다.`);
    }
  };

const fetchEvents = async () => {
  try {
    const data = await eventApi.getEvents();
    setEvents(data);
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};

const fetchVisits = async (eventId = null) => {
  try {
    const data = await visitApi.getVisits(eventId);
    setVisits(data);
  } catch (error) {
    console.error('Error fetching visits:', error);
  }
};
  const handleEventSubmit = async (eventData) => {
    try {
      const prepareData = (eventData) => {
        const { pin_idx, markerText, ...pureEvent } = eventData;
        return pureEvent;
      };
      if (editingEvent) {
        // 수정일 경우
        await eventApi.updateEvent(editingEvent.id, prepareData(eventData));
        showSuccess("이벤트가 수정되었습니다.");
      } else {
        // 추가일 경우
        await eventApi.addEvent(prepareData(eventData));
        showSuccess("이벤트가 추가되었습니다.");
      }
      fetchEvents();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error managing event:', error);
      showError(`이벤트 ${editingEvent ? '수정' : '추가'}에 실패했습니다.`);
    }
  };

  const handleVisitSubmit = async (visitData) => {
    try {
      const prepareVisitData = (visitData) => {
        const { tp_events, pin_idx, markerText, event_id, ...pureVisitData } = visitData;
        return pureVisitData;
      };
      if (editingVisit) {
        await visitApi.updateVisit(editingVisit.id, prepareVisitData(visitData));
        showSuccess("방문 계획이 수정되었습니다.");
      } else {
        await visitApi.addVisit(prepareVisitData(visitData));
        showSuccess("방문 계획이 추가되었습니다.");
      }
      fetchVisits();
      setEditingVisit(null);
    } catch (error) {
      console.error('Error managing visit:', error);
      showError("방문 계획 추가에 실패했습니다.");
    }
  };

  const handleVisitFormClose = () => {
    setEditingVisit(null);
  };
  useEffect(() => {
    fetchEvents();
    fetchVisits();
  }, []);

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    } else {
      fetchVisits();
    }
  }, [activeTab]);

  const handleFormClose = () => {
    setEditingEvent(null);  // 폼이 닫힐 때 초기화
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      <Group position="right" p="md">
        <EventForm
          onSubmit={handleEventSubmit}
          initialData={editingEvent}
          onClose={handleFormClose}

        />
        {selectedLocation && (
          <VisitForm
            eventId={selectedLocation.event_id}
            onSubmit={handleVisitSubmit}
            initialData={editingVisit}
            onClose={handleVisitFormClose}
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
              {activeTab == tabValue ?
                <LocationView
                  items={filteredItems}
                  activeTab={tabValue}
                  selectedItem={selectedLocation}
                  onItemClick={tabValue === "events" ? handleEventClick : handleVisitClick}
                  onItemEdit={tabValue === "events" ? setEditingEvent : setEditingVisit}
                  onItemDelete={(id) => handleDelete(id, tabValue)}
                  type={tabValue}
                  date={filters.date}
                /> : <></>}
              <MapView
                items={filteredItems}
                selectedLocation={selectedLocation}
                type={tabValue}
                onMarkerClick={tabValue === "events" ? handleEventClick : handleVisitClick}
                visible={activeTab === tabValue}
              />
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </main>
  );
};


export default KakaoMapList;