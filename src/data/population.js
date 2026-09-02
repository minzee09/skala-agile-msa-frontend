import { DIRECTORY } from './directory.js'

/**
 * 시연용 전사 인원 명부(1,248명)를 프론트에서 결정론적으로 만든다.
 *
 * 백엔드에는 부서·직무·입사일·과정별 이수 이력이 없다. 목 모드든 실서버 모드든
 * 이 명부가 "누가 대상인가"의 기준이며, 전사 현황·AI 선별·부서 순위를 모두 여기서 계산한다.
 *
 * 사람 단위 성격(전 과정 이수 / 일부 진행 / 미착수)을 먼저 정하고 과정별 비율을 그 안에서
 * 맞추기 때문에 화면 어디를 봐도 숫자가 서로 어긋나지 않는다.
 * 실제 백엔드 계정이 있는 사람은 각 직무 앞자리에 두어 명단에 이름으로 등장한다.
 */

export const HEADCOUNT = 1248

/** 직무별 인원 — 개인정보 취급 5개 직무 합계가 312명이 되도록 잡았다 */
const JOB_SIZE = {
  HR: 42,
  FIN: 58,
  SALES_ADMIN: 96,
  IT_OPS: 62,
  CS: 54,
  RND: 520,
  MFG: 416,
}

/** 임직원 단위 상태 목표 */
const PROFILE_TARGET = { ALL: 892, PARTIAL: 214, NONE: 142 }

/** 개인정보보호 교육(대상 312명)의 직무별 미이수·진행 중 인원 */
const PRIVACY_NOT_DONE = { SALES_ADMIN: 30, CS: 21, IT_OPS: 18, FIN: 11, HR: 8 }
const PRIVACY_IN_PROGRESS = { SALES_ADMIN: 18, CS: 10, IT_OPS: 11, FIN: 10, HR: 7 }

/** 개인정보 미이수 88명 중 미착수로 볼 인원 */
const PRIVACY_NOT_DONE_AS_NONE = 60
/** 개인정보 이수 168명 중 전 과정 이수로 볼 인원 */
const PRIVACY_DONE_AS_ALL = 130

/** 전 임직원 대상 과정의 이수/진행 비율(%) */
const COURSE_MIX = {
  SAFETY: { done: 76, inProgress: 12 },
  HARASSMENT: { done: 78, inProgress: 6 },
  DISABILITY: { done: 75, inProgress: 8 },
  PENSION: { done: 74, inProgress: 13 },
}

/**
 * 각 직무 앞자리에 둘 실제 계정 — 디렉터리에서 직접 만든다.
 * 디렉터리의 부서·직무를 바꿔도 명부가 따라오므로 두 곳이 어긋날 일이 없다.
 * HR 담당자(운영자)만 이수 완료 쪽인 뒷자리에 둔다.
 */
const groupBy = (people) => people.reduce((acc, e) => ((acc[e.job] ??= []).push(e.userId), acc), {})

const PINNED = groupBy(DIRECTORY.filter((e) => e.role !== 'INSTRUCTOR'))
const PINNED_LAST = groupBy(DIRECTORY.filter((e) => e.role === 'INSTRUCTOR'))

const SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민'
const GIVEN_1 = '민서지예현준우수윤도하은시주가나연재태승소유정찬영진호규희다'
const GIVEN_2 = '준우진서연아현호윤빈성찬영수민지원희은채담율솔건'

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260902)

const pad = (n, len) => String(n).padStart(len, '0')
const nameAt = (i) =>
  SURNAMES[i % SURNAMES.length] +
  GIVEN_1[(i * 7) % GIVEN_1.length] +
  GIVEN_2[(i * 13) % GIVEN_2.length]

/** 이미 만료된 이수일 — 기준일(2026-09-02)에서 1년이 지나도록 2025년 1~8월로 둔다 */
const lastYearDate = (i) => `2025-${pad(1 + (i % 8), 2)}-${pad(1 + ((i * 5) % 28), 2)}`
const thisYearDate = (i) => `2026-${pad(1 + (i % 8), 2)}-${pad(1 + ((i * 3) % 28), 2)}`

const PRIVACY_JOBS = Object.keys(PRIVACY_NOT_DONE)

function buildPopulation() {
  const people = []
  const byId = new Map(DIRECTORY.map((e) => [e.userId, e]))
  let serial = 1000

  for (const [job, size] of Object.entries(JOB_SIZE)) {
    const first = (PINNED[job] ?? []).map((id) => byId.get(id)).filter(Boolean)
    const last = (PINNED_LAST[job] ?? []).map((id) => byId.get(id)).filter(Boolean)
    const filler = size - first.length - last.length
    const group = [...first, ...Array.from({ length: filler }, () => null), ...last]

    group.forEach((known, seat) => {
      serial += 1
      const hireYear = 2008 + Math.floor(rand() * 19)
      people.push({
        userId: known?.userId ?? 1000 + serial,
        employeeNo: known?.employeeNo ?? `P${pad(serial, 4)}`,
        name: known?.name ?? nameAt(serial),
        dept: job,
        job,
        hireDate: `${hireYear}-${pad(1 + Math.floor(rand() * 12), 2)}-${pad(1 + Math.floor(rand() * 28), 2)}`,
        real: Boolean(known),
        seat,
        profile: null,
        trainings: {},
      })
    })
  }

  assignPrivacyAndProfiles(people)
  assignCompanyWide(people)
  return people
}

