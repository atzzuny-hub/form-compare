# [폼 비교 ②] 공통 데이터·검증 규칙 정하고 useState로 예약 모달 만들기

> 상태: **4번(useState 폼) 작성 중.** 이어서 할 때는 [4. useState 폼](#4-usestate-폼--state-formtsx)의 단계 중 멈춘 곳부터 하면 된다.
> 진행 상황 전체는 [PROGRESS.md](./PROGRESS.md) 참고.

목차

1. 공통 데이터 — `types.ts`, `constants.ts`
2. 검증 규칙 정리 — 세 폼이 모두 지킬 기준
3. 모달 화면 — `form-compare-view.tsx`를 버튼 + Dialog로
4. useState 폼 — `state-form.tsx` (0~8단계)
5. 확인
6. 이 방식의 불편한 점 (초안)

---

## 1. 공통 데이터 — types.ts, constants.ts

### 파일을 나누는 기준

폼 값의 타입은 여기에 쓰지 않는다. ③편에서 zod 스키마로 자동으로 만들고, useState 버전은 자기 파일 안에 직접 정의한다.

useState 버전은 스키마가 없어서 타입을 직접 써야 한다. 이것도 6번에서 다룰 불편한 점 중 하나다.

| 파일 | 넣는 것 | 넣지 않는 것 |
|---|---|---|
| types.ts | zod와 상관없는 모양 (Region, Branch, Manager) | 폼 값 타입 (③편 zod 스키마, 또는 useState 파일 안에서 정의) |
| constants.ts | 바뀌지 않는 값 (목록, 형식, 정규식, 에러 메시지) | zod import |

### 1단계. `src/sections/form-compare/types.ts` (새 파일)

```ts
// ----------------------------------------------------------------------
// 공통 타입 - 선택 목록(Select) 항목처럼 zod 스키마와 상관없는 모양만 둔다.
// 폼 값의 타입은 여기 두지 않는다 (zod 버전은 schema.ts에서 zod.infer로, useState 버전은 자기 파일 안에 직접).
// ----------------------------------------------------------------------

export interface Region {
    id: number,
    name: string,
}

export interface Branch {
    id: number,
    regionId: number,
    name: string,
}

export interface Manager {
    id: number,
    name: string
}
```

### 2단계. `src/sections/form-compare/constants.ts` (새 파일)

```ts
// ----------------------------------------------------------------------
// 공통 데이터 - 세 가지 폼(Field.* / RHF + MUI / useState)이 똑같이 쓴다.
// ----------------------------------------------------------------------

import { Branch, Manager, Region } from "./types";

// 날짜는 "저장 형식"과 "표시 형식"을 분리한다.
// - 저장(폼 값, API 전송): RESULT_FORMAT
// - 화면(입력창에 보이는 글자): DISPLAY_FORMAT

export const RESULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss'
export const DISPLAY_FORMAT = 'YYYY/MM/DD HH:mm'

// 연락처 형식 - zod 스키마와 useState 버전의 if문 검사가 같이 쓴다
export const PHONE_REGEX = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export const REGION_LIST: Region[] = [
    {id: 1, name: '서울'},
    {id: 2, name: '부산'},
]

export const BRANCH_LIST: Branch[] = [
    {id: 11, regionId: 1, name: '강남점'},
    {id: 12, regionId: 1, name: '홍대점'},
    {id: 13, regionId: 2, name: '해운대점'},
    {id: 14, regionId: 2, name: '서면점'},
]

export const MANAGER_LIST: Manager[] = [
    {id: 1, name: '김매니저'},
    {id: 2, name: '정매니저'},
]
```

> **함정 두 개 (TypeScript·lint는 둘 다 통과한다)**
> - `RESULT_FORMAT`에서 `T`가 빠지면(`'YYYY-MM-DDHH:mm:ss'`) dayjs는 너그럽게 읽어줘서 화면은 멀쩡하지만, `new Date()`·서버·zod `iso.datetime`은 날짜로 인식하지 못한다.
> - 목록의 `id`가 겹치면 Select가 항목을 구분하지 못한다. (정매니저를 골라도 김매니저로 보임)
> 타입은 "숫자인가"만 보지 "중복인가, 형식이 맞나"는 모른다.

---

## 2. 검증 규칙 정리

세 가지 폼(useState / zod + RHF + MUI / zod + Field.*)은 모두 아래 규칙을 똑같이 지킨다.
구현 방식만 다르고 결과는 같아야 비교가 공정하다.

### 검증 규칙 — 값이 맞는지

| 필드 | 규칙 | 에러 메시지 |
|---|---|---|
| 지역 | 필수 ("선택안함" = 0) | 지역을 선택하세요 |
| 지점 | 필수 ("선택안함" = 0) | 지점을 선택하세요 |
| 예약일시 | 필수, 실제로 있는 날짜 | 예약일시를 선택하세요 |
| 인원 수 | 비었을 때 | 인원 수를 입력하세요 |
| 인원 수 | 소수일 때 (1.5) | 인원은 정수로 입력하세요 |
| 인원 수 | 0 이하일 때 | 인원은 1명 이상이어야 합니다 |
| 참석자 | 1명 이상 | 참석자를 1명 이상 추가하세요 |
| 요청사항 | 선택 (비워도 됨) | — |
| 담당자 | 관리자 모드일 때만 필수 | 담당자를 선택하세요 |

**참석자 추가 칸** — 추가 버튼을 누를 때 검사한다

| 필드 | 규칙 | 에러 메시지 |
|---|---|---|
| 이름 | 필수 (공백만 입력하면 안 됨) | 이름을 입력하세요 |
| 연락처 | PHONE_REGEX 형식 | 연락처 형식이 올바르지 않습니다 |

연락처 예시: `010-1234-5678` ⭕, `01012345678` ⭕, `011-123-4567` ⭕, `02-123-4567` ❌ (휴대폰만 받음)

### 동작 규칙 — 값끼리 어떻게 움직이는지

| 상황 | 동작 |
|---|---|
| 지역을 바꾸면 | 지점을 "선택안함"으로 되돌리고, 그 지역의 지점만 보여준다 |
| 지역을 고르기 전에는 | 지점 선택칸을 비활성화한다 |
| 관리자 모드가 꺼져 있으면 | 담당자 칸을 숨기고, 검사도 하지 않는다 |
| 모달을 열 때마다 | 모든 칸과 에러를 처음 상태로 되돌린다 (어떻게 닫았든) |
| 제출에 성공하면 | 제출된 값을 화면 아래에 보여준다 (확인용) |

> 💡 에러가 뜨는 시점은 일부러 맞추지 않는다. useState는 제출할 때 한꺼번에 검사하고, RHF는 칸을 건드릴 때마다 검사한다. 이 차이가 ⑤편의 비교 거리다.

### 에러 메시지는 constants.ts에 모은다

`src/sections/form-compare/constants.ts` 맨 아래에 추가.

```ts
// 에러 메시지 - 2번 검증 규칙 표의 메시지. 세 폼이 같은 문구를 쓰도록 한 곳에 모은다.
export const ERROR_MESSAGES = {
  regionId: '지역을 선택하세요',
  branchId: '지점을 선택하세요',
  reservedAt: '예약일시를 선택하세요',
  headCount: {
    empty: '인원 수를 입력하세요',
    notInt: '인원은 정수로 입력하세요',
    min: '인원은 1명 이상이어야 합니다',
  },
  attendees: '참석자를 1명 이상 추가하세요',
  managerId: '담당자를 선택하세요',
  // 참석자 추가 칸 (추가 버튼을 누를 때 검사)
  attendee: {
    name: '이름을 입력하세요',
    phone: '연락처 형식이 올바르지 않습니다',
  },
} as const; // as const 읽기전용
```

- 키 이름을 폼 값 이름(`regionId`, `headCount` …)과 맞춰서 `newErrors.regionId = ERROR_MESSAGES.regionId`처럼 바로 짝이 맞게 했다.
- `attendees`(목록이 비었다)와 `attendee`(추가할 한 명의 칸이 틀렸다)는 다른 것이다.

---

## 3. 모달 화면 — form-compare-view.tsx

`src/sections/form-compare/view/form-compare-view.tsx`를 버튼 + Dialog로 바꾼다. 폼 3칸 자리는 우선 제목만 둔다.

```tsx
'use client'

import {Container, Card, Typography, Stack, FormControlLabel, Switch, Button, Dialog, DialogTitle, Box, DialogActions, DialogContent} from "@mui/material";
import { useState } from "react"

export function FormCompareView(){

    const [open, setOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return(
        <Container sx={{ py: 5 }}>
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>식당 예약 모달 예제</Typography>

                {/* MUI v9: alignItems 같은 스타일은 prop이 아니라 sx로 넘긴다 */}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center'}}>
                    <FormControlLabel
                        label="관리자모드"
                        control={
                            <Switch
                                checked={isAdmin}
                                onChange={(e)=> setIsAdmin(e.target.checked)}
                            />
                        }
                    />
                    <Button variant="contained" onClick={handleOpen}>
                        열기
                    </Button>
                </Stack>
            </Card>

            <Dialog fullWidth maxWidth="xl" open={open} onClose={handleClose}>
                <DialogTitle>식당 예약 {isAdmin && '(관리자)'}</DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
                        <Typography variant="h6">zod + Field.*</Typography>
                        <Typography variant="h6">zod + RHF + MUI 기본</Typography>
                        <Typography variant="h6">useState</Typography>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button variant="outlined" onClick={handleClose}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
```

### 알게 된 것: 원본의 "열 때마다 초기화" 코드는 필요 없었다

MUI Dialog는 닫히면(닫힘 애니메이션이 끝나면) **안의 내용을 화면에서 완전히 없앤다(unmount)**. (`@mui/material/Modal/Modal.js` 190번째 줄: `keepMounted`가 false이고 닫혀 있으면 `return null`)

| 순서 | 결과 |
|---|---|
| 모달 열고 입력칸에 `hello` 입력 | 값: `hello` |
| 닫기 | 모달과 입력칸이 화면에서 사라짐 |
| 다시 열기 | 값: `''` (빈 칸) |

원본 폼은 모두 `useEffect(() => { if (open) reset(...) }, [open])` 같은 초기화 코드가 있었지만, 폼이 Dialog **안에** 있으면 다시 열 때 폼이 새로 만들어지므로 없어도 초기화된다. 그래서 이번 버전은 폼에 `open`을 넘기지 않는다.

단, 닫힘 애니메이션(약 0.2초) 도중에 다시 열면 이전 값이 남는다. 이건 4번 8단계에서 `key`로 막는다.

---

## 4. useState 폼 — state-form.tsx

### 현재 진행 위치 (다른 컴퓨터에서 이어갈 때 여기부터)

- [ ] 0단계 뼈대
- [ ] 1단계 지역 / 지점 ← **지금 작성 중** (Select 모양만 있고 state 연결 전)
- [ ] 2단계 예약일시
- [ ] 3단계 인원 수
- [ ] 4단계 참석자
- [ ] 5단계 요청사항 / 담당자
- [ ] 6단계 검사 + 제출
- [ ] 7단계 디버그 출력 (`form-debug-panel.tsx`)
- [ ] 8단계 view 연결 (`isAdmin`, `key`)

현재 파일에서 고쳐야 할 것

| 위치 | 문제 | 고치는 법 |
|---|---|---|
| 4번째 줄 | `import { HtmlContext } from "next/dist/..."` (자동 import 사고) | 지우기 |
| 지역/지점 `value={''}` | state 연결 전 + 값이 숫자 id인데 빈 문자열 | 1단계처럼 `reservationInfo.regionId` |
| 지역·지점 InputLabel id, Select labelId | 둘 다 `"region"` → 화면에 같은 id가 여러 개 | `state-region-label`, `state-branch-label` |
| 지점 `label="Age"` | MUI 문서 예제 그대로 → 테두리 빈 칸 폭이 "Age" 기준 | `label="지점"` |
| 지점 `id="region"`, `sx={{alignItems:'center'}}` | 필요 없음 | 지우기 |
| (이전 시도) `BRANCH_LIST.map(v => v.regionId === ...)` | `map`은 true/false 배열을 만든다 | `.filter(...)` |
| (이전 시도) 지역을 **이름**으로 저장 | MenuItem의 value는 **id(숫자)** → 비교가 항상 실패 | id(숫자)를 저장 |
| (이전 시도) 지점이 지역 state를 같이 씀 | 지점을 고르면 지역이 바뀜 | 값마다 따로 (`regionId`, `branchId`) |

### Select 라벨은 labelId 방식으로

```tsx
<InputLabel id="state-region-label">지역</InputLabel>
<Select labelId="state-region-label" label="지역" ...>
```

- `InputLabel`의 `id` = `Select`의 `labelId` → 스크린리더가 라벨을 읽는다.
- `label`에는 같은 글자를 준다 → 테두리에 라벨이 들어갈 빈 칸이 생긴다.
- 값이 0("선택안함")이어도 MUI는 "값이 있다"로 보고 라벨을 위로 올린다. (원본처럼 `shrink` + `notched` + `OutlinedInput`을 쓸 필요가 없다)
- 구분선은 `<Divider />` 대신 `<MenuItem divider>`. Select 안에 `<Divider />`를 넣으면 스크린리더에 빈 선택지로 읽힌다.

---

### 0단계. 뼈대 — 타입, 기본값, state

`src/sections/form-compare/state-form.tsx`를 이렇게 시작한다. import는 끝까지 쓸 것을 미리 다 넣었다(아직 안 쓰는 건 lint 경고만 나고 동작에는 문제없다).

```tsx
'use client';

import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material/Select';

import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { DebugJson } from './form-debug-panel';
import {
  BRANCH_LIST,
  DISPLAY_FORMAT,
  ERROR_MESSAGES,
  MANAGER_LIST,
  PHONE_REGEX,
  REGION_LIST,
  RESULT_FORMAT,
} from './constants';

// 폼 값 타입 - 스키마가 없으니 직접 쓴다
type Attendee = { id: number; name: string; phone: string };

type ReservationInfo = {
  regionId: number;
  branchId: number;
  reservedAt: string;
  // 입력칸의 글자를 그대로 저장한다. Number('')는 0이라서, 입력할 때 바로 Number()로 바꾸면
  // 빈 칸과 0을 구분할 수 없다. 숫자 변환은 제출할 때(toSubmitValue) 한다.
  headCount: string;
  attendees: Attendee[];
  memo: string;
  managerId: number;
};

type ReservationErrors = Partial<Record<keyof ReservationInfo, string>>;

const EMPTY_RESERVATION: ReservationInfo = {
  regionId: 0,
  branchId: 0,
  reservedAt: '',
  headCount: '',
  attendees: [],
  memo: '',
  managerId: 0,
};

type Props = {
  isAdmin: boolean;
};

export function StateForm({ isAdmin }: Props) {
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo>(EMPTY_RESERVATION);
  const [errors, setErrors] = useState<ReservationErrors>({});

  // 값이 바뀐 칸의 에러만 지운다. 다시 검사하지는 않고 다음 제출 때 본다.
  // (react-hook-form은 지우는 대신 그 칸을 바로 다시 검사한다 → ③편에서 비교)
  const clearError = (key: keyof ReservationInfo) => {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">useState</Typography>
      {/* 1단계부터 여기에 칸을 하나씩 추가한다 */}
    </Stack>
  );
}
```

- 7단계(`form-debug-panel.tsx`) 전까지는 `import { DebugJson } ...` 줄이 "파일 없음" 에러를 낸다. 그 줄만 7단계까지 주석 처리해 두면 된다.
- view에서는 아직 `<StateForm />`으로 부르고 있으니, 8단계 전까지는 `<StateForm isAdmin={isAdmin} />`으로 바꿔 두거나 `isAdmin` 빨간 줄을 무시한다.
- **state 업데이트는 항상 `(prev) => ({ ...prev, ... })` 모양으로 한다.** 원본처럼 `{ ...reservationInfo, ... }`로 쓰면 한 번에 여러 번 바꿀 때 예전 값으로 덮어쓸 수 있다.

### 1단계. 지역 / 지점

컴포넌트 안(`clearError` 아래)에 추가:

```tsx
  // 지점 목록은 state가 아니라 선택된 지역에서 계산한다
  const branchList = BRANCH_LIST.filter((b) => b.regionId === reservationInfo.regionId);

  const handleChangeRegion = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({
      ...prev,
      regionId: e.target.value,
      branchId: 0, // 지역이 바뀌면 지점 초기화
    }));
    clearError('regionId');
  };

  const handleChangeBranch = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({ ...prev, branchId: e.target.value }));
    clearError('branchId');
  };
```

JSX(`<Typography variant="h6">useState</Typography>` 아래)에 추가:

```tsx
      {/* Select 라벨: InputLabel의 id와 Select의 labelId를 같게, label에는 같은 글자를 준다 */}
      <FormControl size="small" error={!!errors.regionId} required>
        <InputLabel id="state-region-label">지역</InputLabel>
        <Select
          labelId="state-region-label"
          label="지역"
          value={reservationInfo.regionId}
          onChange={handleChangeRegion}
        >
          {/* 구분선은 <Divider />가 아니라 divider prop으로 (Select 안의 Divider는 빈 선택지로 읽힌다) */}
          <MenuItem value={0} divider><em>선택안함</em></MenuItem>
          {REGION_LIST.map((option) => (
            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>{errors.regionId}</FormHelperText>
      </FormControl>

      <FormControl size="small" error={!!errors.branchId} required disabled={!reservationInfo.regionId}>
        <InputLabel id="state-branch-label">지점</InputLabel>
        <Select
          labelId="state-branch-label"
          label="지점"
          value={reservationInfo.branchId}
          onChange={handleChangeBranch}
        >
          <MenuItem value={0} divider><em>선택안함</em></MenuItem>
          {branchList.map((option) => (
            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>{errors.branchId}</FormHelperText>
      </FormControl>
```

- `SelectChangeEvent<number>`이면 `e.target.value`가 이미 숫자다. 원본처럼 `String()` ↔ `Number()` 변환을 할 필요가 없다.
- 확인: 지역 고르기 전엔 지점이 회색, 서울 → 강남·홍대만, 부산으로 바꾸면 지점이 "선택안함"으로 돌아감.

### 2단계. 예약일시

state에 추가(`errors` 아래):

```tsx
  // DateTimePicker가 보여줄 값. 저장용 문자열(reservedAt)과 따로 둔다.
  // 없는 날짜(2월 31일)를 입력하면 picker는 'Invalid Date'를 넘기는데, 이걸 그대로 돌려줘야
  // 입력칸이 사용자가 친 글자를 유지한다. (저장용 값만 넘기면 null이 되어 입력이 씹힌다)
  const [reservedAtInput, setReservedAtInput] = useState<Dayjs | null>(null);
```

핸들러:

```tsx
  const handleChangeReservedAt = (newValue: Dayjs | null) => {
    setReservedAtInput(newValue);
    setReservationInfo((prev) => ({
      ...prev,
      // 지웠거나(null) 없는 날짜(2월 31일)면 빈 값으로 둔다 → 검사에서 걸린다
      reservedAt: newValue?.isValid() ? newValue.format(RESULT_FORMAT) : '',
    }));
    clearError('reservedAt');
  };
```

JSX:

```tsx
      {/* 화면에는 picker가 준 값(reservedAtInput)을, 저장은 문자열(reservedAt)로 따로 한다 */}
      <DateTimePicker
        label="예약일시"
        format={DISPLAY_FORMAT}
        value={reservedAtInput}
        onChange={handleChangeReservedAt}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            required: true,
            error: !!errors.reservedAt,
            helperText: errors.reservedAt,
            // MUI v9: InputLabelProps → slotProps.inputLabel
            slotProps: { inputLabel: { shrink: true } },
          },
        }}
      />
```

- 원본은 `value={reservedAt ? dayjs(reservedAt) : null}`처럼 저장용 문자열을 다시 dayjs로 바꿔 넘겼다. 그러면 2월 31일처럼 없는 날짜를 칠 때 picker 값이 null로 돌아와서 **마지막 칸 입력이 계속 씹힌다.** (리뷰에서 발견, 브라우저로 재현 확인)
- 확인: `2026/02/31 18:00`을 끝까지 칠 수 있고 values의 reservedAt은 `''`. 일을 28로 고치면 `2026-02-28T18:00:00`.

### 3단계. 인원 수

핸들러:

```tsx
  const handleChangeHeadCount = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReservationInfo((prev) => ({ ...prev, headCount: e.target.value }));
    clearError('headCount');
  };
```

JSX:

```tsx
      <TextField
        type="number"
        label="인원 수"
        size="small"
        required
        value={reservationInfo.headCount}
        onChange={handleChangeHeadCount}
        error={!!errors.headCount}
        helperText={errors.headCount}
        slotProps={{ inputLabel: { shrink: true } }}
      />
```

- 글자(`'3'`, `'1.5'`, `''`) 그대로 저장한다. 원본은 `Number(e.target.value)`로 저장해서 빈 칸이 0이 되어 "비었을 때"와 "0일 때"를 구분하지 못했다.
- MUI v9에서 `InputLabelProps`는 없어졌다 → `slotProps={{ inputLabel: { ... } }}`.

### 4단계. 참석자

컴포넌트 **밖**(`EMPTY_RESERVATION` 아래)에 추가:

```tsx
type AttendeeInput = { name: string; phone: string };
type AttendeeErrors = Partial<Record<keyof AttendeeInput, string>>;

const EMPTY_ATTENDEE: AttendeeInput = { name: '', phone: '' };

// 참석자 한 명 검사 (추가 버튼을 누를 때)
const validateAttendee = (attendee: AttendeeInput): AttendeeErrors => {
  const newErrors: AttendeeErrors = {};
  if (!attendee.name.trim()) newErrors.name = ERROR_MESSAGES.attendee.name;
  if (!PHONE_REGEX.test(attendee.phone)) newErrors.phone = ERROR_MESSAGES.attendee.phone;
  return newErrors;
};
```

컴포넌트 안 state:

```tsx
  const [attendee, setAttendee] = useState<AttendeeInput>(EMPTY_ATTENDEE);
  const [attendeeErrors, setAttendeeErrors] = useState<AttendeeErrors>({});

  // 참석자 행 번호 - 화면 목록의 key로 쓴다 (react-hook-form의 useFieldArray는 자동으로 붙여준다)
  const nextAttendeeId = useRef(1);
```

핸들러:

```tsx
  const handleClickAddAttendee = () => {
    const newAttendeeErrors = validateAttendee(attendee);
    if (Object.keys(newAttendeeErrors).length > 0) {
      setAttendeeErrors(newAttendeeErrors);
      return;
    }

    const newAttendee: Attendee = {
      id: nextAttendeeId.current++,
      name: attendee.name.trim(),
      phone: attendee.phone,
    };
    setReservationInfo((prev) => ({ ...prev, attendees: [...prev.attendees, newAttendee] }));
    setAttendee(EMPTY_ATTENDEE);
    setAttendeeErrors({});
    clearError('attendees');
  };

  const handleDeleteAttendee = (id: number) => {
    setReservationInfo((prev) => ({ ...prev, attendees: prev.attendees.filter((v) => v.id !== id) }));
  };
```

JSX:

```tsx
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <TextField
            label="이름"
            size="small"
            fullWidth
            value={attendee.name}
            onChange={(e) => setAttendee((prev) => ({ ...prev, name: e.target.value }))}
            error={!!attendeeErrors.name}
            helperText={attendeeErrors.name}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="연락처"
            size="small"
            fullWidth
            placeholder="010-1234-5678"
            value={attendee.phone}
            onChange={(e) => setAttendee((prev) => ({ ...prev, phone: e.target.value }))}
            error={!!attendeeErrors.phone}
            helperText={attendeeErrors.phone}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <IconButton color="primary" aria-label="참석자 추가" onClick={handleClickAddAttendee}>
            <Icon icon="mingcute:add-line" />
          </IconButton>
        </Stack>

        <Box sx={{ mt: 1 }}>
          {reservationInfo.attendees.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', height: 32 }}>
              <IconButton
                color="primary"
                size="small"
                aria-label={`${item.name} 삭제`}
                sx={{ p: 0, mr: 1 }}
                onClick={() => handleDeleteAttendee(item.id)}
              >
                <Icon icon="mingcute:close-circle-line" />
              </IconButton>
              <span>{item.name} ({item.phone})</span>
            </Box>
          ))}
          {errors.attendees && (
            <Typography variant="caption" color="error">{errors.attendees}</Typography>
          )}
        </Box>
      </Box>
```

- 추가 칸(이름·연락처)은 "보낼 값"이 아니라 입력 중인 값이라 `reservationInfo` 밖에 따로 둔다.
- 원본은 id를 `new Date().getTime()`으로 만들었다. 같은 밀리초에 두 번 추가하면 겹칠 수 있어서 `useRef` 카운터로 바꿨다.
- `@iconify/react`는 아이콘 데이터를 처음 쓸 때 인터넷(iconify 서버)에서 받아온다. 오프라인이면 버튼이 비어 보일 수 있다.
- 확인: `'   '` + `02-123-4567` → 두 칸 모두 에러, 추가 안 됨. `' 홍길동 '` + `01012345678` → `홍길동`으로 추가되고 입력칸이 비워짐.

### 5단계. 요청사항 / 담당자

핸들러:

```tsx
  const handleChangeMemo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReservationInfo((prev) => ({ ...prev, memo: e.target.value }));
  };

  const handleChangeManager = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({ ...prev, managerId: e.target.value }));
    clearError('managerId');
  };
```

JSX:

```tsx
      <TextField
        label="요청사항 (선택)"
        size="small"
        multiline
        minRows={2}
        value={reservationInfo.memo}
        onChange={handleChangeMemo}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      {/* 관리자만 보이는 칸: 검사도 isAdmin일 때만 한다 */}
      {isAdmin && (
        <FormControl size="small" error={!!errors.managerId} required>
          <InputLabel id="state-manager-label">담당자</InputLabel>
          <Select
            labelId="state-manager-label"
            label="담당자"
            value={reservationInfo.managerId}
            onChange={handleChangeManager}
          >
            <MenuItem value={0} divider><em>선택안함</em></MenuItem>
            {MANAGER_LIST.map((option) => (
              <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.managerId}</FormHelperText>
        </FormControl>
      )}
```

### 6단계. 검사 + 제출

컴포넌트 **밖**(`validateAttendee` 아래)에 추가:

```tsx
// 2번 검증 규칙 표를 if문으로 옮긴다
const validate = (info: ReservationInfo, isAdmin: boolean): ReservationErrors => {
  const newErrors: ReservationErrors = {};

  if (!info.regionId) newErrors.regionId = ERROR_MESSAGES.regionId;
  if (!info.branchId) newErrors.branchId = ERROR_MESSAGES.branchId;
  if (!info.reservedAt) newErrors.reservedAt = ERROR_MESSAGES.reservedAt;

  // 인원 수: 빈 칸 → 소수 → 1 미만 순서로 본다
  const headCount = Number(info.headCount);
  if (info.headCount === '') newErrors.headCount = ERROR_MESSAGES.headCount.empty;
  else if (!Number.isInteger(headCount)) newErrors.headCount = ERROR_MESSAGES.headCount.notInt;
  else if (headCount < 1) newErrors.headCount = ERROR_MESSAGES.headCount.min;

  if (info.attendees.length < 1) newErrors.attendees = ERROR_MESSAGES.attendees;
  if (isAdmin && !info.managerId) newErrors.managerId = ERROR_MESSAGES.managerId;

  return newErrors;
};

// 화면용 값 → 보낼 값: 인원 수는 숫자로, 참석자의 화면용 id는 뺀다
const toSubmitValue = (info: ReservationInfo) => ({
  ...info,
  headCount: Number(info.headCount),
  attendees: info.attendees.map(({ name, phone }) => ({ name, phone })),
});

type SubmitValue = ReturnType<typeof toSubmitValue>;
```

컴포넌트 안 state:

```tsx
  const [submitted, setSubmitted] = useState<SubmitValue | null>(null);
```

핸들러:

```tsx
  const handleClickSubmit = () => {
    const newErrors = validate(reservationInfo, isAdmin);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSubmitted(null);
      return;
    }
    setSubmitted(toSubmitValue(reservationInfo));
  };
```

JSX(맨 아래):

```tsx
      {/* <form>이 없으므로 submit이 아니라 onClick */}
      <Button variant="contained" onClick={handleClickSubmit}>예약하기</Button>
```

- `toSubmitValue`는 ③④편(zod)과 **같은 모양**의 값을 보내기 위한 변환이다. (인원 수 숫자, 참석자 id 제거)
- 확인: 빈 상태로 제출하면 에러 5개(관리자면 6개). 인원 수 `1.5` → "정수로", `0` → "1명 이상", `3` → 통과.

### 7단계. 디버그 출력 — `src/sections/form-compare/form-debug-panel.tsx` (새 파일)

```tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------
// 디버그 출력 - 현재 값 / 에러 / 제출된 값을 JSON으로 보여준다.
// 세 폼이 같이 쓴다. (③편에서 react-hook-form용 FormDebugPanel을 여기에 추가한다)
// ----------------------------------------------------------------------

type DebugJsonProps = {
  values: unknown;
  errors: unknown;
  submitted?: unknown;
};

const blockSx = {
  m: 0,
  p: 1,
  borderRadius: 1,
  bgcolor: 'grey.100',
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
} as const;

export function DebugJson({ values, errors, submitted }: DebugJsonProps) {
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography variant="subtitle2">values</Typography>
      <Box component="pre" sx={blockSx}>{JSON.stringify(values, null, 2)}</Box>

      <Typography variant="subtitle2" color="error">errors</Typography>
      <Box component="pre" sx={blockSx}>{JSON.stringify(errors, null, 2)}</Box>

      {!!submitted && (
        <>
          <Typography variant="subtitle2" color="primary">제출된 값 (검사 통과)</Typography>
          <Box component="pre" sx={blockSx}>{JSON.stringify(submitted, null, 2)}</Box>
        </>
      )}
    </Box>
  );
}
```

state-form.tsx JSX 맨 아래(예약하기 버튼 아래)에 추가:

```tsx
      <Divider sx={{ borderStyle: 'dashed' }} />
      <DebugJson values={reservationInfo} errors={errors} submitted={submitted} />
```

- 원본의 `bgcolor: 'background.neutral'`은 fwweb 템플릿에만 있는 색이라 MUI 기본 `grey.100`으로 바꿨다.

### 8단계. view 연결 — form-compare-view.tsx 수정

```tsx
// import 추가
import { StateForm } from "../state-form";

// handleOpen 교체 — 열 때마다 key를 바꿔서 폼을 새로 만든다 (닫힘 애니메이션 도중 다시 열어도 초기화되게)
const [openKey, setOpenKey] = useState(0)

const handleOpen = () => {
    setOpenKey((k) => k + 1);
    setOpen(true);
};

// 폼 3칸을 감싸는 Box에 key 추가
<Box key={openKey} sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>

// useState 칸의 제목을 폼으로 교체 (제목은 StateForm 안에 있다)
<StateForm isAdmin={isAdmin} />
```

- `key`가 바뀌면 React는 그 아래를 **새 컴포넌트로 다시 만든다.** Dialog의 unmount에만 기대면 닫힘 애니메이션(약 0.2초) 도중 다시 열 때 이전 값이 남는데, key가 그 경우까지 막는다.

---

### 완성본 (0~8단계를 다 합친 것)

<details>
<summary>src/sections/form-compare/state-form.tsx 전체</summary>

```tsx
'use client';

import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material/Select';

import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { DebugJson } from './form-debug-panel';
import {
  BRANCH_LIST,
  DISPLAY_FORMAT,
  ERROR_MESSAGES,
  MANAGER_LIST,
  PHONE_REGEX,
  REGION_LIST,
  RESULT_FORMAT,
} from './constants';

// ----------------------------------------------------------------------
// [②편] useState 버전 - react-hook-form, zod 없이 직접 만든다.
// - 모든 입력값을 객체 하나(reservationInfo)에 담고, 칸이 바뀔 때마다 그 칸만 바꾼다
// - 검사 규칙(validate)과 에러 state를 직접 만든다
// - 지역을 바꾸면 지점을 비우는 것처럼 "같이 바뀌어야 하는 값"도 핸들러에서 직접 챙긴다
// - 초기화 코드는 없다. Dialog는 닫힘 애니메이션이 끝나면 내용을 화면에서 없애고(unmount),
//   다시 열면 이 컴포넌트가 새로 만들어진다. (애니메이션 도중 다시 여는 경우는 view의 key가 막는다)
// ----------------------------------------------------------------------

// 폼 값 타입 - 스키마가 없으니 직접 쓴다
type Attendee = { id: number; name: string; phone: string };

type ReservationInfo = {
  regionId: number;
  branchId: number;
  reservedAt: string;
  // 입력칸의 글자를 그대로 저장한다. Number('')는 0이라서, 입력할 때 바로 Number()로 바꾸면
  // 빈 칸과 0을 구분할 수 없다. 숫자 변환은 제출할 때(toSubmitValue) 한다.
  headCount: string;
  attendees: Attendee[];
  memo: string;
  managerId: number;
};

type ReservationErrors = Partial<Record<keyof ReservationInfo, string>>;

type AttendeeInput = { name: string; phone: string };
type AttendeeErrors = Partial<Record<keyof AttendeeInput, string>>;

const EMPTY_RESERVATION: ReservationInfo = {
  regionId: 0,
  branchId: 0,
  reservedAt: '',
  headCount: '',
  attendees: [],
  memo: '',
  managerId: 0,
};

const EMPTY_ATTENDEE: AttendeeInput = { name: '', phone: '' };

// 2번 검증 규칙 표를 if문으로 옮긴다
const validate = (info: ReservationInfo, isAdmin: boolean): ReservationErrors => {
  const newErrors: ReservationErrors = {};

  if (!info.regionId) newErrors.regionId = ERROR_MESSAGES.regionId;
  if (!info.branchId) newErrors.branchId = ERROR_MESSAGES.branchId;
  if (!info.reservedAt) newErrors.reservedAt = ERROR_MESSAGES.reservedAt;

  // 인원 수: 빈 칸 → 소수 → 1 미만 순서로 본다
  const headCount = Number(info.headCount);
  if (info.headCount === '') newErrors.headCount = ERROR_MESSAGES.headCount.empty;
  else if (!Number.isInteger(headCount)) newErrors.headCount = ERROR_MESSAGES.headCount.notInt;
  else if (headCount < 1) newErrors.headCount = ERROR_MESSAGES.headCount.min;

  if (info.attendees.length < 1) newErrors.attendees = ERROR_MESSAGES.attendees;
  if (isAdmin && !info.managerId) newErrors.managerId = ERROR_MESSAGES.managerId;

  return newErrors;
};

// 참석자 한 명 검사 (추가 버튼을 누를 때)
const validateAttendee = (attendee: AttendeeInput): AttendeeErrors => {
  const newErrors: AttendeeErrors = {};
  if (!attendee.name.trim()) newErrors.name = ERROR_MESSAGES.attendee.name;
  if (!PHONE_REGEX.test(attendee.phone)) newErrors.phone = ERROR_MESSAGES.attendee.phone;
  return newErrors;
};

// 화면용 값 → 보낼 값: 인원 수는 숫자로, 참석자의 화면용 id는 뺀다
const toSubmitValue = (info: ReservationInfo) => ({
  ...info,
  headCount: Number(info.headCount),
  attendees: info.attendees.map(({ name, phone }) => ({ name, phone })),
});

type SubmitValue = ReturnType<typeof toSubmitValue>;

// ----------------------------------------------------------------------

type Props = {
  isAdmin: boolean;
};

export function StateForm({ isAdmin }: Props) {
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo>(EMPTY_RESERVATION);
  const [errors, setErrors] = useState<ReservationErrors>({});
  const [attendee, setAttendee] = useState<AttendeeInput>(EMPTY_ATTENDEE);
  const [attendeeErrors, setAttendeeErrors] = useState<AttendeeErrors>({});
  const [submitted, setSubmitted] = useState<SubmitValue | null>(null);

  // DateTimePicker가 보여줄 값. 저장용 문자열(reservedAt)과 따로 둔다.
  // 없는 날짜(2월 31일)를 입력하면 picker는 'Invalid Date'를 넘기는데, 이걸 그대로 돌려줘야
  // 입력칸이 사용자가 친 글자를 유지한다. (저장용 값만 넘기면 null이 되어 입력이 씹힌다)
  const [reservedAtInput, setReservedAtInput] = useState<Dayjs | null>(null);

  // 참석자 행 번호 - 화면 목록의 key로 쓴다 (react-hook-form의 useFieldArray는 자동으로 붙여준다)
  const nextAttendeeId = useRef(1);

  const branchList = BRANCH_LIST.filter((b) => b.regionId === reservationInfo.regionId);

  // 값이 바뀐 칸의 에러만 지운다. 다시 검사하지는 않고 다음 제출 때 본다.
  // (react-hook-form은 지우는 대신 그 칸을 바로 다시 검사한다 → ③편에서 비교)
  const clearError = (key: keyof ReservationInfo) => {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleChangeRegion = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({
      ...prev,
      regionId: e.target.value,
      branchId: 0, // 지역이 바뀌면 지점 초기화
    }));
    clearError('regionId');
  };

  const handleChangeBranch = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({ ...prev, branchId: e.target.value }));
    clearError('branchId');
  };

  const handleChangeReservedAt = (newValue: Dayjs | null) => {
    setReservedAtInput(newValue);
    setReservationInfo((prev) => ({
      ...prev,
      // 지웠거나(null) 없는 날짜(2월 31일)면 빈 값으로 둔다 → 검사에서 걸린다
      reservedAt: newValue?.isValid() ? newValue.format(RESULT_FORMAT) : '',
    }));
    clearError('reservedAt');
  };

  const handleChangeHeadCount = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReservationInfo((prev) => ({ ...prev, headCount: e.target.value }));
    clearError('headCount');
  };

  const handleChangeMemo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReservationInfo((prev) => ({ ...prev, memo: e.target.value }));
  };

  const handleChangeManager = (e: SelectChangeEvent<number>) => {
    setReservationInfo((prev) => ({ ...prev, managerId: e.target.value }));
    clearError('managerId');
  };

  const handleClickAddAttendee = () => {
    const newAttendeeErrors = validateAttendee(attendee);
    if (Object.keys(newAttendeeErrors).length > 0) {
      setAttendeeErrors(newAttendeeErrors);
      return;
    }

    const newAttendee: Attendee = {
      id: nextAttendeeId.current++,
      name: attendee.name.trim(),
      phone: attendee.phone,
    };
    setReservationInfo((prev) => ({ ...prev, attendees: [...prev.attendees, newAttendee] }));
    setAttendee(EMPTY_ATTENDEE);
    setAttendeeErrors({});
    clearError('attendees');
  };

  const handleDeleteAttendee = (id: number) => {
    setReservationInfo((prev) => ({ ...prev, attendees: prev.attendees.filter((v) => v.id !== id) }));
  };

  const handleClickSubmit = () => {
    const newErrors = validate(reservationInfo, isAdmin);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSubmitted(null);
      return;
    }
    setSubmitted(toSubmitValue(reservationInfo));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">useState</Typography>

      {/* Select 라벨: InputLabel의 id와 Select의 labelId를 같게, label에는 같은 글자를 준다 */}
      <FormControl size="small" error={!!errors.regionId} required>
        <InputLabel id="state-region-label">지역</InputLabel>
        <Select
          labelId="state-region-label"
          label="지역"
          value={reservationInfo.regionId}
          onChange={handleChangeRegion}
        >
          {/* 구분선은 <Divider />가 아니라 divider prop으로 (Select 안의 Divider는 빈 선택지로 읽힌다) */}
          <MenuItem value={0} divider><em>선택안함</em></MenuItem>
          {REGION_LIST.map((option) => (
            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>{errors.regionId}</FormHelperText>
      </FormControl>

      <FormControl size="small" error={!!errors.branchId} required disabled={!reservationInfo.regionId}>
        <InputLabel id="state-branch-label">지점</InputLabel>
        <Select
          labelId="state-branch-label"
          label="지점"
          value={reservationInfo.branchId}
          onChange={handleChangeBranch}
        >
          <MenuItem value={0} divider><em>선택안함</em></MenuItem>
          {branchList.map((option) => (
            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>{errors.branchId}</FormHelperText>
      </FormControl>

      {/* 화면에는 picker가 준 값(reservedAtInput)을, 저장은 문자열(reservedAt)로 따로 한다 */}
      <DateTimePicker
        label="예약일시"
        format={DISPLAY_FORMAT}
        value={reservedAtInput}
        onChange={handleChangeReservedAt}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            required: true,
            error: !!errors.reservedAt,
            helperText: errors.reservedAt,
            // MUI v9: InputLabelProps → slotProps.inputLabel
            slotProps: { inputLabel: { shrink: true } },
          },
        }}
      />

      <TextField
        type="number"
        label="인원 수"
        size="small"
        required
        value={reservationInfo.headCount}
        onChange={handleChangeHeadCount}
        error={!!errors.headCount}
        helperText={errors.headCount}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <TextField
            label="이름"
            size="small"
            fullWidth
            value={attendee.name}
            onChange={(e) => setAttendee((prev) => ({ ...prev, name: e.target.value }))}
            error={!!attendeeErrors.name}
            helperText={attendeeErrors.name}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="연락처"
            size="small"
            fullWidth
            placeholder="010-1234-5678"
            value={attendee.phone}
            onChange={(e) => setAttendee((prev) => ({ ...prev, phone: e.target.value }))}
            error={!!attendeeErrors.phone}
            helperText={attendeeErrors.phone}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <IconButton color="primary" aria-label="참석자 추가" onClick={handleClickAddAttendee}>
            <Icon icon="mingcute:add-line" />
          </IconButton>
        </Stack>

        <Box sx={{ mt: 1 }}>
          {reservationInfo.attendees.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', height: 32 }}>
              <IconButton
                color="primary"
                size="small"
                aria-label={`${item.name} 삭제`}
                sx={{ p: 0, mr: 1 }}
                onClick={() => handleDeleteAttendee(item.id)}
              >
                <Icon icon="mingcute:close-circle-line" />
              </IconButton>
              <span>{item.name} ({item.phone})</span>
            </Box>
          ))}
          {errors.attendees && (
            <Typography variant="caption" color="error">{errors.attendees}</Typography>
          )}
        </Box>
      </Box>

      <TextField
        label="요청사항 (선택)"
        size="small"
        multiline
        minRows={2}
        value={reservationInfo.memo}
        onChange={handleChangeMemo}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      {/* 관리자만 보이는 칸: 검사도 isAdmin일 때만 한다 */}
      {isAdmin && (
        <FormControl size="small" error={!!errors.managerId} required>
          <InputLabel id="state-manager-label">담당자</InputLabel>
          <Select
            labelId="state-manager-label"
            label="담당자"
            value={reservationInfo.managerId}
            onChange={handleChangeManager}
          >
            <MenuItem value={0} divider><em>선택안함</em></MenuItem>
            {MANAGER_LIST.map((option) => (
              <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.managerId}</FormHelperText>
        </FormControl>
      )}

      {/* <form>이 없으므로 submit이 아니라 onClick */}
      <Button variant="contained" onClick={handleClickSubmit}>예약하기</Button>

      <Divider sx={{ borderStyle: 'dashed' }} />
      <DebugJson values={reservationInfo} errors={errors} submitted={submitted} />
    </Stack>
  );
}
```

</details>

이 완성본은 임시 복사본에서 타입 체크·lint·build를 통과했고, 아래 5번 확인 항목을 브라우저(production·dev 모드)에서 모두 확인했다.

### 원본 대비 바뀐 점

| 바뀐 곳 | 원본 | 지금 | 이유 |
|---|---|---|---|
| state 업데이트 | `{...reservationInfo, ...}` | `(prev) => ({...prev, ...})` | 오래된 값을 덮어쓰는 버그 방지 |
| `useCallback` | 핸들러마다, 의존성 배열 포함 | 없음 | 자식에 넘기지 않아서 이득이 없음 |
| 인원 수 저장 | `Number(e.target.value)` | 글자 그대로 | 빈 칸과 0을 구분 (규칙 표) |
| 정수 검사 | 없음 | `Number.isInteger` | 규칙 표 |
| 날짜 화면 값 | 저장용 문자열을 dayjs로 다시 변환 | `reservedAtInput` 따로 | 2월 31일 입력이 씹히는 문제 |
| 초기화 | `useEffect(open)`로 state 5개 수동 초기화 | 없음 + view의 `key` | Dialog unmount + 빠르게 다시 열기 대비 |
| Select 라벨 | `shrink` + `notched` + `OutlinedInput` | `labelId` + `label` | 더 짧고 스크린리더 지원 |
| 구분선 | `<Divider />` | `MenuItem divider` | Divider가 빈 선택지로 읽힘 |
| Select 값 | `String()` ↔ `Number()` 변환 | 숫자 그대로 | MUI Select는 숫자 값을 그대로 받음 |
| 참석자 id | `new Date().getTime()` | `useRef` 카운터 | 같은 밀리초에 겹칠 위험 없음 |
| 제출 값 | 화면용 값 그대로 | `toSubmitValue`로 변환 | ③④편과 같은 모양으로 비교 |
| 메시지·정규식 | 파일 안에 직접 | `ERROR_MESSAGES`, `PHONE_REGEX` | 2번 공통 데이터 |
| MUI v9 | `InputLabelProps` | `slotProps.inputLabel` | v9에서 삭제됨 |

---

## 5. 확인

`npm run dev` → http://localhost:3000

| 확인할 것 | 기대 결과 |
|---|---|
| 관리자 모드 켜고 빈 상태로 제출 | 에러 6개, 인원 수는 "인원 수를 입력하세요" |
| 인원 수 `1.5` / `0` / `3` | 정수로 / 1명 이상 / 통과 |
| 참석자: 공백 이름 + `02-123-4567` | 두 칸 모두 에러, 추가 안 됨 |
| 참석자: ` 홍길동 ` + `01012345678` | `홍길동`으로 추가, 입력칸 비워짐 |
| 지역 고르기 전 | 지점 칸 비활성 |
| 서울 → 강남점 → 부산으로 변경 | 지점이 "선택안함"으로, 목록은 해운대·서면 |
| 날짜 `2026/02/31 18:00` 입력 | 끝까지 입력됨, values의 reservedAt은 `''` |
| 날짜 `2026/02/28 18:00` | `2026-02-28T18:00:00` |
| 다 채우고 제출 | 제출된 값: 인원 수는 숫자, 참석자는 id 없이 |
| 닫았다 다시 열기 | 값·에러·제출 결과 모두 초기화 |
| 관리자 끄고 제출 | 담당자 칸 없음, 에러 5개 |
| 참석자 삭제 | 해당 행만 사라짐 |
| 콘솔 | 에러·경고 없음 |

---

## 6. 이 방식의 불편한 점 (초안 — ⑤편 비교 재료)

- **칸마다 핸들러를 직접 만든다.** 7개 핸들러 + 각 핸들러에서 `clearError` 호출.
- **검사 규칙(validate)과 에러 state를 직접 만든다.** 칸마다 `error={!!errors.x}`, `helperText={errors.x}`도 직접 연결.
- **폼 값 타입을 직접 쓴다.** 스키마가 없어서 `ReservationInfo`, `Attendee`, 에러 타입을 손으로 정의.
- **화면용 값과 보낼 값이 다르다.** 인원 수는 글자로 저장했다가 제출할 때 숫자로, 참석자 id는 제출할 때 제거 → `toSubmitValue` 변환이 필요.
- **날짜는 화면용 state를 따로 둔다.** 저장용 문자열만으로는 picker가 제대로 동작하지 않음.
- **참석자 목록의 id를 직접 관리한다.** (react-hook-form의 useFieldArray는 자동)
- **에러는 제출할 때만 다시 검사한다.** 칸을 고치면 에러가 지워질 뿐, 새 값이 맞는지는 다음 제출 때 안다.
- **초기화 누락 위험:** 이 구조에서는 Dialog unmount + key 덕분에 문제없다. 하지만 폼이 Dialog 밖에 있거나 `keepMounted`를 쓰면 state 6개(값, 에러, 추가 칸 값, 추가 칸 에러, 제출 결과, 날짜 화면 값)를 하나도 빠짐없이 직접 초기화해야 한다.
