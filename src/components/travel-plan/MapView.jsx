import { useEffect } from 'react';
import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventDetailView} from './EventDetailView';
import { VisitDetailView} from './VisitDetailView';

export const MapView = ({ items, selectedLocation, type, onLocationSelect }) => {
  const [map, setMap] = useState(null);
  const [customOverlays, setCustomOverlays] = useState([]);
  const mapId = `map-${type}`;

  // 지도 초기화
  useEffect(() => {
    const container = document.getElementById(mapId);
    if (!container) return;

    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 7
    };

    const kakaoMap = new kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // 위치 선택 모드인 경우 클릭 이벤트 추가
    if (onLocationSelect) {
      const clickListener = kakao.maps.event.addListener(
        kakaoMap,
        'click',
        (mouseEvent) => {
          onLocationSelect(mouseEvent.latLng);
        }
      );

      return () => {
        kakao.maps.event.removeListener(clickListener);
      };
    }
  }, [mapId, onLocationSelect]);

  // 마커 업데이트
  useEffect(() => {
    if (!map || !items?.length) return;

    // 기존 오버레이 제거
    customOverlays.forEach(overlay => overlay.setMap(null));
    const newOverlays = [];

    // bounds 객체 생성
    const bounds = new kakao.maps.LatLngBounds();

    items.forEach((location, index) => {
      const lat = type === "events" ? location.lat : location.tp_events?.lat;
      const lng = type === "events" ? location.lng : location.tp_events?.lng;

      if (lat && lng) {
        const position = new kakao.maps.LatLng(lat, lng);
        bounds.extend(position);

        // ... 기존 마커 생성 코드 ...
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

    // 모든 마커가 보이도록 지도 영역 조정
    if (!onLocationSelect) {  // 위치 선택 모드가 아닐 때만 자동 조정
      map.setBounds(bounds);
    }
  }, [map, items, type]);

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