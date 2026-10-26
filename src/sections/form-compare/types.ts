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

