# [폼 비교 ①] Next.js 16 + MUI v9 프로젝트 셋업 (App Router, DatePicker 한국어 설정까지)

## 목적

같은 예약 모달을 ① zod + Field.* ② zod + RHF + MUI 기본 ③ useState 세 가지로 만들어 비교하고, 기존 useState 모달을 고칠지 판단한다.

## 환경 / 버전

| 항목 | 버전 |
|---|---|
| Node.js | 20.9 이상 필요 (Next 16 요구사항), 현재 v24 |
| next / react | 16.4.3 / 19.3 |
| @mui/material, @mui/material-nextjs | 9.5.0 |
| @mui/x-date-pickers | 9.16.0 (무료 MIT, `-pro` / `-premium`만 유료) |
| zod / react-hook-form / @hookform/resolvers | 4.6.7 / 7.91.0 / 5.9.2 |
| dayjs / @iconify/react | 1.11.23 / 6.0.3 |

---

## 설치 명령어

- `--no-cache-components`: Cache Components 끄기. 켜져 있으면 DateTimePicker 내부의 `new Date()` 때문에 빌드가 실패한다.
- `@emotion/react`, `@emotion/styled`: MUI가 스타일을 만들 때 쓰는 엔진 (필수)
- `@mui/material-nextjs`, `@emotion/cache`: Next.js 서버 렌더링 때 MUI 스타일을 같이 보내준다. material-nextjs가 @emotion/cache를 필요로 한다.
- `dayjs`: DatePicker가 날짜를 계산할 때 쓰는 라이브러리. 기존 프로젝트와 같은 걸 골랐다.

```bash
# 프로젝트 폴더로 이동 (비어 있어야 함, .git은 괜찮음)
cd /Users/zzuny/reve/form-compare

# Next.js 16 프로젝트 생성
npx create-next-app@latest . --ts --eslint --app --src-dir --no-tailwind --no-react-compiler --no-cache-components --import-alias "@/*" --use-npm --disable-git

# MUI 관련 설치
npm install @mui/material @emotion/react @emotion/styled @emotion/cache @mui/material-nextjs

# 날짜 피커 설치
npm install @mui/x-date-pickers dayjs

# 폼과 검증 라이브러리 설치
# @hookform/resolvers는 v5로 고정 (v6.0.0은 npm 의존성 충돌로 설치 실패)
# zod는 @4로 명시 (안 쓰면 eslint 쪽에 이미 있는 v3가 깔림)
npm install react-hook-form @hookform/resolvers@5 zod@4

# 아이콘 설치
npm install @iconify/react
```

---

## MUI 연결 (파일 4개)

Next.js App Router에서 MUI를 쓰려면 이렇게 감싸야 한다.

```
layout.tsx → AppRouterCacheProvider → ThemeProvider → LocalizationProvider → 각 화면
```

| Provider | 하는 일 | 빼면? |
|---|---|---|
| AppRouterCacheProvider | 서버에서 만든 HTML에 MUI 스타일을 같이 넣어줌 | 새로고침할 때 잠깐 스타일 없는 화면이 보임 |
| ThemeProvider | theme.ts 설정(글꼴, 한국어 문구)을 전체에 적용 | 기본 테마(영어)로 나옴 |
| CssBaseline | 브라우저마다 다른 기본 여백·글꼴을 통일 | body에 브라우저 기본 여백(8px)이 생기고, 브라우저마다 글꼴·여백이 달라짐 |
| LocalizationProvider | DatePicker에 "dayjs를 쓰고, 한국어로" 알려줌 | DatePicker가 에러남 |

### ① `src/theme/theme.ts` (새 파일)

테마 파일. MUI와 DatePicker의 버튼·안내 문구를 한국어로 바꾼다.

```ts
import { createTheme } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';
import { koKR as pickersKoKR } from '@mui/x-date-pickers/locales';

export const theme = createTheme(
    {
        cssVariables: true, // https://mui.com/material-ui/customization/theming/#css-theme-variables
        typography: { // https://mui.com/material-ui/customization/typography/#font-family
            fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        },
    },
    koKR,        // MUI 기본 문구 (페이지네이션 등)
    pickersKoKR, // DatePicker 문구 (확인/취소 등)
)
```

