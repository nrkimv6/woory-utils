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
    },
  }}>
    {/*  <MantineProvider defaultColorScheme="light"> */}
          <Notifications />
      <ModalsProvider>
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}