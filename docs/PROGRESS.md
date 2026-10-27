# 진행 상황 / 이어서 작업하기

> 다른 컴퓨터(또는 새 Claude 세션)에서 이어갈 때 이 파일부터 읽는다.
> 마지막 정리: 2026-10-27

## 다른 컴퓨터에서 시작하기

```bash
git clone https://github.com/atzzuny-hub/form-compare.git
```
```bash
cd form-compare
```
```bash
npm install
```
```bash
npm run dev
```

http://localhost:3000 → "열기" 버튼 → 모달.

읽는 순서: 이 파일 → [01-setup.md](./01-setup.md) → [02-usestate.md](./02-usestate.md)

## 프로젝트 목적

블로그 시리즈 "폼 비교". 같은 식당 예약 모달을 세 가지 방식으로 만들어 비교하고, 기존(레거시) useState 모달을 zod 방식으로 고칠지 판단한다.

| 편 | 내용 | 상태 |
|---|---|---|
| ① | Next.js 16 + MUI v9 셋업 | ✅ 완료 (커밋 `b01366b`) |
| ② | 공통 데이터·검증 규칙 + useState로 만들기 | 🔄 진행 중 — 4번(state-form.tsx) 1단계 끝, 다음은 1-1단계(`ERROR_MESSAGES` 연결) |
| ③ | zod 스키마 + react-hook-form + MUI 기본 컴포넌트 | ⏳ |
| ④ | zod + Field.*로 줄여보기 (Field.* 직접 구현) | ⏳ |
| ⑤ | 세 방식 비교: 고칠까, 둘까? | ⏳ |

## 현재 상태 (2026-10-27)

### ② 진행 상황

| 섹션 | 상태 | 비고 |
|---|---|---|
| 1. 공통 데이터 | ✅ 코드 완료 | `types.ts`, `constants.ts` |
| 2. 검증 규칙 | ✅ 코드 완료 | `constants.ts`의 `ERROR_MESSAGES` |
| 3. 모달 화면 | ✅ 코드 완료 | `form-compare-view.tsx` (칸 순서: Field.* → RHF+MUI → useState). `isAdmin` 전달·`key`는 8단계 |
| 4. useState 폼 | 🔄 1단계 끝 | `state-form.tsx` — 지역·지점 Select + validate + 에러 표시 + 임시 "예약" 버튼. **다음: 1-1단계 `ERROR_MESSAGES` 꺼내 쓰기(아직 안 함)**. 진행 체크리스트와 "현재 파일에서 고쳐야 할 것"은 02-usestate.md 4번 맨 위 "현재 진행 위치", 단계별 코드(1-1단계 포함)는 그 아래 |
| 5. 확인 | ⏳ | 체크리스트는 02-usestate.md에 있음 |
| 6. 불편한 점 | 📝 초안 | 02-usestate.md 맨 아래 |

### git

- 브랜치 `main`, 원격 `origin` = github.com/atzzuny-hub/form-compare. 아래 커밋은 모두 origin/main에 push되어 있다.
  - `6a90937 wip: useState 폼 지역·지점 선택과 에러 표시`
  - `f92fd2c wip: ②편 공통 데이터·검증 규칙, 모달 화면, useState 폼 작성 중`
  - `b01366b chore: Next.js 16 + MUI v9 프로젝트 셋업`
- 코드 변경은 모두 커밋됨 (코드 기준 마지막 커밋 `6a90937`). `page.tsx`는 `import { Metadata }`(type 없이)로 커밋되어 있으니 남은 일에서 되돌린다.
### 남은 일

