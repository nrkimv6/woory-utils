import { notifications } from '@mantine/notifications';

// // 성공 알림
// export const showSuccess = (message, title = '성공') => {
//   notifications.show({
//     ...defaultNotificationConfig,
//     title,
//     message,
//     color: 'green',
//     icon: '✓'
//   });
// };

// // 에러 알림
// export const showError = (message, title = '오류') => {
//   notifications.show({
//     ...defaultNotificationConfig,
//     title,
//     message,
//     color: 'red',
//     icon: '✕'
//   });
// };

// 경고 알림
export const showWarning = (message, title = '주의') => {
  notifications.show({
    ...defaultNotificationConfig,
    title,
    message,
    color: 'yellow',
    icon: '⚠'
  });
};

// 정보 알림
export const showInfo = (message, title = '알림') => {
  notifications.show({
    ...defaultNotificationConfig,
    title,
    message,
    color: 'blue',
    icon: 'ℹ'
  });
};



const defaultNotificationConfig = {
  autoClose: 5000,
  withCloseButton: true,
  position: 'top-center',
  style: { width: 'auto', minWidth: '300px', maxWidth: '600px' },
  onClose: () => notifications.cleanQueue() // 큐 클리어 추가
};

// 알림 타입별 설정
const notificationTypes = {
  success: { color: 'teal', icon: '✓' },
  error: { color: 'red', icon: '✕' },
  warning: { color: 'yellow', icon: '⚠' },
  info: { color: 'blue', icon: 'ℹ' }
};

export const showNotification = (type, message, title, timeout=5000) => {
  const config = notificationTypes[type];
  notifications.clean(); // 기존 알림 제거
  notifications.show({
    ...defaultNotificationConfig,
    ...config,
    title,
    message,
    autoClose: timeout,
    timeout: timeout // timeout 명시적 지정
  });
};

export const showSuccess = (message, title = '성공',timeout=2500) => 
  showNotification('success', message, title);

export const showError = (message, title = '오류') => 
  showNotification('error', message, title);