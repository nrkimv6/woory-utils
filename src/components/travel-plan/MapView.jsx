import { useEffect } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventDetailView} from './EventDetailView';
import { VisitDetailView} from './VisitDetailView';

export const MapView = ({ items, selectedLocation, type }) => {

  
  const mapId = `map-${type}`;
    useEffect(() => {
    if (!map) return;

    // 지도 클릭 이벤트 리스너 추가 (onLocationSelect가 있을 때만)
    if (onLocationSelect) {
      const clickListener = kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
        onLocationSelect(mouseEvent.latLng);
      });

      return () => {
        kakao.maps.event.removeListener(clickListener);
      };
    }
  }, [map, onLocationSelect]);


  return (
    <div style={{ width: '66.666%', position: 'relative', height: '600px' }}>
      <div id={mapId} style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute' 
      }} />
      {selectedLocation && (
        <Card style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'white',
          padding: '1rem'
        }}>
          {type === "events" ? (
            <EventDetailView item={selectedLocation} />
          ) : (
            <VisitDetailView item={selectedLocation} />
          )}
        </Card>
      )}
    </div>
  );
};