- [ ] **다음:** 1-1단계 `ERROR_MESSAGES` 연결 — import에 추가 + validate의 문자열 두 줄 교체 (02-usestate.md 4번 "1-1단계")
- [ ] 1단계 정리 — 지점 Select의 `labelId`/`id`/`label="Age"`/`sx`, id에 `state-` 접두사, `<div>` → `<Stack spacing={2}>`, 제목 `Typography`, `required`, 지점 `disabled` (02-usestate.md "현재 파일에서 고쳐야 할 것")
- [ ] `state-form.tsx` 2~8단계 — 지금 파일은 지역·지점만 있어서, 단계 코드를 옮길 때 그 칸의 타입·기본값·validate, import, `clearError`, `isAdmin` prop을 같이 챙긴다 (02-usestate.md "현재 진행 위치" 아래 목록). 6단계는 새로 만들지 말고 지금 있는 `validate`·`handleSubmit`을 고친다
- [ ] `form-debug-panel.tsx` 만들기 (7단계)
- [ ] view: `<StateForm isAdmin={isAdmin} />`, `key={openKey}` (8단계)
- [ ] `page.tsx`: `import type { Metadata }`로 되돌리기
- [ ] `theme.ts`: 주석의 긴 URL을 `https://mui.com/material-ui/customization/typography/#font-family`로 (문서와 맞추기)
- [ ] 5번 확인 체크리스트 통과
- [ ] ②편 커밋 (`feat: 공통 데이터·검증 규칙과 useState 폼`)
- [ ] (선택) DateTimePicker 팝업 12시간제 → `ampm={false}` 넣을지 결정 (넣으면 ③④편에도)

## 결정 사항과 이유

| 결정 | 이유 |
|---|---|
| Next.js 16 App Router | fwweb과 같은 구조(`src/app`, `src/sections`) → 나중에 옮기기 쉬움 |
| `app/` = 주소, `sections/` = 화면 | page.tsx(서버)는 useState 불가, `'use client'`면 metadata 불가. sections만 복사하면 fwweb으로 이동 |
| Cache Components 끔 | 켜면 DateTimePicker 내부 `new Date()`가 빌드를 막음 |
| `@hookform/resolvers@5` | 6.0.0은 npm 의존성 충돌(ERESOLVE) |
| `zod@4` 명시 | 안 쓰면 eslint-config-next의 zod 3.25가 재사용됨 |
| MUI 무료판만 | 이 예제의 DateTimePicker는 `@mui/x-date-pickers`(MIT)에 있음 |
| 아이콘 `@iconify/react` | fwweb의 `Iconify` 대체. 아이콘은 실행 중 인터넷에서 받아옴 |
| schema.ts는 ③편으로 | ②(useState)에서는 안 쓰므로, 쓰기 직전에 소개 |
| ②·③ 합침(시리즈 5편) | ②만 따로면 화면 결과가 없는 편이 됨 |
| `ERROR_MESSAGES` 공통화 | 사용자 선택. 세 폼이 같은 문구를 쓰도록 (Claude는 인라인을 추천했었음) |
| 모달은 3칸 유지 | 칸 순서는 사용자 view 기준 Field.* → RHF+MUI → useState |
| 폼에 `open`을 넘기지 않음 | Dialog가 닫히면 내용을 unmount → 다시 열면 자동 초기화 |
| view의 grid Box에 `key={openKey}` | 닫힘 애니메이션(약 0.2초) 도중 다시 열면 unmount 안 돼서 이전 값이 남는 것 방지 |
| Select는 `labelId` + `label` | 원본의 `shrink`+`notched`+`OutlinedInput`보다 짧고 스크린리더 지원. 값 0이어도 라벨 정상 |
| `MenuItem divider` | Select 안 `<Divider />`는 빈 `role="option"`으로 읽힘 |
| 인원 수는 문자열로 저장 | `Number('')`=0이라 빈 칸과 0 구분 불가 |
| 정수 검사 추가 | 원본도 1.5명을 통과시키던 구멍 |
| 날짜 화면값 `reservedAtInput` 따로 | 저장용 문자열에서 다시 만든 값을 넘기면 없는 날짜 입력 시 마지막 칸 입력이 씹힘 |
| `toSubmitValue` | ③④편과 같은 모양으로 제출값 비교 (인원 수 숫자, 참석자 id 제거) |
| state-form은 작게 시작해서 칸을 늘린다 | 사용자가 직접 쓰면서 글로 설명하기 위해. 02-usestate.md의 0~8단계 코드는 "완성 기준" |
| 에러 타입은 `Partial<Record<keyof ReservationInfo, string>>` | `ERROR_MESSAGES`의 값(as const 리터럴)이 `string` 칸에 그대로 들어가고, 키 오타는 TS가 잡는다. 다른 칸 문구를 넣는 실수까지 막으려면 `ERROR_MESSAGES`에서 조건부 타입으로 칸별 문구 타입을 뽑아야 해서 ②에서는 쓰지 않음 |
| 에러는 state에 담는다 (렌더링 중 `validate()` 호출 X) | 렌더링마다 검사하면 모달을 열자마자 에러가 뜬다. state에 담아야 "제출 후에만" 보여줄 수 있다 |

