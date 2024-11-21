// utils/formatters.js
import { format } from 'date-fns';

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
  } catch (e) {
    return '-';
  }
};