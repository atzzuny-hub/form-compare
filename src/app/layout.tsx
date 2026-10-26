import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
  title: 'Form Compare',
  description: 'zod + Field.* / RHF + MUI / useState 폼 비교 예제',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko">
      <body>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}