/**
 * 시연 데이터 시드 — 로컬 MSA 백엔드(도커)에 법정의무교육 데이터를 넣는다.
 *
 *   node scripts/seed-demo.mjs          # 계정·과정·수강 이력 생성 (있으면 갱신)
 *   node scripts/seed-demo.mjs --reset  # 이 스크립트가 만든 데이터(id ≥ 101)만 지우고 다시 생성
 *
 * 계정은 게이트웨이의 회원가입 API(토큰 불필요)로 만들어 비밀번호가 정상 해시되게 하고,
 * 과정·수강 이력은 X-User-Id 헤더(=JWT)가 필요하므로 DB 에 직접 넣는다. 백엔드 코드는 건드리지 않는다.
 */
import { execFileSync } from 'node:child_process'
import { DIRECTORY } from '../src/data/directory.js'
import { LEGAL_COURSE_TYPES } from '../src/data/legalCourses.js'

const GATEWAY = process.env.SEED_GATEWAY ?? 'http://localhost:8080'
const DB_CONTAINER = process.env.SEED_DB_CONTAINER ?? 'lecturedb'
const DB_USER = process.env.SEED_DB_USER ?? 'manager'
const DB_PASSWORD = process.env.SEED_DB_PASSWORD ?? 'SqlDba-1'
const DB_NAME = process.env.SEED_DB_NAME ?? 'lecture_db'
const PASSWORD = process.env.SEED_PASSWORD ?? 'SkDemo!2026'
const RESET = process.argv.includes('--reset')

const BASE_ID = 101
const INSTRUCTOR_ID = 101 // 박선영 (HR 담당자)
const PRIVACY_JOBS = ['HR', 'FIN', 'SALES_ADMIN', 'IT_OPS', 'CS']

/** 과정 5종 — 마감일은 시연 기준일(2026-09-02)에 맞춘 세트 */
const COURSES = [
  { typeKey: 'SAFETY', deadline: '2026-10-31' },
  { typeKey: 'HARASSMENT', deadline: '2026-11-30' },
  { typeKey: 'DISABILITY', deadline: '2026-11-30' },
  { typeKey: 'PRIVACY', deadline: '2026-09-14' },
  { typeKey: 'PENSION', deadline: '2026-12-31' },
].map((c, i) => {
  const type = LEGAL_COURSE_TYPES.find((t) => t.key === c.typeKey)
  const meta = {
    typeKey: type.key,
    law: type.law,
    cycle: type.cycle,
    minutes: type.minutes,
    deadline: c.deadline,
    targetRule: type.targetRule,
    targetJobs: type.key === 'PRIVACY' ? PRIVACY_JOBS : [],
    required: true,
  }
  return {
    id: BASE_ID + i,
    typeKey: type.key,
    title: type.name,
    category: type.category,
    description: '@legal:' + JSON.stringify(meta),
  }
})

const courseId = (typeKey) => COURSES.find((c) => c.typeKey === typeKey).id

/**
 * 수강 이력 — ACTIVE = 이수 완료, PENDING = 신청 후 진행 중 (백엔드에 COMPLETED 상태가 없음).
 * 김민지(102)는 3건 이수 · 개인정보보호 미이수 → 임직원 화면의 기본 시나리오.
 */
const ENROLLMENTS = [
  // 김민지(102) — 3건 이수, 개인정보보호 미이수, 퇴직연금 진행 중
  { userId: 102, type: 'SAFETY', status: 'ACTIVE', at: '2026-03-14 10:12:00' },
  { userId: 102, type: 'HARASSMENT', status: 'ACTIVE', at: '2026-05-20 14:31:00' },
  { userId: 102, type: 'DISABILITY', status: 'ACTIVE', at: '2026-06-11 09:48:00' },
  { userId: 102, type: 'PENSION', status: 'PENDING', at: '2026-08-28 11:02:00' },

  // 박선영(101) — HR 담당자, 전 과정 이수
  { userId: 101, type: 'SAFETY', status: 'ACTIVE', at: '2026-02-10 09:00:00' },
  { userId: 101, type: 'HARASSMENT', status: 'ACTIVE', at: '2026-02-10 10:30:00' },
  { userId: 101, type: 'DISABILITY', status: 'ACTIVE', at: '2026-02-11 09:20:00' },
  { userId: 101, type: 'PRIVACY', status: 'ACTIVE', at: '2026-08-20 13:00:00' },
  { userId: 101, type: 'PENSION', status: 'ACTIVE', at: '2026-03-05 15:00:00' },

  { userId: 103, type: 'SAFETY', status: 'ACTIVE', at: '2026-04-02 15:20:00' },
  { userId: 103, type: 'HARASSMENT', status: 'ACTIVE', at: '2026-04-02 16:05:00' },
  { userId: 104, type: 'SAFETY', status: 'ACTIVE', at: '2026-03-30 11:00:00' },
  { userId: 104, type: 'PRIVACY', status: 'PENDING', at: '2026-09-01 08:40:00' },
  { userId: 105, type: 'SAFETY', status: 'ACTIVE', at: '2026-05-06 13:15:00' },
  { userId: 105, type: 'DISABILITY', status: 'ACTIVE', at: '2026-06-18 10:10:00' },
  { userId: 106, type: 'SAFETY', status: 'ACTIVE', at: '2026-03-19 09:30:00' },
  { userId: 106, type: 'HARASSMENT', status: 'ACTIVE', at: '2026-05-22 14:00:00' },
  { userId: 107, type: 'SAFETY', status: 'ACTIVE', at: '2026-04-15 16:00:00' },
]

