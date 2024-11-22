import { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Card } from '@mantine/core';
import { EventDetailView } from './EventDetailView';
import { VisitDetailView } from './VisitDetailView';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { PASTEL_COLORS } from '@/util/colors';
import LocationMarker from './LocationMarker';
export const MapView = ({ items, selectedLocation, type, onLocationSelect, onMarkerClick, visible = true }) => {
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [clickListener, setClickListener] = useState(null);
  const isKakaoLoaded = useKakaoLoader();
  const mapId = `map-${type}`;
  const isFormType = type === 'events-form';
  const mapContainerRef = useRef(null);
  const overlaysRef = useRef([]);
  const initializedRef = useRef(false);


  const updateMarkersAndOverlays = useCallback(() => {
    const kakaoMap = mapRef.current;
    if (!kakaoMap || !items?.length) return;

    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    // 먼저 선택되지 않은 마커들을 그립니다
    items.forEach((item, index) => {
      const lat = Number(item.lat || item.tp_events?.lat);
      const lng = Number(item.lng || item.tp_events?.lng);
      const isSelected = selectedLocation?.id === item.id;

      if (lat && lng && !isSelected) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        const position = new window.kakao.maps.LatLng(lat, lng);
        bounds.extend(position);

        if (!isFormType) {
          const MarkerComponent = () => (
            <LocationMarker
              index={index}
              isEvent={type === "events"}
              color={PASTEL_COLORS[index % PASTEL_COLORS.length]}
              onClick={() => onMarkerClick?.(item)}
              style={{ opacity: 0.5 }} // 선택되지 않은 마커는 반투명하게
            />
          );
          console.log('items Marker Index'+index+', color:'+PASTEL_COLORS[index % PASTEL_COLORS.length]);

          const container = document.createElement('div');
          ReactDOM.render(<MarkerComponent />, container);

          const overlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: container,
            map: kakaoMap,
            yAnchor: 1.3,
            zIndex: 1
          });

          overlaysRef.current.push(overlay);
        }
      }
    });

    // 선택된 마커를 마지막에 그려서 가장 위에 표시
    if (selectedLocation) {
      const lat = Number(selectedLocation.lat || selectedLocation.tp_events?.lat);
      const lng = Number(selectedLocation.lng || selectedLocation.tp_events?.lng);

      if (lat && lng) {
        const position = new window.kakao.maps.LatLng(lat, lng);
        const selectedIndex = items.findIndex(item => item.id === selectedLocation.id);

        const MarkerComponent = () => (
          <LocationMarker
            index={selectedIndex}
            isEvent={type === "events"}
            color={PASTEL_COLORS[selectedIndex % PASTEL_COLORS.length]}
            onClick={() => onMarkerClick?.(selectedLocation)}
            style={{ transform: 'scale(1.2)' }} // 선택된 마커는 약간 크게
          />
        );
        console.log('selectedLocation Marker Index'+selectedIndex+', color:'+PASTEL_COLORS[selectedIndex % PASTEL_COLORS.length]);
        console.log('selected +'+selectedLocation);

        const container = document.createElement('div');
        ReactDOM.render(<MarkerComponent />, container);

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: container,
          map: kakaoMap,
          yAnchor: 1.3,
          zIndex: 100 // 선택된 마커를 가장 위에 표시
        });

        overlaysRef.current.push(overlay);
        kakaoMap.panTo(position);
      }
    }
    else if (!isFormType && overlaysRef.current.length > 0) {
      const padding = 0;
      const virtualBounds = new window.kakao.maps.LatLngBounds(
        new window.kakao.maps.LatLng(minLat - padding, minLng - padding),
        new window.kakao.maps.LatLng(maxLat + padding, maxLng + padding)
      );

      kakaoMap.setBounds(virtualBounds);
    }
    else if (isFormType && overlaysRef.current.length > 0 && !(lat && lng)) {
      kakaoMap.panTo(overlaysRef.current[0].getPosition());
    }

  }, [type, isFormType, items, onMarkerClick, selectedLocation]);

  // props로 받은 selectedLocation이 변경될 때 state 업데이트
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      updateMarkersAndOverlays();
    }
  }, [selectedLocation, updateMarkersAndOverlays]);
  // useEffect(() => {
  //   const kakaoMap = mapRef.current;
  //   if (!kakaoMap || !selectedLocation) {
  //     console.log("selectedLocation 실패.");
  //     return;
  //   }

  //   const lat = selectedLocation.lat || selectedLocation.tp_events?.lat;
  //   const lng = selectedLocation.lng || selectedLocation.tp_events?.lng;
  //   console.log("selectedLocation " + selectedLocation);

  //   if (lat && lng) {
  //     const position = new window.kakao.maps.LatLng(lat, lng);
  //     console.log("position " + position);
  //     kakaoMap.panTo(position);
  //   }
  // }, [selectedLocation]);

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
    console.log(`${type} MapView - 초기화 시작`, new Date().toISOString());

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

      console.log(`${type} MapView - 초기화 끝`, new Date().toISOString());
    }, 100); // 100ms 딜레이

  }, [isKakaoLoaded, isFormType, onLocationSelect, marker, updateMarkersAndOverlays]);


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
        if (marker) {
          marker.setMap(null);
        }
        // React 컴포넌트 cleanup
        overlaysRef.current.forEach(overlay => {
          const content = overlay.getContent();
          if (content) {
            ReactDOM.unmountComponentAtNode(content);
          }
          overlay.setMap(null);
        });
        overlaysRef.current = [];
        initializedRef.current = false;
        mapRef.current = null;
      }
    };
  }, [visible, initializeMap, clickListener, marker]);

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