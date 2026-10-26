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