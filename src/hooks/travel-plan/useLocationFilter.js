import { useState, useMemo } from 'react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
const generateMarkerText = (index, type) => {
  return type === 'events' 
    ? String.fromCharCode(65 + index) 
    : (index + 1).toString();
};
export const filterByDate = (items, date, activeTab) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return items.filter(item => {
    if (activeTab === "events") {
      return item.start_date <= dateStr && dateStr <= item.end_date;
    } else {
      const visitDate = item.visit_time ? 
        format(parseISO(item.visit_time), 'yyyy-MM-dd') : 
        null;
      return visitDate === dateStr;
    }
  });
};

const filterEventItems = (items, filters) => {
  let filtered = [...items];
  
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(item => item.category === filters.category);
  }
  
  if (filters.district && filters.district !== 'all') {
    filtered = filtered.filter(item => item.district === filters.district);
  }
  
  return filtered;
};

const sortVisitsByTime = (visits) => {
  return [...visits].sort((a, b) => {
    const timeA = new Date(a.visit_time).getTime();
    const timeB = new Date(b.visit_time).getTime();
    return timeA - timeB;
  });
};

const applyFilters = (items, filters, activeTab) => {
  if (!items) return [];
  
  let filtered = [...items];
  
  // 날짜 필터링
  if (filters.date) {
    filtered = filterByDate(filtered, filters.date, activeTab);
  }
  
  // 이벤트 전용 필터는 events 탭에서만 적용
  if (activeTab === "events") {
    filtered = filterEventItems(filtered, filters);
  } else {
    // 방문 계획은 시간순으로 정렬
    filtered = sortVisitsByTime(filtered);
  }
  
  // 필터링된 결과에 pin_idx 할당
  return filtered.map((item, index) => ({
    ...item,
    pin_idx: index,
    markerText: generateMarkerText(index, activeTab)
  }));
};

export const useLocationFilter = (activeTab, events, visits) => {
  const [filters, setFilters] = useState({
    date: new Date(),
    category: 'all',
    district: 'all'
  });

  const filteredItems = useMemo(() => {
    const items = activeTab === "events" ? events : visits;
    return applyFilters(items, filters, activeTab);
  }, [activeTab, events, visits, filters]);

  return { filters, setFilters, filteredItems };
};