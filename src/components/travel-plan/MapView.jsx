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

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!isKakaoLoaded || !mapContainerRef.current) return;

    // 기존 리스너 및 마커 제거
    if (clickListener) {
      window.kakao.maps.event.removeListener(clickListener);
      setClickListener(null);
    }
    if (marker) {
      marker.setMap(null);
    }
    customOverlays.forEach(overlay => overlay.setMap(null));

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: isFormType ? 3 : 7
    };

    // 새 맵 인스턴스 생성
    const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options);

    // 폼 타입일 경우 클릭 이벤트 설정
    if (isFormType && onLocationSelect) {
      const listener = window.kakao.maps.event.addListener(
        kakaoMap,
        'click',
        (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          if (marker) {
            marker.setMap(null);
          }
          const newMarker = new window.kakao.maps.Marker({
            position: latlng,
            map: kakaoMap
          });
          setMarker(newMarker);
          // 부드러운 이동 적용
          kakaoMap.panTo(latlng);
          onLocationSelect(latlng);
        }
      );
      setClickListener(listener);
    }

    // 맵 인스턴스 저장
    setMap(kakaoMap);

    // 지도 사이즈 강제 리셋
    setTimeout(() => {
      kakaoMap.relayout();

      // 초기 마커 표시 (폼 타입이고 위치가 있는 경우)
      if (isFormType && items?.[0]?.lat && items[0]?.lng) {
        const position = new window.kakao.maps.LatLng(items[0].lat, items[0].lng);
        const newMarker = new window.kakao.maps.Marker({
          position: position,
          map: kakaoMap
        });
        setMarker(newMarker);
        kakaoMap.setCenter(position);
      }
    }, 100);
  }, [isKakaoLoaded, isFormType, onLocationSelect]);


  useEffect(() => {
    if (!map || !isFormType || !items?.[0]?.lat || !items[0]?.lng) return;

    const position = new window.kakao.maps.LatLng(items[0].lat, items[0].lng);
    if (marker) {
      marker.setMap(null);
    }
    const newMarker = new window.kakao.maps.Marker({
      position: position,
      map: map
    });
    setMarker(newMarker);
    // 부드러운 이동 적용
    map.panTo(position);
  }, [items, map, isFormType]);

  // visible이 true가 될 때마다 초기화
  useEffect(() => {
    if (visible) {
      initializeMap();
    }

    // cleanup
    return () => {
      if (clickListener) {
        window.kakao.maps.event.removeListener(clickListener);
        setClickListener(null);
      }
      if (marker) {
        marker.setMap(null);
      }
      customOverlays.forEach(overlay => overlay.setMap(null));
    };
  }, [visible, initializeMap]);

  // 마커/오버레이 업데이트 (목록 표시용)
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
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute'
        }}
      />{!isFormType && selectedLocation && visible && (
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