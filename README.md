# 법정의무교육 통합관리

HR 담당자용 법정의무교육 대상자 선별·이수 관리 화면. Vue 3 · Vite · Pinia · Vuetify.

> 배포본(workers.dev)은 **목 데이터**입니다. 백엔드에 연결돼 있지 않습니다.

## 바로 실행 (백엔드 없이)

```bash
cp .env.example .env
npm install
npm run dev
```

`.env.example` 기본값이 목 모드라 이대로 돌아갑니다.

## 백엔드 연동해서 실행

**1. 백엔드 도커를 먼저 띄웁니다.** `msa-lecture` 프로젝트 루트에서:

```bash
docker compose up -d
```

전부 올라오는 데 1~2분 걸립니다. `docker ps` 로 `lecture-gateway`(8080), `lecture-auth`(9000), `lecturedb`(3379) 확인.

**2. `.env` 를 고칩니다.**

```dotenv
VITE_USE_MOCK=false
VITE_CLIENT_SECRET=web-secret
```

**3. 시연 데이터를 넣습니다.** (최초 1회, DB가 비어 있음)

```bash
npm run seed:demo
```

**4. 3000 포트로 띄웁니다.**

```bash
npm run dev
```

> 인증 서버에 `localhost:3000/callback` 이 등록돼 있어 **다른 포트면 로그인이 안 됩니다.**

## 로그인 계정

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| HR 담당자 | `hr.admin@sk.com` | `SkDemo!2026` |
| 임직원 | `minji.kim@sk.com` | `SkDemo!2026` |

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 빌드 |
| `npm run lint` | oxlint + eslint |
| `npm run seed:demo` | 백엔드 DB에 시연 데이터 삽입 (`:reset` 으로 초기화 후 재삽입) |
| `npm run deploy` | Cloudflare Workers 배포 (목 데이터로 나감) |

## 참고

백엔드에는 부서·직무·이수 마감일이 없어 `src/data/` 의 시연 명부(1,248명)로 채웁니다.
백엔드에서 오는 건 과정 목록과 개인 수강 이력입니다.

환경 변수 설명은 `.env.example` 주석에 있습니다. `.env` 는 커밋하지 않습니다.
