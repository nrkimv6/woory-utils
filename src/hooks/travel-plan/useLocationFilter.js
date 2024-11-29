// hooks/useLocationFilter.js
import { useState, useMemo } from 'react';
import { formatDateStr } from '@/util/formatter';

const generateMarkerText = (index, type) => {
  return type === 'events' 
    ? String.fromCharCode(65 + index) 
    : (index + 1).toString();
};
export const filterByDate = (items, date, activeTab) => {
  const dateStr = formatDateStr(date);
  return items.filter(item => {
    if (activeTab === "events") {
      return item.start_date <= dateStr && dateStr <= item.end_date;
    } else {
      console.log('visit time:'+item.visitTime );
      const visitDate = item.visitTime ? 
        formatDateStr(item.visitTime) : 
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
    const timeA = new Date(a.visitTime).getTime();
    const timeB = new Date(b.visitTime).getTime();
    return timeA - timeB;
  });
};

const applyFilters = (items, filters, activeTab) => {
  if (!items) return [];
  
  let filtered = [...items];
  
  if (filters.date) {
    filtered = filterByDate(filtered, filters.date, activeTab);
  }
  
  if (activeTab === "events") {
    filtered = filterEventItems(filtered, filters);
  } else {
    filtered = sortVisitsByTime(filtered);
  }
  
  // 필터링된 결과에 pin_idx와 markerText 할당
  return filtered.map((item, index) => ({
    ...item,
    pin_idx: index,
    markerText: generateMarkerText(index, activeTab),
    lat: item.lat?item.lat:item.tp_events?.lat,
    lng: item.lng?item.lng:item.tp_events?.lng
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