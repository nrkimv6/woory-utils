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
          },
          Notifications: {
            styles: (theme) => ({
              root: {
                position: 'fixed !important',
                top: '0 !important',
                right: '0 !important',
                left: 'auto !important',
                transform: 'none !important',
                alignItems: 'flex-start !important',
                width: '300px !important',
                margin: '1rem !important'
              }
            })
          }
        },
      }}>
      <Notifications
        position="top-right"
        limit={3}
        autoClose={5000}
      />
      <ModalsProvider>
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}