# 챗봇

Next.js(App Router) + Vercel AI SDK + shadcn/ui 스타일 컴포넌트로 만든 챗봇입니다. 답변은 한국어로 합니다.
UI의 색상·글꼴·간격·컴포넌트 규칙은 저장소 루트의 `DESIGN.md`를 따릅니다.

- 채팅 모델: `gpt-4.1-mini`
- 임베딩 모델: `text-embedding-3-small`
- OpenAI 호출은 **서버에서만** 일어납니다 (`src/app/api/chat/route.ts`).

## 실행 방법 (로컬)

```bash
npm install
```

`.env.local` 파일을 만들고 실제 키를 넣습니다. (`.env.example`를 복사하면 됩니다.)

```
OPENAI_API_KEY=sk-...
```

개발 서버 실행:

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

타입 검사:

```bash
npm run typecheck
```

## Vercel 배포

### 1. 프로젝트 Import

1. https://vercel.com/new 접속
2. **Import Git Repository** 에서 이 저장소를 선택
3. Framework Preset이 **Next.js** 로 잡히는지 확인 (자동 감지됩니다)
4. Build Command / Output Directory는 **기본값 그대로** 둡니다

### 2. 환경 변수 등록 (필수)

Import 화면의 **Environment Variables**, 또는 배포 후
**Settings → Environment Variables** 에서 추가합니다.

| Key | Value | Environments |
|---|---|---|
| `OPENAI_API_KEY` | 실제 OpenAI 키 | Production, Preview, Development 모두 체크 |

> 배포가 끝난 뒤에 환경 변수를 추가했다면 **Deployments → 최신 배포 → Redeploy** 를 해야 반영됩니다.
> 키가 없으면 화면은 뜨지만 메시지를 보낼 때 오류 카드가 표시됩니다.

### 3. 배포 설정 파일

`vercel.json` 에 다음이 지정되어 있습니다.

```json
{
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

- `regions: ["icn1"]` — 함수를 **서울 리전**에서 실행해 한국 사용자 응답 지연을 줄입니다.
  Hobby 플랜은 단일 리전만 지정할 수 있어 이 설정은 그대로 동작합니다.
- 응답 스트리밍 제한 시간은 `src/app/api/chat/route.ts` 의 `maxDuration = 30`(초)입니다.
  플랜 한도를 넘는다는 오류가 나면 이 값을 낮추세요.
- Node 버전은 `package.json` 의 `engines.node: ">=20.0.0"` 을 따릅니다.

### 4. CLI로 배포하는 경우

```bash
npm i -g vercel
vercel login
vercel link
vercel env add OPENAI_API_KEY production
vercel --prod
```

## 키 취급 규칙

- `OPENAI_API_KEY`는 **서버 전용**입니다. `NEXT_PUBLIC_` 접두사를 붙이면 브라우저 번들에
  그대로 노출되므로 절대 사용하지 않습니다.
- 클라이언트 컴포넌트에서 `process.env`를 읽지 않습니다. 모델 호출은 전부 `/api/chat`
  라우트를 거칩니다.
- `.env.local` 은 `.gitignore` 에 포함되어 커밋되지 않습니다. **이 저장소는 공개(public)이므로
  키를 소스 코드에 직접 적지 마세요.**

## 폴더 구조

```
src/
  app/
    api/chat/route.ts     채팅 스트리밍 엔드포인트 (서버)
    layout.tsx            폰트 + 전역 스타일
    page.tsx              페이지 조립
    globals.css           DESIGN.md 토큰 → Tailwind v4 테마
  components/
    ui/                   shadcn 스타일 프리미티브 (DESIGN.md 규칙으로 구현)
    chat/                 챗봇 화면 컴포넌트
  lib/
    ai.ts                 모델 설정 + 시스템 프롬프트 (서버 전용)
    embeddings.ts         text-embedding-3-small 헬퍼 (서버 전용)
    utils.ts              cn()
```

## DESIGN.md 적용 방식

`src/app/globals.css`의 `@theme` 블록에 `DESIGN.md`의 토큰을 1:1로 옮겨두었습니다.
컴포넌트에서는 하드코딩된 색상값 대신 토큰 유틸리티를 사용합니다.

| DESIGN.md | Tailwind 유틸리티 |
|---|---|
| `{colors.ink-deep}` | `bg-ink-deep` / `text-ink-deep` |
| `{colors.primary}` (코발트) | `bg-primary` — **구매 플로우 전용**, 챗봇 UI에서는 사용하지 않음 |
| `{rounded.full}` (100px) | `rounded-pill` |
| `{rounded.xxl}` (24px) | `rounded-xxl` |
| `{spacing.xl}` (24px) | `p-xl` / `gap-xl` |
| `{typography.body-md}` | `text-body-md` |

### 원본과 다르게 처리한 부분

- **글꼴**: `Optimistic VF`는 Meta 전용 비공개 서체라 사용할 수 없습니다. `DESIGN.md`가
  명시한 폴백 체인의 첫 항목인 **Montserrat**(라틴)과 **Noto Sans KR**(한글)을
  `next/font/google`로 불러옵니다. `ss01, ss02`는 `body`에 함께 적용해 두었습니다.
- **다크 모드**: `DESIGN.md`에 다크 모드 토큰이 정의되어 있지 않아(Known Gaps) 라이트 전용입니다.
- **hover**: `DESIGN.md`의 no-hover 정책에 따라 hover 상태 대신 pressed(`active:`) 상태만 정의했습니다.
