import {
  LEGAL_COURSE_TYPES,
  defaultDeadline,
  findCourseType,
  matchCourseType,
} from '@/data/legalCourses'

/**
 * course.description 에 실리는 법정교육 메타.
 * 백엔드 Course 는 title/description/category/price 만 가지므로 나머지는 여기 JSON 으로 담는다.
 */
const META_PREFIX = '@legal:'

export const encodeMeta = (meta) => `${META_PREFIX}${JSON.stringify(meta)}`

export const decodeMeta = (description) => {
  if (typeof description !== 'string' || !description.startsWith(META_PREFIX)) return null
  try {
    return JSON.parse(description.slice(META_PREFIX.length))
  } catch {
    return null
  }
}

/**
 * 백엔드 Course → 화면용 과정 객체.
 *
 * 법령·주기·이수시간·마감일·대상 조건은 백엔드 스키마에 없는 값이다.
 * 목 모드든 실서버 모드든 프론트의 기준 데이터(LEGAL_COURSE_TYPES)로 채우고,
 * 메타가 있으면 그 값을 우선한다. 백엔드가 메타 없이 만든 과정도 제목·법령으로 유형을 되찾는다.
 */
export const toLegalCourse = (course) => {
  const meta = decodeMeta(course.description) ?? {}
  const type =
    findCourseType(meta.typeKey) ??
    matchCourseType(course.title, meta.law) ??
    LEGAL_COURSE_TYPES.find((t) => t.category === course.category) ??
    null
  const year = new Date(course.createdAt ?? Date.now()).getFullYear()

  return {
    id: course.id,
    title: course.title,
    category: course.category ?? type?.category ?? 'OTHER',
    price: Number(course.price ?? 0),
    enrollmentCount: course.enrollmentCount ?? 0,
    typeKey: meta.typeKey ?? type?.key ?? null,
    law: meta.law ?? type?.law ?? '',
    cycle: meta.cycle ?? type?.cycle ?? '',
    minutes: meta.minutes ?? type?.minutes ?? 0,
    deadline: meta.deadline ?? defaultDeadline(type, year),
    targetRule: meta.targetRule ?? type?.targetRule ?? '',
    targetJobs: meta.targetJobs?.length ? meta.targetJobs : (type?.defaultTargetJobs ?? []),
    penaltyNote: type?.penalty?.note ?? '',
    penaltyCap: type?.penalty?.cap ?? 0,
    required: meta.required ?? true,
  }
}

/** 화면 폼 → 백엔드 CreateRequest */
export const toCreateRequest = (form) => ({
  title: form.title,
  category: form.category,
  price: 0,
  description: encodeMeta({
    typeKey: form.typeKey,
    law: form.law,
    cycle: form.cycle,
    minutes: form.minutes,
    deadline: form.deadline,
    targetRule: form.targetRule,
    targetJobs: form.targetJobs,
    required: true,
  }),
})
