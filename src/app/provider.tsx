'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={{
        components: {
          Tabs: {
            styles: {
              tab: {
                padding: '10px 20px',
                '&[data-active]': {
                  borderBottom: '2px solid #228be6',
                },
              },
            },
          }
        },
      }}>
      <ModalsProvider>
        <div style={{ position: 'relative' }}>
          <Notifications
            classNames={{
              root: 'notifications-root',
              notification: 'notification-item'
            }}
          />
          <style jsx global>{`
            .notifications-root {
              position: fixed !important;
              top: 16px !important;
              right: 16px !important;
              left: auto !important;
              bottom: auto !important;
              width: 320px !important;
              z-index: 9999 !important;
              transform: none !important;
            }
            .notification-item {
              width: 100% !important;
              margin: 0 0 8px 0 !important;
            }
          `}</style>
          {children}
        </div>
      </ModalsProvider>
    </MantineProvider>
  );
}