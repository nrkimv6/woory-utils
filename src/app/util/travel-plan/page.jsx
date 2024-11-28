"use client"
import React, { useEffect, useState } from 'react';
import { Group, Tabs } from '@mantine/core';
import { eventApi, visitApi } from '@/lib/travel-plan/api';
import {bridgeApi} from '@/lib/travel-plan/bridgeApi'

import EventForm from '@/components/travel-plan/EventForm';
import VisitForm from '@/components/travel-plan/VisitForm';
import { Filters } from '@/components/travel-plan/Filters';
import { LocationView } from '@/components/travel-plan/LocationView';
import { MapView } from '@/components/travel-plan/MapView';
import { useLocationFilter } from '@/hooks/travel-plan/useLocationFilter';
import { showSuccess, showError } from '@/util/notification';

// KakaoMapList.jsx
const TravelPlan = () => {
  const [activeTab, setActiveTab] = useState("events");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [visitsAndTrans, setVisitsAndTrans] = useState([]);

  const [editingEvent, setEditingEvent] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);

  const { filters, setFilters, filteredItems } = useLocationFilter(
    activeTab,
    events,
    visitsAndTrans
  );

  const getLocationInfo = (item, type) => {
    if (type === 'events') {
      const obj = {
        id: item.id,
        event_id: item.id,
        lat: item.lat,
        lng: item.lng,
        pinIdx: item.pinIdx,
        markerText: item.markerText,
        isValid: () => {
          return obj.id && obj.lat && obj.lng
        },
        ...item
      };
      return obj;
    } else if(type === 'bridge') {
      const obj = {
        id: item.id,
        event_id: item.tp_events?.id,
        lat: item.tp_events?.lat,
        lng: item.tp_events?.lng,
        pinIdx: item.pinIdx,
        markerText: item.markerText,
        isValid: () => {
          return obj.event_id && obj.lat && obj.lng
        },
        ...item
      };
      console.log(JSON.stringify(obj));
      return obj;
    } else {
      const obj = {
        id: item.id,
        event_id: item.tp_events?.id,
        lat: item.tp_events?.lat,
        lng: item.tp_events?.lng,
        pinIdx: item.pinIdx,
        markerText: item.markerText,
        isValid: () => {
          return obj.event_id && obj.lat && obj.lng
        },
        ...item
      };
      return obj;
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedLocation(null);

    if (value === "events") {
      fetchEvents();
    } else {
      fetchVisits();
    }
  };
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };


  const handleClick = (event) => {
    const handleEventClick = (event) => {
      console.log('handleEventClick received:', event);
      if (!event) {
        console.warn('Event object is undefined');
        return;
      }
      setSelectedLocation(getLocationInfo(event, 'events'));
    };

    const handleVisitClick = (visit) => {
      console.log('handleVisitClick received:', visit);
      if (!visit) {
        console.warn('Visit object is undefined');
        return;
      }
      setSelectedLocation(getLocationInfo(visit, 'visits'));
    };
    return activeTab === "events" ? handleEventClick(event) : handleVisitClick(event);
  };

  const handleStartEdit = (item) => {
    return activeTab === "events" ? setEditingEvent(item) : setEditingVisit(item);
  };

  //#TODO TimeBridge 고려 필요함
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

  const fetchVisits = async () => {
    try {
      const visits = await visitApi.getVisits();
      const bridges = await bridgeApi.getBridges();
      setVisitsAndTrans([...visits, ...bridges]);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    }
  };

  //#TODO TimeBridge 고려 필요함
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


  //#TODO TimeBridge 고려 필요함
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

  // useEffect(() => {
  //   fetchEvents();
  //   fetchVisits();
  // }, []);

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

  const handleVisitFormClose = () => {
    setEditingVisit(null);
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      <Group position="right" p="md">
        {/*  참고 : 폼2개는 탭에상관없이 열릴 수 있음. */}
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
              filterType={tabValue}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <div style={{ display: 'flex', flex: 1 }}>
              {activeTab == tabValue ?

                <LocationView
                  onTimelineUpdate={(updatedItems) => filteredItems}
                  items={filteredItems}
                  displayType={tabValue}
                  selectedItem={selectedLocation}
                  onItemClick={handleClick}
                  onItemEdit={handleStartEdit}
                  onItemDelete={(id) => handleDelete(id, tabValue)}
                  onItemUpdate={() => {
                    if (activeTab === "events") {
                      fetchEvents();
                    } else {
                      fetchVisits();
                    }
                  }}
                  type={tabValue}
                  date={filters.date}
                /> : <></>}
              <MapView
                items={filteredItems}
                selectedLocation={selectedLocation}
                type={tabValue}
                onMarkerClick={handleClick}
                visible={activeTab === tabValue}  //현재 보이지 않는 맵뷰는 이벤트 받지 않고 그리지도 않게 처리
              />
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </main>
  );
};


export default TravelPlan;