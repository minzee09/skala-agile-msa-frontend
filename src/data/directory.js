/**
 * 실제 계정이 있는 임직원 디렉터리.
 *
 * user-service 의 User 에는 부서·직무가 없고 사용자 목록 API도 없어, userId → 부서·직무 매핑을
 * 프론트에서 든다. userId 는 백엔드 users.id 와 같은 값이며 seed 스크립트가 그렇게 맞춘다.
 * 전사 1,248명 명부는 population.js 가 이 사람들을 각 직무 앞자리에 두고 만든다.
 */
export const JOBS = {
  HR: '인사',
  FIN: '재무',
  SALES_ADMIN: '영업관리',
  IT_OPS: 'IT운영',
  CS: '고객지원',
  RND: '연구개발',
  MFG: '생산',
}

export const DEPARTMENTS = {
  HR: '인사팀',
  FIN: '재무팀',
  SALES_ADMIN: '영업관리팀',
  IT_OPS: 'IT운영팀',
  CS: '고객지원팀',
  RND: '연구소',
  MFG: '생산1팀',
}

/** 개인정보를 업무상 처리하는 직무 — AI 해석의 기본 매핑 */
export const PRIVACY_HANDLING_JOBS = ['HR', 'FIN', 'SALES_ADMIN', 'IT_OPS', 'CS']

export const DIRECTORY = [
  // HR 담당자 — 운영자 계정
  {
    userId: 101,
    email: 'hr.admin@sk.com',
    employeeNo: 'P0007',
    name: 'HR 관리자',
    dept: 'HR',
    job: 'HR',
    role: 'INSTRUCTOR',
  },
  // 임직원
  {
    userId: 102,
    email: 'minji.kim@sk.com',
    employeeNo: 'P0518',
    name: '김민지',
    dept: 'SALES_ADMIN',
    job: 'SALES_ADMIN',
  },
  {
    userId: 103,
    email: 'jiyoung.kim@sk.com',
    employeeNo: 'P0141',
    name: '김지영',
    dept: 'CS',
    job: 'CS',
  },
  {
    userId: 104,
    email: 'jisung.kim@sk.com',
    employeeNo: 'P0387',
    name: '김지성',
    dept: 'IT_OPS',
    job: 'IT_OPS',
  },
  {
    userId: 105,
    email: 'kihyun.lee@sk.com',
    employeeNo: 'P0212',
    name: '이기현',
    dept: 'FIN',
    job: 'FIN',
  },
  {
    userId: 106,
    email: 'haesu.cho@sk.com',
    employeeNo: 'P0455',
    name: '조해수',
    dept: 'CS',
    job: 'CS',
  },
  {
    userId: 107,
    email: 'inhee.lee@sk.com',
    employeeNo: 'P0091',
    name: '이인희',
    dept: 'HR',
    job: 'HR',
  },
]

export const findEmployee = (userId) => DIRECTORY.find((e) => e.userId === Number(userId))
export const jobLabel = (job) => JOBS[job] ?? job
export const deptLabel = (dept) => DEPARTMENTS[dept] ?? dept
