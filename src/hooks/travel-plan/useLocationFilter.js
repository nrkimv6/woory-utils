import { useState, useMemo } from 'react';
import { format } from 'date-fns';

export const filterByDate = (items, date, activeTab) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return items.filter(item => {
    if (activeTab === "events") {
      return item.start_date <= dateStr && dateStr <= item.end_date;
    } else {
      const visitDate = item.visit_time ? 
        format(new Date(item.visit_time), 'yyyy-MM-dd') : 
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

const applyFilters = (items, filters, activeTab) => {
  if (!items) return [];
  
  let filtered = [...items];
  console.log('Initial items:', filtered); // 디버깅용
  
  // 날짜 필터링
  if (filters.date) {
    filtered = filterByDate(filtered, filters.date, activeTab);
    console.log('After date filter:', filtered); // 디버깅용
  }
  
  // 이벤트 전용 필터는 events 탭에서만 적용
  if (activeTab === "events") {
    filtered = filterEventItems(filtered, filters);
    console.log('After event filters:', filtered); // 디버깅용
  }
  
  return filtered;
};

export const useLocationFilter = (activeTab, events, visits) => {
  const [filters, setFilters] = useState({
    date: new Date(),
    category: 'all',
    district: 'all'
  });

  const filteredItems = useMemo(() => {
    const items = activeTab === "events" ? events : visits;
    console.log('Processing items for tab:', activeTab, items); // 디버깅용
    return applyFilters(items, filters, activeTab);
  }, [activeTab, events, visits, filters]);

  return { filters, setFilters, filteredItems };
};