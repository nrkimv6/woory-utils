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

    // 현재 표시된 마커들의 키 집합
    const existingMarkerKeys = new Set(
      overlaysRef.current.map(overlay => {
        const content = overlay.getContent();
        return Number(content.dataset.markerId);
      })
    );

    // 새로 표시해야 할 마커들의 키 집합
    const newMarkerKeys = new Set(
      items.map(item => item.id).concat(currentSelected ? [currentSelected.id] : [])
    );
    console.log('newMarkerKeys ' + JSON.stringify(newMarkerKeys));
    console.log('currentSelected  ' + JSON.stringify(currentSelected));
    console.log('existingMarkerKeys  ' + JSON.stringify(existingMarkerKeys));

    // 1. 제거해야 할 마커 처리
    overlaysRef.current = overlaysRef.current.filter(overlay => {
      const content = overlay.getContent();
      const markerId = Number(content.dataset.markerId);

      if (!newMarkerKeys.has(markerId)) {
        overlay.setMap(null);
        const root = markerRootsRef.current.get(content);
        if (root) {
          root.unmount();
          markerRootsRef.current.delete(content);
        }
        return false;
      }
      return true;
    });

    // 2. 새로 추가하거나 업데이트해야 할 마커 처리
    items.forEach(item => {
      const isSelected = currentSelected?.id === item.id;
      if (!existingMarkerKeys.has(item.id)) {
        // 새로운 마커 생성
        const overlay = createMarker(item, isSelected);
        if (overlay) {
          const content = overlay.getContent();
          content.dataset.markerId = item.id; // DOM에 마커 ID 저장
          overlay.setMap(kakaoMap);
          overlaysRef.current.push(overlay);
          bounds.extend(overlay.getPosition());
          console.log('draw new marker '+item.id);
        }
      } else {
        // 기존 마커 업데이트 (선택 상태 변경 등)
        const existingOverlay = overlaysRef.current.find(
          overlay => Number(overlay.getContent().dataset.markerId) === item.id
        );
          console.log('update marker '+item.id);

        if (existingOverlay) {
          bounds.extend(existingOverlay.getPosition());
          // 필요한 경우 마커 상태 업데이트
          const content = existingOverlay.getContent();
          const root = markerRootsRef.current.get(content);
          if (root) {
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
          console.log('existingOverlay marker '+item.id);
          }
        }
      }
    });

    // selectedLocation이 items에 없는 경우 처리
    if (currentSelected && !items.find(item => item.id === currentSelected.id)) {
      if (!existingMarkerKeys.has(currentSelected.id)) {
        const overlay = createMarker(currentSelected, true);
        if (overlay) {
          const content = overlay.getContent();
          content.dataset.markerId = currentSelected.id;
          overlay.setMap(kakaoMap);
          overlaysRef.current.push(overlay);
          bounds.extend(overlay.getPosition());
          console.log('currentSelected marker '+item.id);
        }
      }
    }

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
        const lastState = lastMapStateRef.current;
        console.log('bounds changed '+JSON.stringify(bounds));
        console.log('lastState.bounds '+JSON.stringify(lastState.bounds));
        kakaoMap.setBounds(bounds);
        lastMapStateRef.current.bounds = bounds;
      }

      if (position && positionDiff) {
        const boundsCenter = calculateBoundsCenter(bounds);
        const latDiff = Math.abs(position.getLat() - boundsCenter.getLat());
        const lngDiff = Math.abs(position.getLng() - boundsCenter.getLng());

        if (latDiff > EPSILON || lngDiff > EPSILON) {
          const lastState = lastMapStateRef.current;
          console.log('position changed '+JSON.stringify(position));
          console.log('lastState.position '+JSON.stringify(lastState.position));
          kakaoMap.panTo(position);
          lastMapStateRef.current.position = position;
        }
      }
    } else if (position && positionDiff) {
      kakaoMap.panTo(position);
      lastMapStateRef.current.position = position;
    }
    updateInProgressRef.current = false;
  }, [items, createMarker, onMarkerClick]);

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