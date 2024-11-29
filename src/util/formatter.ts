// utils/formatters.js
import { format } from 'date-fns';

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr),
      'yyyy-MM-dd HH:mm');
  } catch (e) {
    return '-';
  }
};

export const formatTime = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr),
      'HH:mm');
  } catch (e) {
    return '-';
  }
};


export const formatStringToTime = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(`2000-01-01T${dateStr}`),
      'HH:mm');
  } catch (e) {
    return '-';
  }
};

export const formatDateForDB = (date: Date | string) => {
  if (!date) return null;
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm:ssXXX");
};


// export const formatDate_v1 = (date: Date | string, formatStr = 'yyyy-MM-dd') => {
//   if (!date) return '';
//   return formatInTimeZone(
//     new Date(date), 
//     'Asia/Seoul', 
//     formatStr
//   );
// };

export const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
};

// 로깅용
export const logDate = (date: Date | string) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const fromDBTime = (dbTime: string | null | undefined): string | undefined => {
  if (!dbTime) return undefined;

  // UTC 시간을 한국 시간으로 변환
  const utcDate = new Date(dbTime);
  const koreanOffset = 9 * 60; // 한국은 UTC+9
  const localMinutes = utcDate.getUTCMinutes() + koreanOffset;

  const koreanDate = new Date(Date.UTC(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    localMinutes
  ));

  // ISO 문자열로 반환하면서 시간대 정보 포함
  // return koreanDate.toISOString();

   return koreanDate.getFullYear() + '-' +
         String(koreanDate.getMonth() + 1).padStart(2, '0') + '-' +
         String(koreanDate.getDate()).padStart(2, '0') + 'T' +
         String(koreanDate.getHours()).padStart(2, '0') + ':' +
         String(koreanDate.getMinutes()).padStart(2, '0') + ':' +
         String(koreanDate.getSeconds()).padStart(2, '0') + '.' +
         String(koreanDate.getMilliseconds()).padStart(3, '0');
};

export const formatDateStr = (dateTime: string, formatStr = 'yyyy-MM-dd') => {
  try {
    // visitTime이 이미 로컬 시간을 가리키므로 직접 Date 객체로 변환
    return format(new Date(dateTime), formatStr);
  } catch (error) {
    console.error('Date parsing error:', error);
    return false;
  }
}