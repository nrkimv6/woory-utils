// utils/formatters.js
import { format } from 'date-fns';

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr),
     'yyyy-MM-dd HH:mm');
  } catch (e) {
    return '-';
  }
};

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return '';
  return formatInTimeZone(
    new Date(date), 
    'Asia/Seoul', 
    formatStr
  );
};

export const formatDateForDB = (date) => {
  if (!date) return null;
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm:ssXXX");
};