## 알게 된 함정 (버전별)

**MUI v9**
- `Box`/`Stack`/`Grid`/`Typography`의 스타일 prop(`mt`, `alignItems` 등) 삭제 → `sx`로.
- TextField의 `InputLabelProps`·`InputProps`·`inputProps` 삭제 → `slotProps.inputLabel` / `slotProps.input` / `slotProps.htmlInput`.
- Pickers v9: `slotProps.textField.InputLabelProps`는 조용히 무시됨 → `slotProps.textField.slotProps.inputLabel`.
- Next.js 16용 어댑터 경로: `@mui/material-nextjs/v16-appRouter`.

**zod v4**
- v3의 `invalid_type_error` / `required_error` 삭제 → `error`. v3 옵션을 쓰면 TS 빨간 줄, 무시하고 실행하면 영어 기본 메시지.
- `message`는 아직 동작하지만 deprecated → `error`.
- 타입에 넣은 `error`가 `.min()` 등 검사에도 대신 쓰이는 건 **zod 4.5.0부터**. 4.4 이하는 영어("Too small: ..."). → 어느 버전에서나 같게 하려면 검사에도 메시지를 적는다.
- `error.flatten()` deprecated → `zod.flattenError(error)`.
- `zod.iso.datetime({ local: true })`: `YYYY-MM-DDTHH:mm:ss`(초 생략 가능) 통과, `''`/`null`/`'Invalid Date'`/2월 31일 거부.

**DateTimePicker (x-date-pickers 9.16)**
- 지우면 `null`, 없는 날짜를 끝까지 입력하면 Invalid Date(dayjs)를 넘긴다.
- 원본 fwweb의 `RHFDateTimePicker`는 Invalid Date를 `format()`해서 문자열 `'Invalid Date'`를 폼에 넣는다 → `min(1)`을 통과하는 버그. ④편에서 Field.DateTimePicker를 만들 때 `newValue?.isValid()`로 거를 것.
- 팝업은 한국어 locale 때문에 12시간제(오전/오후), 입력칸은 `HH` 24시간 → 맞추려면 `ampm={false}`.

**MUI Dialog**
- 닫힘 애니메이션이 끝나야 unmount(`Modal.js` 190줄). 애니메이션 도중 다시 열면 상태 유지.

**MUI Select / FormControl**
- 값이 선택지에 없으면 dev 콘솔에 ``out-of-range value `0` `` 경고 → "선택안함"을 `<MenuItem value={0}>`으로 넣는다.
- 라벨은 `document.getElementById(labelId)`로 찾는다 → `InputLabel id` = `Select labelId`. 세 폼이 한 화면이라 id에 `state-` 같은 접두사를 붙인다.
- `FormControl error`를 주면 테두리·라벨·`FormHelperText`가 같이 빨개진다 (`FormHelperText`는 FormControl의 error를 물려받음).

