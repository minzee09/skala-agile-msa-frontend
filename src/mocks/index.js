/**
 * 백엔드 없이 시연할 때 쓰는 목 데이터. 숫자는 디자인 캔버스와 같은 세트로 맞춘다.
 * VITE_USE_MOCK=true 일 때만 스토어가 이 파일을 읽는다.
 */
import { encodeMeta } from '@/utils/courseMeta'

export const TODAY = '2026-09-02'

const course = (
  id,
  typeKey,
  title,
  law,
  cycle,
  minutes,
  deadline,
  targetRule,
  targetJobs,
  category,
) => ({
  id,
  title,
  category,
  price: 0,
  enrollmentCount: 0,
  status: 'ACTIVE',
  description: encodeMeta({
    typeKey,
    law,
    cycle,
    minutes,
    deadline,
    targetRule,
    targetJobs,
    required: true,
  }),
})

export const mockCourses = [
  course(
    1,
    'SAFETY',
    '산업안전보건교육',
    '산업안전보건법 제29조',
    '연 1회 이상',
    120,
    '2026-10-31',
    '전 근로자',
    [],
    'OTHER',
  ),
  course(
    2,
    'HARASSMENT',
    '직장 내 성희롱 예방교육',
    '남녀고용평등법 제13조',
    '연 1회 이상',
    60,
    '2026-11-30',
    '전 임직원',
    [],
    'OTHER',
  ),
  course(
    3,
    'DISABILITY',
    '직장 내 장애인 인식개선교육',
    '장애인고용촉진법 제5조의2',
    '연 1회 이상',
    60,
    '2026-11-30',
    '전 임직원',
    [],
    'OTHER',
  ),
  course(
    4,
    'PRIVACY',
    '개인정보보호 및 정보보안 교육',
    '개인정보보호법 제28조',
    '연 1회 이상',
    60,
    '2026-09-14',
    '업무상 개인정보를 처리하는 모든 자',
    ['HR', 'FIN', 'SALES_ADMIN', 'IT_OPS', 'CS'],
    'SECURITY',
  ),
  course(
    5,
    'PENSION',
    '퇴직연금교육',
    '근로자퇴직급여보장법 제32조',
    '연 1회 이상',
    40,
    '2026-12-31',
    '퇴직연금제도 가입 근로자',
    [],
    'OTHER',
  ),
]

/** 김민지(userId 102)의 수강 이력 — ACTIVE 는 이수 완료로 본다(시연 규칙). */
export const mockMyEnrollments = [
  { id: 101, userId: 102, courseId: 1, status: 'ACTIVE', createdAt: '2026-03-14T10:00:00' },
  { id: 102, userId: 102, courseId: 2, status: 'ACTIVE', createdAt: '2026-05-20T10:00:00' },
  { id: 103, userId: 102, courseId: 3, status: 'ACTIVE', createdAt: '2026-06-11T10:00:00' },
]

/*
 * 전사 집계와 AI 선별 결과는 더 이상 고정값을 쓰지 않는다.
 * src/data/population.js 의 인원 명부에서 조건마다 계산한다.
 */
