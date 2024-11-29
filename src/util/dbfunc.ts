export const saveToUTC = (localTime: string | Date) => {
  const local = new Date(localTime); 
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString();
};

// DB -> client 표시 시 
export const utcToLocal = (utcTime: string) => {
  const date = new Date(utcTime);
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
};