**TypeScript**
- setState 콜백이 돌려주는 객체는 남는 키를 검사하지 않는다 → `marketId: 0` 같은 오타가 통과. `(prev): ReservationInfo => ({ ... })`로 반환 타입을 적으면 잡힌다.
- `useState<T>()`처럼 초기값을 빼면 타입이 `T | undefined`.
- 제네릭 없이 `useState({ attendees: [] })`면 `attendees`가 `never[]`로 추론된다 → `useState<ReservationInfo>(...)`.
- 값(`ERROR_MESSAGES`)은 타입 자리에 못 쓴다(TS2749) → 타입이 필요하면 `typeof ERROR_MESSAGES`.
- `as const`의 읽기전용은 타입 검사에서만 (실행 중 `Object.freeze`가 아님).

## ③편 준비 메모

- 원본 참고 코드: 이 컴퓨터의 `/Users/zzuny/wjtest-export/src/sections/wjtest/` (`reservation-mui-form.tsx`, `reservation-field-form.tsx`, `attendee-field-array.tsx`, `form-debug-panel.tsx`, `reservation-schema.ts`). **다른 컴퓨터에는 없다** — 필요하면 `/Users/zzuny/wjtest-export.zip`을 옮기거나 fwweb에서 찾을 것.
- 원본 스키마는 zod v3 문법(`invalid_type_error`)이라 그대로 옮기면 영어 메시지가 나온다 → 아래 초안 사용.
- `form-debug-panel.tsx`에 `FormDebugPanel`(useWatch + useFormState) 추가. RHF의 errors에는 `ref`(DOM 요소)가 들어 있으므로 원본의 `omitRef` replacer를 다시 넣어야 JSON 출력이 깨지지 않는다:
  `const omitRef = (key: string, value: unknown) => (key === 'ref' ? undefined : value);`
- 인원 수: `register('headCount', { valueAsNumber: true })`는 빈 칸을 `NaN`으로 바꾼다 → zod `number({ error })`에서 "인원 수를 입력하세요"로 구분됨.
- 예약일시: Controller로 연결할 때도 ②와 같은 "없는 날짜 입력이 씹힘" 문제가 생긴다 → 화면용 Dayjs 값을 따로 들고 있는 방법이 필요.
- 원본 RHF 폼의 `useEffect(open) reset(...)`도 Dialog unmount + key로 필요 없음.
- RHF `mode: 'all'` → 칸을 건드릴 때마다 검사 (useState는 제출 때만). ⑤편 비교 거리.

### ③편 schema.ts 초안 (ERROR_MESSAGES 버전)

메시지를 직접 적은 버전으로 zod 4.6.7 / 4.4.3 둘 다 검증했고(타입 체크·lint·build·브라우저), 아래 `ERROR_MESSAGES` 버전도 타입 체크·lint와 실행(아래 5가지 경우)까지 확인했다. 폼 화면에 연결하는 건 ③편에서.

