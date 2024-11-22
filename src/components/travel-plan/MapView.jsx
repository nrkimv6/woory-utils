import { useEffect, useRef, useCallback, useState } from 'react';
import { Card } from '@mantine/core';
import { EventDetailView } from './EventDetailView';
import { VisitDetailView } from './VisitDetailView';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { PASTEL_COLORS } from '@/util/colors';
import LocationMarker from './LocationMarker';
import { createRoot } from 'react-dom/client';

export const MapView = ({
  items,
  selectedLocation,
  type,
  onLocationSelect,
  onMarkerClick,
  visible = true
}) => {
  const mapRef = useRef(null);
  const mapId = `map-${type}`;
  const [clickListener, setClickListener] = useState(null);
  const isFormType = type === 'events-form';
  const mapContainerRef = useRef(null);
  const markerRootsRef = useRef(new Map());
  const overlaysRef = useRef([]);
  const initializedRef = useRef(false);
  const selectedLocationRef = useRef(selectedLocation);
  const isKakaoLoaded = useKakaoLoader();
  const updateInProgressRef = useRef(false);

  // selectedLocation 변경 시 참조 업데이트
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  const createMarker = useCallback((item, isSelected) => {
    if (!item) return null;
    
    const lat = Number(item.lat || item.tp_events?.lat);
    const lng = Number(item.lng || item.tp_events?.lng);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

    const position = new window.kakao.maps.LatLng(lat, lng);
    const container = document.createElement('div');

    const root = createRoot(container);
    root.render(
      <LocationMarker
        index={item.pin_idx}
        markerText={item.markerText}
        color={PASTEL_COLORS[item.pin_idx % PASTEL_COLORS.length]}
        onClick={() => onMarkerClick?.(item)}
        style={{
          opacity: isSelected ? 1 : 0.5,
          transform: isSelected ? 'scale(1.2)' : 'none'
        }}
      />
    );

    markerRootsRef.current.set(container, root);

    return new window.kakao.maps.CustomOverlay({
      position,
      content: container,
      yAnchor: 1.3,
      zIndex: isSelected ? 100 : 1
    });
  }, [onMarkerClick]);

  const updateMarkersAndOverlays = useCallback(() => {
    if (updateInProgressRef.current) return;
    updateInProgressRef.current = true;

    const kakaoMap = mapRef.current;
    if (!kakaoMap || !items?.length) {
      updateInProgressRef.current = false;
      return;
    }

    console.log('Updating markers and overlays');
    const currentSelected = selectedLocationRef.current;

    // 기존 오버레이 정리
    overlaysRef.current.forEach(overlay => {
      const content = overlay.getContent();
      const root = markerRootsRef.current.get(content);
      if (root) {
        root.unmount();
        markerRootsRef.current.delete(content);
      }
      overlay.setMap(null);
    });
    overlaysRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();

    // 비선택 마커 생성
    items.forEach((item) => {
      const isSelected = currentSelected?.id === item.id;
      if (!isSelected) {
        const overlay = createMarker(item, false);
        if (overlay) {
          overlay.setMap(kakaoMap);
          overlaysRef.current.push(overlay);
          bounds.extend(overlay.getPosition());
        }
      }
    });

    // 선택된 마커 처리
    if (currentSelected) {
      const overlay = createMarker(currentSelected, true);
      if (overlay) {
        overlay.setMap(kakaoMap);
        overlaysRef.current.push(overlay);
        bounds.extend(overlay.getPosition());

        const position = new window.kakao.maps.LatLng(
          Number(currentSelected.lat),
          Number(currentSelected.lng)
        );

        // 로그 추가
        console.log('Selected Position:', {
          lat: Number(currentSelected.lat),
          lng: Number(currentSelected.lng)
        });

        requestAnimationFrame(() => {
          console.log('Map Center before panTo:', kakaoMap.getCenter());
          kakaoMap.panTo(position);
          console.log('Map Center after panTo:', kakaoMap.getCenter());
        });
      }
    }

    if (overlaysRef.current.length > 0) {
      kakaoMap.setBounds(bounds);
    }

    updateInProgressRef.current = false;
  }, [items, createMarker]);

  // selectedLocation 변경에 대한 효과
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      requestAnimationFrame(() => {
        updateMarkersAndOverlays();
      });
    }
  }, [selectedLocation, updateMarkersAndOverlays]);

  
  const handleMapClick = useCallback((mouseEvent) => {
    if (!isFormType) return;

    const latlng = mouseEvent.latLng;
    onLocationSelect?.(latlng);
    const kakaoMap = mapRef.current;
    kakaoMap?.panTo(latlng);
  }, [isFormType, onLocationSelect]);

  // 지도 초기화 - 한 번만 실행되도록 수정
  const initializeMap = useCallback(() => {
    if (!isKakaoLoaded || !mapContainerRef.current || initializedRef.current) return;
    // console.log(`${type} MapView - 초기화 시작`, new Date().toISOString());

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: isFormType ? 3 : 7
    };
    if (mapRef.current) {
      mapRef.current = null;
    }

    setTimeout(() => {
      const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = kakaoMap;

      if (isFormType && onLocationSelect) {

        const listener = window.kakao.maps.event.addListener(
          kakaoMap,
          'click',
          handleMapClick
        );
        setClickListener(listener);
      }

      initializedRef.current = true;
      kakaoMap.relayout();
      updateMarkersAndOverlays();

      // console.log(`${type} MapView - 초기화 끝`, new Date().toISOString());
    }, 100); // 100ms 딜레이

  }, [isKakaoLoaded, isFormType, onLocationSelect, updateMarkersAndOverlays]);


  useEffect(() => {
    if (visible && !initializedRef.current) {
      initializeMap();
    }

    return () => {
      if (!visible) {
        // cleanup when hidden
        if (clickListener) {
          window.kakao.maps.event.removeListener(clickListener);
          setClickListener(null);
        }

        // React 컴포넌트 cleanup
        overlaysRef.current.forEach(overlay => {
          // cleanupMarker(overlay.getContent());
          overlay.setMap(null);
        });
        overlaysRef.current = [];
        initializedRef.current = false;
        mapRef.current = null;
        markerRootsRef.current.clear();
      }
    };
  }, [visible, initializeMap, clickListener]);

  // items 변경 시에만 마커 업데이트
  useEffect(() => {
    if (mapRef.current && items?.length) {
      updateMarkersAndOverlays();
    }
  }, [items, updateMarkersAndOverlays]);

  // visible 변경 시 relayout 호출
  useEffect(() => {
    if (visible && mapRef.current) {
      mapRef.current.relayout();
    }
  }, [visible]);


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