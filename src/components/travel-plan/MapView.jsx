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
  const selectedLocationRef = useRef(selectedLocation);   // 외부에서 선택된 마커 위치
  const isKakaoLoaded = useKakaoLoader();
  const updateInProgressRef = useRef(false);


  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
    console.log('[' + mapId + ']------selectedLocation to ' + selectedLocation?.id);
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
    position: null,
    itemsSignature: null,
    selectedId: null,
  });

  const getItemsSignature = useCallback((items) => {
    if (!visible) return;
    if (!items?.length) return '';
    // ID와 위치 정보만 포함하여 signature 생성
    const signature = items.map(item => ({
      id: item.id,
      lat: item.lat,
      lng: item.lng
    }));
    return JSON.stringify(signature);
  }, []);

  const updateMarkersAndOverlays = useCallback(async () => {
    if (!visible) return;
    if (updateInProgressRef.current) return;
    updateInProgressRef.current = true;

    const kakaoMap = mapRef.current;
    if (!kakaoMap || !items?.length) {
      updateInProgressRef.current = false;
      return;
    }

    const currentItemsSignature = getItemsSignature(items);

    const currentSelected = selectedLocationRef.current;
    const prevSelected = lastMapStateRef.current.selectedId;
    const selectionChanged = currentSelected?.id !== prevSelected;

    // signature가 같으면 불필요한 업데이트 방지
    if (currentItemsSignature === lastMapStateRef.current.itemsSignature
      && prevSelected && !selectionChanged) {
      console.log('[' + mapId + ']Skip update - items not changed ' 
                  + prevSelected+'('+ prevSelected?.markerText + ') to ' + currentSelected?.id+'('+currentSelected?.markerText+')');
      updateInProgressRef.current = false;
      return;
    }
    console.log('[' + mapId + ']update - items from ' + prevSelected?.id+'('+ prevSelected?.markerText + ') to ' + currentSelected?.id+'('+currentSelected?.markerText+')');

    const bounds = new window.kakao.maps.LatLngBounds();

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

    // z-index 업데이트 함수
    const updateMarkerZIndex = (overlay, isSelected) => {
      if (overlay) {
        overlay.setZIndex(isSelected ? 100 : 1);
      }
    };

    // 비동기적으로 마커 업데이트를 처리하는 함수
    const updateMarkerAsync = async (overlay, item, isSelected) => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const content = overlay.getContent();
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
          }
          updateMarkerZIndex(overlay, isSelected);
          resolve();
        });
      });
    };


    // 비동기적으로 마커 제거를 처리하는 함수
    const removeMarkerAsync = async (overlay) => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const content = overlay.getContent();
          overlay.setMap(null);
          const root = markerRootsRef.current.get(content);
          if (root) {
            setTimeout(() => {
              root.unmount();
              markerRootsRef.current.delete(content);
              resolve();
            }, 0);
          } else {
            resolve();
          }
        });
      });
    };
    // 1. 제거해야 할 마커 처리
    const markersToRemove = overlaysRef.current.filter(overlay => {
      const content = overlay.getContent();
      const markerId = Number(content.dataset.markerId);
      return !newMarkerKeys.has(markerId);
    });

    await Promise.all(markersToRemove.map(overlay => removeMarkerAsync(overlay)));
    overlaysRef.current = overlaysRef.current.filter(overlay =>
      newMarkerKeys.has(Number(overlay.getContent().dataset.markerId))
    );

    // 2. 마커 업데이트 또는 생성
    const updatePromises = items.map(async item => {
      const isSelected = currentSelected?.id === item.id;

      if (!existingMarkerKeys.has(item.id)) {
        // 새로운 마커 생성
        const overlay = createMarker(item, isSelected);
        if (overlay) {
          const content = overlay.getContent();
          content.dataset.markerId = item.id;
          overlay.setMap(kakaoMap);
          updateMarkerZIndex(overlay, isSelected);  // 새로 생성 시 z-index 설정
          overlaysRef.current.push(overlay);
          bounds.extend(overlay.getPosition());
        }
      } else {
        // 기존 마커 검증 및 업데이트
        const existingOverlay = overlaysRef.current.find(
          overlay => Number(overlay.getContent().dataset.markerId) === item.id
        );

        if (existingOverlay) {
          const isValidMarker = existingOverlay.getMap() === kakaoMap &&
            document.body.contains(existingOverlay.getContent());

          if (!isValidMarker) {
            // 유효하지 않은 마커 재생성
            await removeMarkerAsync(existingOverlay);
            const newOverlay = createMarker(item, isSelected);
            if (newOverlay) {
              const newContent = newOverlay.getContent();
              newContent.dataset.markerId = item.id;
              newOverlay.setMap(kakaoMap);
              updateMarkerZIndex(newOverlay, isSelected);  // 재생성 시 z-index 설정
              overlaysRef.current = overlaysRef.current.filter(
                overlay => Number(overlay.getContent().dataset.markerId) !== item.id
              );
              overlaysRef.current.push(newOverlay);
            }
          } else {
            // 유효한 마커 업데이트
            await updateMarkerAsync(existingOverlay, item, isSelected);
          }
          bounds.extend(existingOverlay.getPosition());
        }
      }
    });

    // 3. selectedLocation이 items에 없는 경우 처리
    if (currentSelected && !items.find(item => item.id === currentSelected.id)) {
      if (!existingMarkerKeys.has(currentSelected.id)) {
        // 선택된 위치의 마커 새로 생성
        const overlay = createMarker(currentSelected, true);
        if (overlay) {
          const content = overlay.getContent();
          content.dataset.markerId = currentSelected.id;
          overlay.setMap(kakaoMap);
          updateMarkerZIndex(overlay, true);  // 선택된 마커의 z-index 설정
          overlaysRef.current.push(overlay);
          bounds.extend(overlay.getPosition());
        }
      }
    }

    await Promise.all(updatePromises);

    // 4. 선택 상태 변경에 따른 z-index 최종 업데이트
    if (selectionChanged) {
      overlaysRef.current.forEach(overlay => {
        const markerId = Number(overlay.getContent().dataset.markerId);
        const isSelected = currentSelected?.id === markerId;
        updateMarkerZIndex(overlay, isSelected);
      });
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
      
      const idDiff = !lastState.id || (lastState.id != currentSelected?.id );

      return { boundsDiff, positionDiff, idDiff };
    };

    const { boundsDiff, positionDiff, idDiff } = isStateChanged();
    let flgUpdate = false;

    if (overlaysRef.current.length > 0) {
      if (boundsDiff && !bounds.isEmpty()) {
        const lastState = lastMapStateRef.current;
        console.log('[' + mapId + ']bounds changed ' + JSON.stringify(bounds));
        console.log('[' + mapId + ']lastState.bounds ' + JSON.stringify(lastState.bounds));
        kakaoMap.setBounds(bounds);
        flgUpdate = true;
        lastMapStateRef.current.bounds = bounds;
        console.log('[' + mapId + ']flgUpdate');
      }
      else {
        console.log('[' + mapId + ']Do not update since calculated bound is invalid');
        console.log('[' + mapId + ']overlaysRef size: ' + overlaysRef.current.length);
      }


      if (position && positionDiff) {
        const boundsCenter = calculateBoundsCenter(bounds);
        const latDiff = Math.abs(position.getLat() - boundsCenter.getLat());
        const lngDiff = Math.abs(position.getLng() - boundsCenter.getLng());

        if (latDiff > EPSILON || lngDiff > EPSILON) {
          const lastState = lastMapStateRef.current;
          console.log('[' + mapId + ']position changed with bound... ' + JSON.stringify(position));
          console.log('[' + mapId + ']lastState.position ' + JSON.stringify(lastState.position));
          kakaoMap.panTo(position);
          lastMapStateRef.current.position = position;
          flgUpdate = true;
        }
      }
    } else if (position && positionDiff) {
      kakaoMap.panTo(position);
      lastMapStateRef.current.position = position;
      flgUpdate = true;
      console.log('[' + mapId + ']position changed ' + JSON.stringify(position));
    }
    if (idDiff ){
      flgUpdate = true;
    }
    
    if (flgUpdate) {
      lastMapStateRef.current = {
        bounds,
        position,
        selectedId: currentSelected?.id,
        itemsSignature: currentItemsSignature
      };

      console.log('[' + mapId + '] flgUpdate '+currentSelected?.id);
    }
    else {
      console.log('[' + mapId + '] nothing regarding positon/bound works... ' + JSON.stringify(position));
      console.log('[' + mapId + '] flgNotUpdate '+currentSelected?.id);
    }
    updateInProgressRef.current = false;
  }, [items, createMarker, onMarkerClick, calculateBoundsCenter]);


  useEffect(() => {
    if( !visible )return;
    console.log('[' + mapId + ']selectedLocation에 따른 updateMarkersAndOverlays 여부 검토');
    if (mapRef.current && selectedLocation) {
      if (!selectedLocation.isValid()) {
        console.log('[' + mapId + ']목표지점이 명확하지 않아 수행하지 않음.');
        return;
      }
      console.log('[' + mapId + ']그리기 수행');
      updateMarkersAndOverlays();
    }
    else {
      console.log('[' + mapId + ']mapRef ' + mapRef.current + ' 또는 selectedLocation ' + selectedLocation?.id + ' 가 정의되어 있지 않아 무시. ');
    }
  }, [selectedLocation, updateMarkersAndOverlays]);

  const handleMapClick = useCallback((mouseEvent) => {
    if( !visible )return;
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
      console.log('[' + mapId + ']mapRef.current = null');
    }

    setTimeout(() => {
      const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = kakaoMap;
      console.log('[' + mapId + ']mapRef.current = kakaoMap;');

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
      console.log('[' + mapId + ']지도 초기화에 따른 전체그리기');
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
        console.log('[' + mapId + ']mapRef.current = null, visible:' + visible);

        markerRootsRef.current.clear();
      });
    }
  }, [visible, initializeMap, clickListener, safeCleanupOverlays]);

  // items 변경 시에만 마커 업데이트
  useEffect(() => {
    if( !visible )return;
    console.log('[' + mapId + ']items 변경에 따른 updateMarkersAndOverlays 검토');
    if (mapRef.current && items?.length) {
      const currentSelected = selectedLocationRef.current;
      const prevSelected = lastMapStateRef.current.selectedId;
      const selectionChanged = currentSelected?.id !== prevSelected;

      const currentItemsSignature = getItemsSignature(items);
      // signature 비교를 통한 실제 변경 확인
      if (currentItemsSignature !== lastMapStateRef.current.itemsSignature) {
        console.log('[' + mapId + ']Items actually changed, updating markers');
      } else {
        console.log('[' + mapId + ']Items reference changed but content is the same, skipping update');
        return;
      }
      console.log('[' + mapId + ']items 변경에 따른 전체그리기');
      updateMarkersAndOverlays();
    }
  }, [items, updateMarkersAndOverlays, getItemsSignature]);
  // visible 변경 시 relayout 호출

  useEffect(() => {
    // if (visible && mapRef.current) {
    // console.log('['+mapId+']run relayout since visible change');
    // mapRef.current.relayout();
    // }
    console.log('[' + mapId + '] visible ' + visible);
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