```ts
import { z as zod } from 'zod';

import { ERROR_MESSAGES, PHONE_REGEX } from './constants';

// ----------------------------------------------------------------------
// 예약 폼 zod 스키마 (zod v4)
// Field.* 버전과 RHF + MUI 버전이 같은 스키마를 쓴다. useState 버전은 쓰지 않는다.
//
// v4 에러 메시지 규칙
// - v3의 invalid_type_error / required_error는 없어지고 error 하나로 합쳐졌다.
// - zod.number({ error })  : 타입이 틀렸을 때(undefined, null, NaN, 문자열) 메시지
// - .min(1, { error })      : 그 검사에 걸렸을 때 메시지
// - zod 4.5부터는 .min()에 메시지를 안 줘도 타입 메시지가 대신 쓰이지만,
//   4.4 이하에서는 영어("Too small: ...")가 나오므로 여기서는 둘 다 적는다.
// ----------------------------------------------------------------------

// 참석자 한 명 - 추가 버튼을 누를 때 이 스키마로 먼저 검사한다
export const AttendeeSchema = zod.object({
  name: zod.string().trim().min(1, { error: ERROR_MESSAGES.attendee.name }),
  phone: zod.string().regex(PHONE_REGEX, { error: ERROR_MESSAGES.attendee.phone }),
});

export type AttendeeSchemaType = zod.infer<typeof AttendeeSchema>;

// 관리자 여부에 따라 담당자 필수 여부가 달라지므로 함수로 만든다 (조건부 필수)
export const makeReservationSchema = (isAdmin: boolean) =>
  zod.object({
    regionId: zod.number({ error: ERROR_MESSAGES.regionId }).min(1, { error: ERROR_MESSAGES.regionId }),
    branchId: zod.number({ error: ERROR_MESSAGES.branchId }).min(1, { error: ERROR_MESSAGES.branchId }),
    // RESULT_FORMAT('YYYY-MM-DDTHH:mm:ss') 모양인지까지 검사한다.
    // 빈 값/null, 'Invalid Date' 문자열, 없는 날짜(2월 31일)도 막는다.
    reservedAt: zod.iso.datetime({ local: true, error: ERROR_MESSAGES.reservedAt }),
    headCount: zod
      .number({ error: ERROR_MESSAGES.headCount.empty })
      .int({ error: ERROR_MESSAGES.headCount.notInt })
      .min(1, { error: ERROR_MESSAGES.headCount.min }),
    // 추가 버튼과 같은 규칙을 쓰도록 AttendeeSchema를 재사용한다
    attendees: zod.array(AttendeeSchema).min(1, { error: ERROR_MESSAGES.attendees }),
    memo: zod.string().nullish(),
    managerId: isAdmin
      ? zod.number({ error: ERROR_MESSAGES.managerId }).min(1, { error: ERROR_MESSAGES.managerId })
      : zod.number().nullish(),
  });

export type ReservationSchemaType = zod.infer<ReturnType<typeof makeReservationSchema>>;

// 기본값 - 스키마에서 만든 타입(zod.infer)을 쓰기 때문에 constants.ts가 아니라 여기에 둔다
export const EMPTY_ATTENDEE: AttendeeSchemaType = { name: '', phone: '' };

export const defaultValues: ReservationSchemaType = {
  regionId: 0,
  branchId: 0,
  reservedAt: '',
  headCount: 0,
  attendees: [],
  memo: '',
  managerId: 0,
};
```

검증할 때 확인할 것: 빈 기본값(0, `''`) / 지운 값(`null`, `NaN`) / 잘못된 값(`'Invalid Date'`, `1.5`)에서 인원 수 메시지가 각각 "1명 이상" / "입력하세요" / "정수로"로 다르게 나오는지. `makeReservationSchema(false)`면 managerId 에러가 없어야 한다.

## 작업 방식 (Claude에게)

- 사용자가 **코드를 직접 작성**한다. Claude는 단계별로 설명하고 코드를 보여준다. 프로젝트 파일은 사용자가 요청할 때만 직접 수정한다.
- 설치 명령(`npm install` 등)은 사용자가 직접 실행한다. Claude는 명령어와 이유를 알려준다.
- 안내할 코드는 **임시 복사본에서 먼저 검증**(타입 체크·lint·build·브라우저)한 뒤 알려준다.
- 블로그 글로 쓰므로 설명은 한국어, "왜 그렇게 하는지"를 같이 적는다. 사용자가 정리한 문서를 붙여 주면 문서와 실제 코드가 맞는지 대조해서 피드백한다.
- 라이브러리 API는 최신 버전(MUI v9, x-date-pickers v9, zod v4, Next 16)이라 학습 데이터와 다를 수 있다 → 문서(context7)나 `node_modules`의 타입·소스로 확인한다. Next.js는 `node_modules/next/dist/docs/`에 버전별 문서가 있다.
