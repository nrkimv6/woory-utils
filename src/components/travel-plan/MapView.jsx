import { useEffect,useState } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventDetailView} from './EventDetailView';
import { VisitDetailView} from './VisitDetailView';

export const MapView = ({ items, selectedLocation, type, onLocationSelect }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);  // form type용 단일 마커
  const [customOverlays, setCustomOverlays] = useState([]);
  const mapId = `map-${type}`;

  // 지도 초기화
  useEffect(() => {
    const container = document.getElementById(mapId);
    if (!container) return;

    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3  // form type일 때는 더 확대된 뷰
    };

    const kakaoMap = new kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // form type인 경우 클릭 이벤트 추가
    if (type === 'form') {
      const clickListener = kakao.maps.event.addListener(
        kakaoMap,
        'click',
        (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          
          // 기존 마커 제거
          if (marker) {
            marker.setMap(null);
          }

          // 새 마커 생성 
          // 기본 마커 이미지 외에도 RED, BLUE, YELLOW, GREEN 등의 마커 이미지 사용 가능
          const newMarker = new kakao.maps.Marker({
            position: latlng,
            image: kakao.maps.MarkerImage.RED // 또는 다른 기본 제공 이미지
          });
          
          newMarker.setMap(kakaoMap);
          setMarker(newMarker);
          
          if (onLocationSelect) {
            onLocationSelect(latlng);
          }
        }
      );

      return () => {
        kakao.maps.event.removeListener(clickListener);
        if (marker) {
          marker.setMap(null);
        }
      };
    }
  }, [mapId, type]);

  // 목록 표시용 마커 업데이트 (form type이 아닐 때만)
  useEffect(() => {
    if (!map || type === 'form' || !items?.length) return;

    customOverlays.forEach(overlay => overlay.setMap(null));
    const newOverlays = [];
    const bounds = new kakao.maps.LatLngBounds();

    items.forEach((location, index) => {
      const lat = type === "events" ? location.lat : location.tp_events?.lat;
      const lng = type === "events" ? location.lng : location.tp_events?.lng;

      if (lat && lng) {
        const position = new kakao.maps.LatLng(lat, lng);
        bounds.extend(position);


        const customOverlay = new kakao.maps.CustomOverlay({
          position: position,
          content: markerContent,
          map: map,
          yAnchor: 1.3
        });

        newOverlays.push(customOverlay);
      }
    });

    setCustomOverlays(newOverlays);
    map.setBounds(bounds);
  }, [map, items, type]);

  return (
    <div style={{ 
      width: type === 'form' ? '100%' : '66.666%', 
      position: 'relative', 
      height: type === 'form' ? '400px' : '600px' 
    }}>
      <div id={mapId} style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute' 
      }} />
      {type !== 'form' && selectedLocation && (
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