### ② `src/components/app-providers.tsx` (새 파일)

Provider를 모아두는 파일. ThemeProvider와 LocalizationProvider는 브라우저에서 동작하는 컴포넌트라 `'use client'`가 필요하다. 그래서 layout(서버 컴포넌트)과 분리한다.

`import 'dayjs/locale/ko'` 이게 없으면 `adapterLocale="ko"`라고 써도 에러 없이 조용히 영어로 나온다.

```tsx
'use client';

import 'dayjs/locale/ko';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { theme } from '@/theme/theme';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
```

### ③ `src/app/layout.tsx` (전체 교체)

`LayoutProps<'/'>`는 import 없이 쓰는 타입이다. Next 16이 `npm run dev`나 build 때 자동으로 만들어 주므로, 한 번도 실행하기 전에는 에디터에 빨간 줄이 보일 수 있다.

```tsx
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
```

### ④ 기본 파일 정리 + `src/app/page.tsx`

- `src/app/globals.css`, `src/app/page.module.css`는 삭제. 스타일은 CssBaseline이 대신한다.
- `public/`의 기본 svg 5개(file, globe, next, vercel, window)도 쓰지 않으니 삭제.
- page.tsx는 **연결 확인용 임시 코드**. 아래 "화면 구조" 단계에서 교체한다.

```tsx
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export default function Page() {
  return (
    <Container sx={{ py: 5, display: 'grid', gap: 2, maxWidth: 360 }}>
      <Button variant="contained">MUI 버튼</Button>
      <DateTimePicker label="날짜 테스트" />
    </Container>
  );
}
```

`npm run dev` → 버튼과 날짜 입력칸이 보이고, 달력을 열었을 때 요일이 "일 월 화…"로 나오면 성공.

---

## 화면 구조: app/은 "주소표", sections/는 "화면"

- page.tsx는 서버 컴포넌트라 `useState`, `onClick`을 못 쓴다.
- page.tsx에 `'use client'`를 붙이면 이번엔 `metadata`를 export할 수 없다.
- `sections/` 폴더만 복사하면 fwweb으로 옮길 수 있다.

```
src/
├── app/page.tsx                          ← 주소(/)와 연결만 함 (서버 컴포넌트)
└── sections/form-compare/
    └── view/
        ├── form-compare-view.tsx         ← 실제 화면 ('use client')
        └── index.ts                      ← 내보내기 모음
```

### ① `src/sections/form-compare/view/form-compare-view.tsx` (새 파일)

```tsx
'use client'

export function FormCompareView(){
    return(
        <div>FORM 영역</div>
    )
}
```

### ② `src/sections/form-compare/view/index.ts` (새 파일)

이 파일이 있으면 import할 때 `.../view/form-compare-view` 대신 `.../view`까지만 써도 된다.

```ts
export * from './form-compare-view';
```

### ③ `src/app/page.tsx` (전체 교체)

```tsx
import type { Metadata } from 'next';
import { FormCompareView } from '@/sections/form-compare/view';

export const metadata : Metadata = { title: '식당 예약'}

export default function Page() {
  return <FormCompareView/>;
}
```

---

## 트러블슈팅 (셋업하며 만난 에러)

| 에러 | 원인 | 해결 |
|---|---|---|
| `ERESOLVE unable to resolve dependency tree` | @hookform/resolvers 6.0.0의 선택 의존성끼리 버전 충돌 (effect v3 vs v4) | `@hookform/resolvers@5` |
| zod가 v3로 설치됨 | eslint-config-next가 이미 쓰는 zod 3.25를 npm이 재사용 | `zod@4` 명시 |
| ``encountered the unstable value `new Date()` `` | cacheComponents가 켜져 있으면 DateTimePicker의 `new Date()`가 프리렌더(빌드)를 막음 | `--no-cache-components` (또는 `<Suspense>`로 감싸기) |

## 커밋

```
b01366b chore: Next.js 16 + MUI v9 프로젝트 셋업
```
