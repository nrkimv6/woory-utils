"use client"
import React, { useEffect, useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { format } from 'date-fns';
import { eventApi, visitApi } from '@/lib/travel-plan/api';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';

import EventForm from '@/components/travel-plan/EventForm';
import VisitForm from '@/components/travel-plan/VisitForm';
import { Filters } from '@/components/travel-plan/Filters';
import { LocationList } from '@/components/travel-plan/LocationList';
import { MapView } from '@/components/travel-plan/MapView';
import { useLocationFilter } from '@/hooks/travel-plan/useLocationFilter';

// KakaoMapList.jsx
const KakaoMapList = () => {
  const [activeTab, setActiveTab] = useState("events");

  const isKakaoLoaded = useKakaoLoader();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const { filters, setFilters, filteredItems } = useLocationFilter(activeTab, events, visits);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedLocation(event);
  };

  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    setSelectedLocation(visit.tp_events);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedEvent(null);
    setSelectedVisit(null);
    setSelectedLocation(null);

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
      await eventApi.addEvent(eventData);
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleVisitSubmit = async (visitData) => {
    try {
      await visitApi.addVisit(visitData);
      fetchVisits(visitData.event_id);
    } catch (error) {
      console.error('Error adding visit:', error);
    }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Group position="right" p="md">
        <EventForm
          onSubmit={handleEventSubmit}
          initialData={editingEvent}
        />
        {selectedLocation && (
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
                type={tabValue}
                onMarkerClick={tabValue === "events" ? handleEventClick : handleVisitClick}
                visible={activeTab === tabValue}
              />
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
};


export default KakaoMapList;