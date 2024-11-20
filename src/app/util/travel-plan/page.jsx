"use client"

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

// 확장된 샘플 데이터
const locations = [
  {
    id: 1,
    name: "BTS 팝업스토어",
    lat: 37.5665,
    lng: 126.9780,
    description: "방탄소년단 특별전시",
    startDate: "2024-11-20",
    endDate: "2024-12-20",
    openTime: "10:00",
    closeTime: "21:00",
    address: "서울특별시 강남구 삼성동 159 코엑스몰 B1층 B108호",
    needReservation: true,
    category: "연예인",
    district: "강남",
  },
  {
    id: 2,
    name: "라인프렌즈 팝업",
    lat: 37.5707,
    lng: 126.9762,
    description: "겨울 한정 팝업스토어",
    startDate: "2024-11-15",
    endDate: "2024-12-15",
    openTime: "11:00",
    closeTime: "20:00",
    address: "서울특별시 성동구 성수동2가 333-16 대림창고 2층",
    needReservation: false,
    category: "캐릭터",
    district: "성수",
  },
];

const categories = ["화장품", "게임", "연예인", "캐릭터"];
const districts = ["동대문", "성수", "여의도", "잠실", "강남", "압구정", "홍대"];

const KakaoMapList = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filteredLocations, setFilteredLocations] = useState(locations);

  useEffect(() => {
    // 카카오맵 스크립트 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=116eccfbd89455c14ac12a0693aada92&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 7
        };
        const kakaoMap = new window.kakao.maps.Map(container, options);
        setMap(kakaoMap);
      });
    };
  }, []);


  // 필터링 로직
  useEffect(() => {
    let filtered = locations;

    // 날짜 필터링
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(location => 
        location.startDate <= dateStr && dateStr <= location.endDate
      );
    }

    // 카테고리 필터링
    if (selectedCategory) {
      filtered = filtered.filter(location => 
        location.category === selectedCategory
      );
    }

    // 지역 필터링
    if (selectedDistrict) {
      filtered = filtered.filter(location => 
        location.district === selectedDistrict
      );
    }

    setFilteredLocations(filtered);
    updateMarkers(filtered);
  }, [selectedDate, selectedCategory, selectedDistrict]);

  const updateMarkers = (locations) => {
    if (!map) return;
    
    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));

    // 새로운 마커 생성
    const newMarkers = locations.map(location => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(location.lat, location.lng),
        map: map
      });
      return marker;
    });

    setMarkers(newMarkers);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 필터 섹션 */}
      <div className="p-4 bg-white border-b flex space-x-4">
        <div className="w-64">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
        
        <div className="space-y-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {districts.map(district => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1">
        <div className="w-1/3 p-4 overflow-y-auto">
          <div className="space-y-4">
            {filteredLocations.map(location => (
              <Card 
                key={location.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedLocation?.id === location.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleLocationClick(location)}
              >
                <h3 className="font-bold">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.description}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>기간: {location.startDate} ~ {location.endDate}</p>
                  <p>시간: {location.openTime} ~ {location.closeTime}</p>
                  <p>주소: {location.address}</p>
                  <p>예약: {location.needReservation ? "필요" : "불필요"}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 rounded-full text-xs">
                      {location.category}
                    </span>
                    <span className="px-2 py-1 bg-green-100 rounded-full text-xs">
                      {location.district}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="w-2/3 relative">
          <div id="map" className="w-full h-2/3" />
          
          {selectedLocation && (
            <Card className="absolute bottom-0 w-full p-4 bg-white">
              <h2 className="text-xl font-bold mb-2">{selectedLocation.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">기간</p>
                  <p>{selectedLocation.startDate} ~ {selectedLocation.endDate}</p>
                </div>
                <div>
                  <p className="font-semibold">운영시간</p>
                  <p>{selectedLocation.openTime} ~ {selectedLocation.closeTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold">주소</p>
                  <p>{selectedLocation.address}</p>
                </div>
                <div>
                  <p className="font-semibold">예약여부</p>
                  <p>{selectedLocation.needReservation ? "사전예약 필요" : "예약 불필요"}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoMapList;