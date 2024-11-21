import { useEffect, useState } from 'react';
import { Card } from '@mantine/core';
import { EventDetailView } from './EventDetailView';
import { VisitDetailView } from './VisitDetailView';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { PASTEL_COLORS } from '@/util/colors';

export const MapView = ({ items, selectedLocation, type, onLocationSelect, onMarkerClick, visible = true }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [customOverlays, setCustomOverlays] = useState([]);
  const isKakaoLoaded = useKakaoLoader();
  const mapId = `map-${type}`;
  const isFormType = type === 'events-form';

  // visible prop이 true가 될 때 맵 초기화
  useEffect(() => {
    if (!isKakaoLoaded || !visible) return;

    const container = document.getElementById(mapId);
    if (!container) return;

    // 기존 맵 인스턴스가 있다면 제거
    if (map) {
      marker?.setMap(null);
      customOverlays.forEach(overlay => overlay.setMap(null));
    }

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: isFormType ? 3 : 7
    };

    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // 초기 데이터 있으면 표시
    if (isFormType && items?.[0]?.lat && items[0]?.lng) {
      const position = new window.kakao.maps.LatLng(items[0].lat, items[0].lng);
      updateFormMarker(position, kakaoMap);
      kakaoMap.setCenter(position);
    }

    // form 타입일 경우 클릭 이벤트 리스너 추가
    if (isFormType && onLocationSelect) {
      const clickListener = window.kakao.maps.event.addListener(
        kakaoMap,
        'click',
        (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          updateFormMarker(latlng);
          onLocationSelect(latlng);
        }
      );
    return () => {
      if (map) {
        window.kakao.maps.event?.removeListener(clickListener);
        marker?.setMap(null);
        customOverlays.forEach(overlay => overlay.setMap(null));
      }
    };
    }
  }, [isKakaoLoaded, visible]);


  // form 타입일 때 마커 업데이트 함수
  const updateFormMarker = (position) => {
    if (marker) {
      marker.setMap(null);
    }

    const newMarker = new window.kakao.maps.Marker({
      position: position,
      map: map
    });

    setMarker(newMarker);
  };

  // form 타입일 때 items 변경 시 마커 업데이트 및 위치 이동
  useEffect(() => {
    if (!map || !isFormType || !items?.length) return;

    const item = items[0]; // form type은 항상 하나의 아이템만 받음
    if (item.lat && item.lng) {
      const position = new window.kakao.maps.LatLng(item.lat, item.lng);
      updateFormMarker(position);
      map.setCenter(position);
    }
  }, [map, items, isFormType]);


  // ... 나머지 MapView 코드는 동일

  // 마커/오버레이 업데이트 (일반 목록 표시용)
  useEffect(() => {
    if (!map || isFormType || !items?.length) return;

    // 기존 오버레이 제거
    customOverlays.forEach(overlay => overlay.setMap(null));
    const newOverlays = [];
    const bounds = new window.kakao.maps.LatLngBounds();

    items.forEach((item, index) => {
      const lat = type === "events" ? item.lat : item.tp_events?.lat;
      const lng = type === "events" ? item.lng : item.tp_events?.lng;

      if (lat && lng) {
        const position = new window.kakao.maps.LatLng(lat, lng);
        bounds.extend(position);

        const markerText = type === "events"
          ? String.fromCharCode(65 + index)
          : (index + 1).toString();

        const markerContent = `
          <div style="
            background: ${PASTEL_COLORS[index % PASTEL_COLORS.length]};
            padding: 5px 10px;
            border-radius: ${type === "events" ? '4px' : '50%'};
            color: #333;
            font-weight: bold;
            text-align: center;
            min-width: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            cursor: pointer;
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

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: markerContent,
          map: map,
          yAnchor: 1.3
        });

        // 클릭 이벤트 추가
        const element = overlay.getContent();
        if (typeof element === 'string') {
          const div = document.createElement('div');
          div.innerHTML = element;
          div.firstChild.addEventListener('click', () => {
            onMarkerClick?.(item);
          });
          overlay.setContent(div.firstChild);
        }

        newOverlays.push(overlay);
      }
    });

    setCustomOverlays(newOverlays);
    if (newOverlays.length > 0) {
      map.setBounds(bounds);
    }
  }, [map, items, type]);

  // 선택된 위치로 이동 (form이 아닐 때만)
  useEffect(() => {
    if (!map || !selectedLocation || isFormType) return;

    const lat = type === "events" ? selectedLocation.lat : selectedLocation.tp_events?.lat;
    const lng = type === "events" ? selectedLocation.lng : selectedLocation.tp_events?.lng;

    if (lat && lng) {
      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
      map.panTo(moveLatLon);
    }
  }, [selectedLocation, map, type]);

  return (
    <div style={{
      width: isFormType ? '100%' : '66.666%',
      position: 'relative',
      height: isFormType ? '400px' : '600px',
      display: visible ? 'block' : 'none'
    }}>
      <div id={mapId} style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }} />
      {!isFormType && selectedLocation && visible && (
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
