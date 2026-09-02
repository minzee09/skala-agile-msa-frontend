/** 받침 유무에 따른 조사 선택. '산업안전보건교육' → '을', '교육과정 안내' → '를' */
export const hasFinalConsonant = (word) => {
  if (!word) return false
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

/** kind: '을/를' | '이/가' | '은/는' | '과/와' */
export const particle = (word, kind = '을/를') => {
  const [withBatchim, withoutBatchim] = kind.split('/')
  return hasFinalConsonant(word) ? withBatchim : withoutBatchim
}
