import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@mantine/core';
import { EventDetailView } from './EventDetailView';
import { VisitDetailView } from './VisitDetailView';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { PASTEL_COLORS } from '@/util/colors';


export const MapView = ({ items, selectedLocation, type, onLocationSelect, onMarkerClick, visible = true }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [customOverlays, setCustomOverlays] = useState([]);
  const [clickListener, setClickListener] = useState(null);
  const isKakaoLoaded = useKakaoLoader();
  const mapId = `map-${type}`;
  const isFormType = type === 'events-form';
  const mapContainerRef = useRef(null);
  const overlaysRef = useRef([]);  // 오버레이 참조 추가

  // 마커/오버레이 업데이트 - DOM 조작 최소화
  const updateMarkersAndOverlays = useCallback((kakaoMap) => {
    const targetMap = kakaoMap || map;
    if (!targetMap || !items?.length) return;

    // 기존 오버레이 제거
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
    
    if (marker) marker.setMap(null);

    const bounds = new window.kakao.maps.LatLngBounds();

    items.forEach((item, index) => {
      const lat = type === "events" ? item.lat : item.tp_events?.lat;
      const lng = type === "events" ? item.lng : item.tp_events?.lng;

      if (lat && lng) {
        const position = new window.kakao.maps.LatLng(lat, lng);
        bounds.extend(position);

        if (isFormType) {
          const newMarker = new window.kakao.maps.Marker({
            position: position,
            map: targetMap
          });
          setMarker(newMarker);
          targetMap.panTo(position);
        } else {
          // DOM 엘리먼트 직접 생성
          const markerDiv = document.createElement('div');
          markerDiv.style.background = PASTEL_COLORS[index % PASTEL_COLORS.length];
          markerDiv.style.padding = '5px 10px';
          markerDiv.style.borderRadius = type === "events" ? '4px' : '50%';
          markerDiv.style.color = '#333';
          markerDiv.style.fontWeight = 'bold';
          markerDiv.style.textAlign = 'center';
          markerDiv.style.minWidth = '24px';
          markerDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          markerDiv.style.position = 'relative';
          markerDiv.style.cursor = 'pointer';
          markerDiv.innerHTML = type === "events" ? String.fromCharCode(65 + index) : (index + 1).toString();

          const arrow = document.createElement('div');
          arrow.style.position = 'absolute';
          arrow.style.bottom = '-8px';
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
          arrow.style.width = '0';
          arrow.style.height = '0';
          arrow.style.borderLeft = '8px solid transparent';
          arrow.style.borderRight = '8px solid transparent';
          arrow.style.borderTop = `8px solid ${PASTEL_COLORS[index % PASTEL_COLORS.length]}`;
          
          markerDiv.appendChild(arrow);
          markerDiv.addEventListener('click', () => onMarkerClick?.(item));

          const overlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: markerDiv,
            map: targetMap,
            yAnchor: 1.3
          });

          overlaysRef.current.push(overlay);
        }
      }
    });

    if (!isFormType && overlaysRef.current.length > 0) {
      targetMap.setBounds(bounds);
    }
  }, [type, isFormType, items, onMarkerClick]);

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!isKakaoLoaded || !mapContainerRef.current) return;

    // 기존 리스너 제거
    if (clickListener) {
      window.kakao.maps.event.removeListener(clickListener);
      setClickListener(null);
    }

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: isFormType ? 3 : 7
    };

    const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options);

    if (isFormType && onLocationSelect) {
      const listener = window.kakao.maps.event.addListener(
        kakaoMap,
        'click',
        (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          if (marker) marker.setMap(null);
          const newMarker = new window.kakao.maps.Marker({
            position: latlng,
            map: kakaoMap
          });
          setMarker(newMarker);
          onLocationSelect(latlng);
          kakaoMap.panTo(latlng);
        }
      );
      setClickListener(listener);
    }

    setMap(kakaoMap);

    // 맵 생성 직후 한 번만 실행
    kakaoMap.relayout();
    updateMarkersAndOverlays(kakaoMap);
  }, [isKakaoLoaded, isFormType, onLocationSelect, updateMarkersAndOverlays]);


  // visible 변경 시에만 초기화
  useEffect(() => {
    if (visible) {
      initializeMap();
    }
    return () => {
      if (clickListener) {
        window.kakao.maps.event.removeListener(clickListener);
        setClickListener(null);
      }
      if (marker) marker.setMap(null);
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [visible, initializeMap]);

  // items 변경 시에만 마커 업데이트
  useEffect(() => {
    if (map && items?.length) {
      updateMarkersAndOverlays(map);
    }
  }, [items, updateMarkersAndOverlays]);

  return (
    <div style={{ 
      width: isFormType ? '100%' : '66.666%', 
      position: 'relative', 
      height: isFormType ? '400px' : '600px',
      display: visible ? 'block' : 'none'
    }}>
      <div 
        ref={mapContainerRef}
        id={mapId} 
        style={{ width: '100%', height: '100%', position: 'absolute' }} 
      />
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