/**
 * 개인정보 취급 직무는 직무별 미이수·진행 인원을 먼저 확정하고,
 * 그 결과에 맞춰 사람 단위 성격을 배정한다.
 */
function assignPrivacyAndProfiles(people) {
  const notDone = []
  const inProgress = []
  const done = []

  for (const job of PRIVACY_JOBS) {
    const group = people.filter((p) => p.job === job).sort((a, b) => a.seat - b.seat)
    const nd = PRIVACY_NOT_DONE[job]
    const ip = PRIVACY_IN_PROGRESS[job]
    group.forEach((p, i) => {
      if (i < nd) {
        p.trainings.PRIVACY = { status: 'NOT_DONE', lastTraining: null }
        notDone.push(p)
      } else if (i < nd + ip) {
        p.trainings.PRIVACY = { status: 'IN_PROGRESS', lastTraining: null }
        inProgress.push(p)
      } else {
        p.trainings.PRIVACY = { status: 'DONE', lastTraining: thisYearDate(i) }
        done.push(p)
      }
    })
  }

  // 미이수자 일부는 '작년 이수 후 만료' 이력을 남긴다
  notDone.forEach((p, i) => {
    if (i % 5 === 1 || i % 5 === 3) p.trainings.PRIVACY.lastTraining = lastYearDate(i)
  })

  notDone.forEach((p, i) => (p.profile = i < PRIVACY_NOT_DONE_AS_NONE ? 'NONE' : 'PARTIAL'))
  inProgress.forEach((p) => (p.profile = 'PARTIAL'))
  done.forEach((p, i) => (p.profile = i < PRIVACY_DONE_AS_ALL ? 'ALL' : 'PARTIAL'))

  const used = { ALL: 0, PARTIAL: 0, NONE: 0 }
  for (const p of people) if (p.profile) used[p.profile] += 1

  const rest = people.filter((p) => !p.profile)
  const need = {
    NONE: PROFILE_TARGET.NONE - used.NONE,
    PARTIAL: PROFILE_TARGET.PARTIAL - used.PARTIAL,
  }
  // 부서가 몰리지 않도록 서로소인 보폭으로 흩어 배정한다
  rest.forEach((p, i) => {
    const slot = (i * 397) % rest.length
    if (slot < need.NONE) p.profile = 'NONE'
    else if (slot < need.NONE + need.PARTIAL) p.profile = 'PARTIAL'
    else p.profile = 'ALL'
  })
}

/**
 * 전 임직원 대상 4개 과정.
 * 미착수는 전부 미이수, 전 과정 이수는 전부 이수. 나머지 비율은 '일부 진행' 안에서 맞춘다.
 */
function assignCompanyWide(people) {
  const partial = people.filter((p) => p.profile === 'PARTIAL')
  const n = people.length

  for (const [key, mix] of Object.entries(COURSE_MIX)) {
    const doneTotal = Math.round((n * mix.done) / 100)
    const progressTotal = Math.round((n * mix.inProgress) / 100)
    const doneFromPartial = Math.max(0, doneTotal - PROFILE_TARGET.ALL)
    const offset = key.length * 53

    for (const p of people) {
      if (p.profile === 'NONE') p.trainings[key] = { status: 'NOT_DONE', lastTraining: null }
      else if (p.profile === 'ALL')
        p.trainings[key] = { status: 'DONE', lastTraining: thisYearDate(p.seat) }
    }

    // 부서 순서와 상관이 생기지 않도록 서로소인 보폭으로 흩는다
    partial.forEach((p, i) => {
      const slot = (i * 97 + offset) % partial.length
      p.trainings[key] =
        slot < doneFromPartial
          ? { status: 'DONE', lastTraining: thisYearDate(slot) }
          : slot < doneFromPartial + progressTotal
            ? { status: 'IN_PROGRESS', lastTraining: null }
            : { status: 'NOT_DONE', lastTraining: slot % 3 === 0 ? lastYearDate(slot) : null }
    })
  }
}

export const POPULATION = buildPopulation()

export const findPerson = (userId) => POPULATION.find((p) => p.userId === Number(userId))

/** 실제 계정이 있는 사람을 앞으로 — 시연 명단에 팀원 이름이 먼저 보이게 한다 */
export const realFirst = (list) => [...list].sort((a, b) => Number(b.real) - Number(a.real))

/** 과정 유형별 상태 집계 */
export function courseStats(typeKey, targetJobs = []) {
  const scope = targetJobs.length
    ? POPULATION.filter((p) => targetJobs.includes(p.job))
    : POPULATION
  let done = 0
  let inProgress = 0
  for (const p of scope) {
    const s = p.trainings[typeKey]?.status
    if (s === 'DONE') done += 1
    else if (s === 'IN_PROGRESS') inProgress += 1
  }
  return { targets: scope.length, done, inProgress, notDone: scope.length - done - inProgress }
}

/** 임직원 단위 상태 */
export function headcountStats() {
  const count = (profile) => POPULATION.filter((p) => p.profile === profile).length
  return {
    headcount: POPULATION.length,
    completedAll: count('ALL'),
    partial: count('PARTIAL'),
    notStarted: count('NONE'),
  }
}