const q = (v) => (v === null || v === undefined ? 'NULL' : "'" + String(v).split("'").join("''") + "'")

const runSql = (statements) =>
  execFileSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'mariadb', '-u' + DB_USER, '-p' + DB_PASSWORD, DB_NAME],
    { input: statements.join('\n'), encoding: 'utf8' },
  )

async function registerAccounts() {
  let created = 0
  for (const e of DIRECTORY) {
    const res = await fetch(GATEWAY + '/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: e.email,
        password: PASSWORD,
        name: e.name,
        role: e.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
      }),
    })
    if (res.status === 201) created += 1
    else if (res.status >= 500) throw new Error('회원가입 실패 ' + e.email + ': ' + res.status)
  }
  return created
}

/** 회원가입으로 만들어진 계정 id 를 디렉터리 userId 에 맞춘다 */
function alignUserIds() {
  const updates = DIRECTORY.map(
    (e) =>
      'UPDATE users SET id = ' + e.userId + ' WHERE email = ' + q(e.email) + ' AND id <> ' + e.userId + ';',
  )
  runSql(['SET FOREIGN_KEY_CHECKS = 0;', ...updates, 'SET FOREIGN_KEY_CHECKS = 1;'])
}

function seedCourses() {
  const rows = COURSES.map(
    (c) =>
      '(' +
      [c.id, q(c.title), q(c.description), q(c.category), '0.00', INSTRUCTOR_ID, 0, "'ACTIVE'", 'NOW(6)', 'NOW(6)'].join(', ') +
      ')',
  )
  runSql([
    'INSERT INTO courses (id, title, description, category, price, instructor_id, enrollment_count, status, created_at, updated_at) VALUES',
    rows.join(',\n'),
    'ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), category = VALUES(category), price = VALUES(price), status = VALUES(status), updated_at = NOW(6);',
  ])
}

function seedEnrollments() {
  const rows = ENROLLMENTS.map(
    (e) => '(' + [e.userId, courseId(e.type), q(e.status), q(e.at), q(e.at)].join(', ') + ')',
  )
  const payments = ENROLLMENTS.filter((e) => e.status === 'ACTIVE').map(
    (e) =>
      '(' +
      [
        e.userId,
        courseId(e.type),
        '0.00',
        "'COMPLETED'",
        q('LT-' + e.userId + '-' + courseId(e.type)),
        q(e.at),
        q(e.at),
      ].join(', ') +
      ')',
  )
  runSql([
    'INSERT INTO enrollments (user_id, course_id, status, created_at, updated_at) VALUES',
    rows.join(',\n'),
    'ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW(6);',
    'INSERT INTO payments (user_id, course_id, amount, status, transaction_id, created_at, updated_at) VALUES',
    payments.join(',\n'),
    'ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW(6);',
    'UPDATE courses c SET enrollment_count = (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) WHERE c.id >= ' +
      BASE_ID +
      ';',
  ])
}

function reset() {
  runSql([
    'DELETE FROM payments WHERE course_id >= ' + BASE_ID + ';',
    'DELETE FROM enrollments WHERE course_id >= ' + BASE_ID + ';',
    'DELETE FROM courses WHERE id >= ' + BASE_ID + ';',
    'DELETE FROM users WHERE id >= ' + BASE_ID + ';',
  ])
}

const report = () =>
  runSql([
    "SELECT 'users' AS 구분, COUNT(*) AS 건수 FROM users WHERE id >= " + BASE_ID,
    "UNION ALL SELECT 'courses', COUNT(*) FROM courses WHERE id >= " + BASE_ID,
    "UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments WHERE course_id >= " + BASE_ID,
    "UNION ALL SELECT 'payments', COUNT(*) FROM payments WHERE course_id >= " + BASE_ID + ';',
  ])

if (RESET) {
  reset()
  console.log('· 기존 시연 데이터 삭제 (id >= ' + BASE_ID + ')')
}
const created = await registerAccounts()
console.log('· 계정 ' + created + '건 신규 생성 / 디렉터리 ' + DIRECTORY.length + '명')
alignUserIds()
seedCourses()
console.log('· 과정 ' + COURSES.length + '건')
seedEnrollments()
console.log('· 수강 이력 ' + ENROLLMENTS.length + '건')
console.log(report())
const hrAccount = DIRECTORY.find((e) => e.role === 'INSTRUCTOR')
const staffAccount = DIRECTORY.find((e) => e.role !== 'INSTRUCTOR')
console.log(
  '로그인 — HR: ' + hrAccount.email + ' / 임직원: ' + staffAccount.email + ' (비밀번호 ' + PASSWORD + ')',
)
