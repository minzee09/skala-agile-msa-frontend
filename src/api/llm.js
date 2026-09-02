import OpenAI from 'openai'
import { JOBS, PRIVACY_HANDLING_JOBS } from '@/data/directory'
import { LEGAL_COURSE_TYPES } from '@/data/legalCourses'

/**
 * AI 어댑터 — HR 전용 3곳(대상자 해석 · 맞춤 안내 문안 · 과정 자동 채움).
 *
 * 시연 단계에서는 브라우저에서 OpenAI API 를 직접 호출한다(백엔드 무수정).
 * 키가 없으면 규칙 기반 폴백으로 동작하므로 데모는 항상 진행된다.
 * ⚠ 브라우저 노출 키는 시연 한정 — Sprint2에서 recommend-service 로 이관 예정.
 */
const apiKey = import.meta.env.VITE_OPENAI_API_KEY
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

const client = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null

export const isLlmEnabled = () => Boolean(client)

async function askJson(system, user) {
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${system}\n\n반드시 JSON 객체 하나만 출력한다.` },
      { role: 'user', content: user },
    ],
  })
  return JSON.parse(res.choices[0]?.message?.content ?? '{}')
}

const jobList = () =>
  Object.entries(JOBS)
    .map(([code, label]) => `${code}=${label}`)
    .join(', ')
const typeKeys = () => LEGAL_COURSE_TYPES.map((t) => `"${t.key}"`).join('|')

/* ── 1. 대상자 조건 해석 ───────────────────────────────────────────── */

export async function interpretTargetRule(text) {
  if (client) {
    return askJson(
      `너는 한국 법정의무교육 담당 HR 어시스턴트다. 자연어 조건을 조회 조건으로 변환한다.
직무 코드: ${jobList()}.
직무 선택 규칙: "업무상 ○○를 처리하는 자"처럼 업무를 한정하는 문구면 그 업무를 실제로 수행하는 직무만 고른다.
개인정보를 업무상 처리하는 직무는 ${PRIVACY_HANDLING_JOBS.join(', ')} 이며 연구개발(RND)·생산(MFG)은 포함하지 않는다.
"전 임직원"·"전 근로자"처럼 한정이 없을 때만 전체 직무를 고른다.
결과 형태(resultType): 부서·조직 단위 순위나 비교를 물으면 "DEPT_RANKING", 그 밖에는 사람 명단이므로 "PEOPLE".
마감 임박을 물으면 deadlineWithinDays 에 일수를(예: "2주 이내" -> 14), 입사 연도를 한정하면 hireYear 에 연도를, "하위 N곳"이면 limit 에 N 을 넣는다. 해당 없으면 null.
출력 스키마: {"jobs": string[] (직무 코드), "courseTypeKey": ${typeKeys()} | null, "status": "NOT_COMPLETED"|"IN_PROGRESS"|"COMPLETED"|null, "resultType": "PEOPLE"|"DEPT_RANKING", "deadlineWithinDays": number|null, "hireYear": number|null, "limit": number|null, "lawRef": string, "rationale": string(한 문장)}`,
      text,
    )
  }
  return interpretTargetRuleFallback(text)
}

function interpretTargetRuleFallback(text) {
  const t = text.replace(/\s/g, '')
  const privacy = /개인정보/.test(t)
  const all = /전(임직원|근로자|직원)|모든임직원/.test(t)
  const jobs = privacy ? PRIVACY_HANDLING_JOBS : all ? Object.keys(JOBS) : []
  const deptRanking = /부서별|조직별|팀별/.test(t) && /이수율|순위|하위|상위/.test(t)
  const weeks = t.match(/([0-9]+)주/)
  const days = t.match(/([0-9]+)일/)
  const limitMatch = t.match(/(?:하위|상위)([0-9]+)/)
  const hireYear = /올해입사|신규입사|입사자/.test(t) ? new Date().getFullYear() : null
  const type = LEGAL_COURSE_TYPES.find((c) =>
    t.includes(c.shortName.replace(/\s/g, '').slice(0, 4)),
  )
  return {
    jobs,
    courseTypeKey: type?.key ?? (privacy ? 'PRIVACY' : null),
    status: /진행중|수강중|이수중/.test(t)
      ? 'IN_PROGRESS'
      : /이수완료|수료완료|이수한/.test(t)
        ? 'COMPLETED'
        : /미이수|미수료|안받은|이수하지/.test(t)
          ? 'NOT_COMPLETED'
          : null,
    resultType: deptRanking ? 'DEPT_RANKING' : 'PEOPLE',
    deadlineWithinDays: /마감/.test(t)
      ? weeks
        ? Number(weeks[1]) * 7
        : days
          ? Number(days[1])
          : null
      : null,
    hireYear,
    limit: limitMatch ? Number(limitMatch[1]) : null,
    lawRef: type?.law ?? (privacy ? '개인정보보호법 제28조' : ''),
    rationale: deptRanking
      ? '부서별 이수율을 계산해 낮은 순으로 정렬했습니다.'
      : privacy
        ? '"업무상 개인정보를 처리하는 자"는 인사·재무·영업관리·IT운영·고객지원 직무로 해석했습니다.'
        : '조건에서 직무·과정·상태·기간을 추출했습니다.',
  }
}

/* ── 2. 수강 안내 문안 ─────────────────────────────────────────────── */

export async function draftNotice({
  course,
  group,
  tone = '정중',
  recipientCount = 0,
  dday = '',
  channels = [],
}) {
  const groupGuide =
    group === 'RENEWAL'
      ? '갱신 대상: 이전 이수일이 있지만 교육 주기에 따라 재이수가 필요한 사람이다. {최근이수일} 토큰을 사용해 이전 이수 사실과 갱신 이유를 설명한다.'
      : '신규 대상: 올해 이수 이력이 없는 사람이다. 과정의 대상 기준에 해당해 처음 안내받는 이유와 수강 방법을 설명한다.'
  if (client) {
    return askJson(
      `너는 회사 인사팀 명의로 임직원에게 법정의무교육 맞춤 안내 문안을 쓴다.
고정 템플릿처럼 쓰지 말고 대상 사유, 이수 이력, 남은 기간, 발송 채널을 반영한다.
${groupGuide}
톤은 반드시 "${tone}" 로 쓰고, 톤에 따라 제목과 본문이 눈에 띄게 달라야 한다.
정중 = 완결된 존댓말 문장체 / 간결 = 짧은 개조식 / 강조 = 마감과 과태료 위험을 앞세운 촉구조.
근거 법령을 한 번 인용하고, 마감·교육 시간·수강료(회사 부담)를 명시한다.
주어진 사실을 바꾸거나 없는 사실을 만들지 않는다. {이름}, {D-day} 치환 토큰을 그대로 남긴다.
출력 스키마: {"subject": string, "body": string(줄바꿈 \\n 포함, 6줄 이내)}`,
      JSON.stringify({
        course: course.title,
        law: course.law,
        targetRule: course.targetRule,
        cycle: course.cycle,
        minutes: course.minutes,
        deadline: course.deadline,
        group,
        recipientCount,
        dday,
        channels,
      }),
    )
  }
  return draftNoticeFallback({ course, group, tone, channels })
}

function draftNoticeFallback({ course, group, tone = '정중', channels = [] }) {
  const [, m, d] = (course.deadline ?? '').split('-')
  const due = `${Number(m)}월 ${Number(d)}일`
  const renewal = group === 'RENEWAL'
  const channelAction = channels.includes('사내 메신저')
    ? '메일 또는 사내 메신저의 수강신청 버튼에서 바로 시작할 수 있습니다.'
    : '아래 수강신청 버튼에서 바로 시작할 수 있습니다.'
  const reason = renewal
    ? `{최근이수일}에 이수한 기록이 있으나 ${course.cycle} 교육 주기에 따라 갱신이 필요합니다.`
    : `"${course.targetRule}" 대상 기준에 해당하며, 올해 이수 이력이 확인되지 않아 신규 대상으로 안내드립니다.`

  if (tone === '간결') {
    return {
      subject: `${renewal ? '[갱신]' : '[신규 대상]'} ${course.title} 이수 요청 (${due} 마감)`,
      body: `{이름}님
${reason}
· 근거 ${course.law}
· 소요 ${course.minutes}분 · 수강료 회사 부담
· 마감 ${course.deadline} {D-day}
${channelAction}`,
    }
  }

  if (tone === '강조') {
    return {
      subject: `[마감 {D-day}] ${course.title} 미이수 확인 — ${due}까지 반드시 이수`,
      body: `{이름}님, 인사팀입니다.
${course.title} 이수 기한이 {D-day} 남았습니다. ${reason}
${course.law}상 의무 교육으로, 대상자 한 명이라도 누락되면 사업장에 과태료가 부과될 수 있습니다.
소요 시간은 ${course.minutes}분이며 수강료는 전액 회사가 부담합니다.
${course.deadline}까지 이수해 주시기 바랍니다. ${channelAction}`,
    }
  }

  return {
    subject: `${renewal ? '[갱신 안내]' : '[신규 대상 안내]'} ${course.title} — ${due} 마감`,
    body: `{이름}님, 안녕하세요. 인사팀입니다.
${reason}
${course.law}에 따른 필수 교육으로 ${course.title}을 이수해 주시기 바랍니다.
과정 ${course.title} · ${course.minutes}분 · 수강료 회사 부담
이수 마감 ${course.deadline} {D-day}
${channelAction} 감사합니다.`,
  }
}

/* ── 3. 과정 등록 자동 채움 ─────────────────────────────────────────── */

export async function autofillCourse({ lawText, targetText }) {
  if (client) {
    return askJson(
      `HR 사용자가 입력한 자연어 요청이나 법령·공고문에서 법정의무교육 과정 정보를 추출한다.
title 은 "${new Date().getFullYear()}년 <교육 정식 명칭>" 형식으로 쓴다.
사용자가 대상 조건을 직접 입력했다면 targetRule에 그 표현을 최우선으로 보존한다. AI가 임의로 다른 조건으로 바꾸지 않는다.
targetJobs 규칙: "업무상 ○○를 처리하는 자"처럼 업무를 한정하는 문구면 그 업무를 실제로 수행하는 직무만 고른다.
개인정보를 업무상 처리하는 직무는 ${PRIVACY_HANDLING_JOBS.join(', ')} 이며 연구개발(RND)·생산(MFG)은 포함하지 않는다.
"전 임직원"·"전 근로자"처럼 한정이 없을 때만 전체 직무를 고른다.
targetEvidence는 HR 사용자가 직접 입력한 대상 조건을 짧게 그대로 인용한다. 법령 원문이 아니라 사용자 입력 근거다.
targetRationale은 해당 문구를 targetJobs로 변환한 이유를 2문장 이내로 설명한다. 포함하지 않은 직무의 판단 기준도 언급한다.
출력 스키마: {"typeKey": ${typeKeys()}, "title": string, "law": string, "cycle": string, "minutes": number, "targetRule": string, "targetJobs": string[] (직무 코드: ${jobList()}), "targetEvidence": string, "targetRationale": string}`,
      JSON.stringify({ lawText, targetText }),
    )
  }
  return autofillCourseFallback({ lawText, targetText })
}

function autofillCourseFallback({ lawText, targetText }) {
  const t = lawText.replace(/\s/g, '')
  const type =
    LEGAL_COURSE_TYPES.find((c) => t.includes(c.law.replace(/\s/g, ''))) ??
    LEGAL_COURSE_TYPES.find((c) => /개인정보/.test(t) && c.key === 'PRIVACY') ??
    LEGAL_COURSE_TYPES[0]
  const year = new Date().getFullYear()
  const allJobs = Object.keys(JOBS)
  const targetEvidence = targetText.trim()
  const allRequested = /전\s*(?:임직원|근로자)|모든\s*(?:임직원|근로자)/.test(targetEvidence)
  const scopedJobs = allRequested ? allJobs : (type.defaultTargetJobs ?? [])
  const targetRationale =
    scopedJobs.length && scopedJobs.length < allJobs.length
      ? `"${targetEvidence}" 문구가 업무 범위를 한정하므로 해당 업무를 수행하는 직무만 포함했습니다. 직접 관련이 없는 직무는 기본 대상에서 제외했으며 HR이 최종 조정할 수 있습니다.`
      : `"${targetEvidence}" 문구를 전 임직원 대상으로 해석해 모든 직무를 포함했습니다. HR이 조직별 예외 대상을 최종 확인할 수 있습니다.`
  return {
    typeKey: type.key,
    title: `${year}년 ${type.name}`,
    law: type.law,
    cycle: type.cycle,
    minutes: type.minutes,
    targetRule: targetEvidence,
    targetJobs: scopedJobs,
    targetEvidence,
    targetRationale,
  }
}
