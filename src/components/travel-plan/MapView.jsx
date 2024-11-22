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
  const markerRootsRef = useRef(new Map()); // React root 인스턴스
  const overlaysRef = useRef([]);
  const initializedRef = useRef(false);
  const selectedLocationRef = useRef(selectedLocation);
  const isKakaoLoaded = useKakaoLoader();
  const updateInProgressRef = useRef(false);


  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  const calculateBoundsCenter = (bounds) => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return new kakao.maps.LatLng(
      (sw.getLat() + ne.getLat()) / 2,
      (sw.getLng() + ne.getLng()) / 2
    );
  };

  const createMarker = useCallback((item, isSelected) => {
    const lat = Number(item.lat);
    const lng = Number(item.lng);

    if (!lat || !lng) return null;

    const position = new window.kakao.maps.LatLng(lat, lng);
    const container = document.createElement('div');

    // Create a new root for this marker
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

    // Store the root instance
    markerRootsRef.current.set(container, root);

    return new window.kakao.maps.CustomOverlay({
      position,
      content: container,
      yAnchor: 1.3,
      zIndex: isSelected ? 100 : 1
    });
  }, [onMarkerClick]);

  // 안전한 cleanup을 위한 유틸리티 함수
  const safeCleanupOverlays = useCallback(() => {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        overlaysRef.current.forEach(overlay => {
          const content = overlay.getContent();
          overlay.setMap(null);

          // cleanup을 다음 프레임으로 지연
          setTimeout(() => {
            const root = markerRootsRef.current.get(content);
            if (root) {
              root.unmount();
              markerRootsRef.current.delete(content);
            }
          }, 0);
        });
        overlaysRef.current = [];
        resolve();
      });
    });
  }, []);

  const lastMapStateRef = useRef({
    bounds: null,
    position: null
  });

  const updateMarkersAndOverlays = useCallback(async () => {
    if (updateInProgressRef.current) return;
    updateInProgressRef.current = true;

    const kakaoMap = mapRef.current;
    if (!kakaoMap || !items?.length) {
      updateInProgressRef.current = false;
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    const currentSelected = selectedLocationRef.current;

    // 1. 새 오버레이들을 먼저 생성
    const newOverlays = [];

    // 비선택 마커 생성
    items.forEach((item) => {
      const isSelected = currentSelected?.id === item.id;
      if (!isSelected) {
        const overlay = createMarker(item, false);
        if (overlay) {
          overlay.setMap(kakaoMap);
          newOverlays.push(overlay);
          bounds.extend(overlay.getPosition());
        }
      }
    });

    // 선택된 마커 생성
    if (currentSelected) {
      const overlay = createMarker(currentSelected, true);
      if (overlay) {
        overlay.setMap(kakaoMap);
        newOverlays.push(overlay);
        bounds.extend(overlay.getPosition());
      }
    }

    // 2. 새 오버레이가 모두 준비된 후에 이전 오버레이 제거
    requestAnimationFrame(() => {
      overlaysRef.current.forEach(overlay => {
        const content = overlay.getContent();
        overlay.setMap(null);
        const root = markerRootsRef.current.get(content);
        if (root) {
          root.unmount();
          markerRootsRef.current.delete(content);
        }
      });

      // 3. 참조 업데이트
      overlaysRef.current = newOverlays;
    });

    const position = currentSelected ? new window.kakao.maps.LatLng(
      Number(currentSelected.lat),
      Number(currentSelected.lng)
    ) : null;

    const EPSILON = 0.0001;

    // 상태 변경 확인
    const isStateChanged = () => {
      const lastState = lastMapStateRef.current;
      const boundsDiff = !lastState.bounds ||
        bounds.getSouthWest().toString() + bounds.getNorthEast().toString() !==
        lastState.bounds.getSouthWest().toString() + lastState.bounds.getNorthEast().toString();

      const positionDiff = !lastState.position || !position ||
        !position.equals(lastState.position);

      return { boundsDiff, positionDiff };
    };

    const { boundsDiff, positionDiff } = isStateChanged();

    if (overlaysRef.current.length > 0) {
      if (boundsDiff) {
        kakaoMap.setBounds(bounds);
        lastMapStateRef.current.bounds = bounds;
      }

      if (position && positionDiff) {
        const boundsCenter = calculateBoundsCenter(bounds);
        const latDiff = Math.abs(position.getLat() - boundsCenter.getLat());
        const lngDiff = Math.abs(position.getLng() - boundsCenter.getLng());

        if (latDiff > EPSILON || lngDiff > EPSILON) {
          kakaoMap.panTo(position);
          lastMapStateRef.current.position = position;
        }
      }
    } else if (position && positionDiff) {
      kakaoMap.panTo(position);
      lastMapStateRef.current.position = position;
    }

    updateInProgressRef.current = false;
  }, [items, createMarker]);


  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      updateMarkersAndOverlays();
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

    if (!visible) {
      // cleanup when hidden
      if (clickListener) {
        window.kakao.maps.event.removeListener(clickListener);
        setClickListener(null);
      }

      // React 컴포넌트 cleanup - safeCleanupOverlays 사용
      safeCleanupOverlays().then(() => {
        lastMapStateRef.current = {
          bounds: null,
          position: null
        };
        initializedRef.current = false;
        mapRef.current = null;
        markerRootsRef.current.clear();
      });
    }
  }, [visible, initializeMap, clickListener, safeCleanupOverlays]);

  // items 변경 시에만 마커 업데이트
  useEffect(() => {
    if (mapRef.current && items?.length) {
      updateMarkersAndOverlays();
    }
  }, [items, updateMarkersAndOverlays]);

  // visible 변경 시 relayout 호출
  useEffect(() => {
    if (visible && mapRef.current) {
      console.log('run relayout');
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