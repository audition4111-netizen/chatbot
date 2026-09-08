import "server-only";

/**
 * 평가용 정답 세트.
 *
 * 이 파일은 knowledge/ 밖에 있으므로 검색 코퍼스에도, 답변 생성 프롬프트에도
 * 절대 들어가지 않습니다. 정답과 근거는 채점 결과를 돌려줄 때만 응답에 실립니다.
 * (검증: scripts/check-eval-isolation.mjs)
 */
export type EvalQuestion = {
  id: string;
  question: string;
  /** 무엇을 보는 문항인지 */
  category: string;
  /** 사람이 채점할 때 기준이 되는 정답 */
  expected: string;
  /** 답에 반드시 쓰여야 하는 근거 파일 */
  requiredFiles: string[];
  /** 이 문서가 근거로 잡히면 오답 신호 */
  forbiddenFiles?: string[];
  /** 채점 도우미: 정답에 들어가야 할 표현 */
  mustInclude?: string[];
};

export const EVAL_QUESTIONS: EvalQuestion[] = [
  {
    id: "q1",
    question: "해외 출장 숙박비는 1박에 얼마까지 지원되나요?",
    category: "단순 사실 조회",
    expected: "1박당 18만 원까지 실비로 지원하며, 숙박 영수증을 정산 서류에 첨부해야 합니다.",
    requiredFiles: ["01_가온서비스_출장_안내.md"],
    mustInclude: ["18만"],
  },
  {
    id: "q2",
    question: "올해 직무 교육비는 연간 얼마까지 지원되나요?",
    category: "버전 구분 (현행)",
    expected:
      "2026년 기준 연간 80만 원까지 지원합니다. 부서장 승인이 필요하고 수료증과 영수증을 교육 종료 후 10영업일 이내에 제출합니다.",
    requiredFiles: ["02_가온서비스_교육비_지원_2026.md"],
    forbiddenFiles: ["03_가온서비스_교육비_지원_2025_구버전.md"],
    mustInclude: ["80만"],
  },
  {
    id: "q3",
    question: "2025년에는 직무 교육비 한도가 얼마였나요?",
    category: "버전 구분 (과거)",
    expected: "2025년 기준 연간 60만 원이었습니다. 해당 문서는 적용이 종료된 구버전입니다.",
    requiredFiles: ["03_가온서비스_교육비_지원_2025_구버전.md"],
    mustInclude: ["60만"],
  },
  {
    id: "q4",
    question: "APP-107 오류가 나면 어떻게 해야 하나요?",
    category: "오류 코드 (혼동 유발)",
    expected:
      "승인 목록 동기화 지연입니다. 새로 고침 후 5분 뒤 다시 확인하고, 계속되면 승인 번호를 헬프데스크에 전달합니다.",
    requiredFiles: ["04_가온서비스_업무앱_FAQ.md"],
    mustInclude: ["5분", "승인 번호"],
  },
  {
    id: "q5",
    question: "APP-071 오류가 떴는데 비밀번호를 바꾸면 해결되나요?",
    category: "부정 규칙",
    expected:
      "아닙니다. APP-071은 로그인 세션 만료이며, 업무 앱 창을 닫고 다시 로그인해야 합니다. 비밀번호 변경은 해결 방법이 아닙니다.",
    requiredFiles: ["04_가온서비스_업무앱_FAQ.md"],
    mustInclude: ["로그인"],
  },
  {
    id: "q6",
    question: "반려동물 돌봄 비용도 회사에서 지원해 주나요?",
    category: "범위 밖 (확인 불가여야 함)",
    expected:
      "자료에서 확인할 수 없다고 답해야 합니다. 시설 이용 안내가 반려동물 돌봄 비용을 다루지 않는다고 명시하고 있습니다.",
    requiredFiles: ["05_가온서비스_시설_이용.md"],
    mustInclude: ["확인할 수 없"],
  },
  {
    id: "q7",
    question: "국내 출장 정산은 언제까지 해야 하나요?",
    category: "절차 기한",
    expected: "복귀 후 5영업일 이내에 정산하며, 영수증과 출장 결과를 함께 제출합니다.",
    requiredFiles: ["01_가온서비스_출장_안내.md"],
    mustInclude: ["5영업일"],
  },
  {
    id: "q8",
    question: "회의실을 3시간 쓰려면 어떤 절차가 필요한가요?",
    category: "조건 분기",
    expected:
      "사내 포털에서 사용 시작 30분 전까지 예약하고, 2시간을 넘기므로 총무팀 승인을 받아야 합니다.",
    requiredFiles: ["05_가온서비스_시설_이용.md"],
    mustInclude: ["30분", "총무팀"],
  },
  {
    id: "q9",
    question: "긴급 해외 출장은 다녀온 뒤에 사후 승인을 받아도 되나요?",
    category: "부정 규칙",
    expected:
      "안 됩니다. 부서장의 사전 승인을 받은 뒤 별도 절차로 신청해야 하며, 사후 승인은 긴급 출장 절차로 인정하지 않습니다.",
    requiredFiles: ["01_가온서비스_출장_안내.md"],
    mustInclude: ["사전 승인"],
  },
];

export function findQuestion(id: string): EvalQuestion | undefined {
  return EVAL_QUESTIONS.find((question) => question.id === id);
}

/** 정답을 뺀 목록. 실행 전 화면에 질문만 보여줄 때 씁니다. */
export function questionList() {
  return EVAL_QUESTIONS.map(({ id, question, category }) => ({
    id,
    question,
    category,
  }));
}
