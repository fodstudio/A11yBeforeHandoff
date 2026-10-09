import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { wcagUnderstandingUrl } from "@a11y/content";
import { usePreferences } from "../preferences";

type Status = "pass" | "warning" | "fail" | "manual";
type Category = "document" | "structure" | "images" | "forms" | "interaction" | "media";
type Platform = "web" | "mobile";
type TargetLevel = "AA" | "AAA";
interface Result { id: string; category: Category; status: Status; title: string; detail: string; count?: number; examples?: string[]; wcag?: string[]; }
interface Report {
  kind: "web" | "figma"; platform: Platform; targetLevel: TargetLevel; url: string; finalUrl: string; pageTitle: string; scannedAt: string; score: number | null;
  summary: { passed: number; warnings: number; failed: number; manual: number; total: number };
  results: Result[]; meta: { responseMs: number; htmlBytes: number; elementCount: number };
  figma?: { fileType: string; fileKey: string; nodeId?: string; embedUrl: string };
}

const copy = {
  en: { eyebrow: "AUTOMATED FIRST PASS", title1: "Check accessibility in", title2: "a live page or design.", lead: "Choose a target platform and review priority, then enter a public website or Figma share URL. Nothing is saved.", homeLead: "Paste a public website or Figma share URL for a quick WCAG 2.2 AA first pass.", quickDefault: "Web · Figma · WCAG 2.2 AA", advanced: "Open advanced audit", platform: "Which platform are you checking?", platformHint: "Mobile reviews use a public Figma design and cover both iOS and Android.", level: "Review priority", levelHint: "AAA includes A and AA criteria and adds enhanced checks. Neither option is a certification.", labelWeb: "Public website or Figma URL", labelDesign: "Public Figma design URL", placeholderWeb: "https://example.com or figma.com/design/…", placeholderDesign: "https://figma.com/design/…", submit: "Analyze URL", loading: "Reading the link…", privacy: "We do not store your Figma files or design content on our servers. Checklist progress is stored locally in your browser unless you choose to export it.", error: "We couldn't analyze that link", score: "Overall automated score", figmaScore: "Figma design review", scoreNote: "A useful signal, not a compliance grade.", figmaNote: "A public URL can show the design, but layer semantics still need the plugin or a human review.", preview: "Interactive public preview", passed: "Passed", warnings: "Warnings", failed: "Failed", manual: "Manual checks", report: "Overall report", all: "All findings", issues: "Issues first", export: "Export JSON", again: "Analyze another URL", scanned: "Scanned", target: "Target", elements: "elements", response: "response", bytes: "HTML", empty: "Choose a platform and enter a website or public Figma URL to see results here.", manualNote: "Static HTML or a public design preview cannot reveal every barrier. Complete the manual checks and test important journeys with disabled people and assistive technology.", platforms: { web: "Web", mobile: "Mobile" }, levels: { AA: "AA · Recommended", AAA: "AAA · Enhanced" }, categories: { document: "Document", structure: "Structure", images: "Images & contrast", forms: "Forms", interaction: "Interaction", media: "Media" } },
  ja: { eyebrow: "自動チェックの第一歩", title1: "Webページやデザインの", title2: "アクセシビリティを診断。", lead: "対象プラットフォームとレビュー優先度を選び、公開WebサイトまたはFigma共有URLを入力してください。結果は保存されません。", homeLead: "公開WebサイトまたはFigma共有URLを貼り付けて、WCAG 2.2 AAの簡易チェックを始めます。", quickDefault: "Web・Figma・WCAG 2.2 AA", advanced: "詳細診断を開く", platform: "確認するプラットフォーム", platformHint: "モバイルは公開Figmaデザインを使い、iOSとAndroidをまとめて確認します。", level: "レビュー優先度", levelHint: "AAAはA・AAを含み、より厳しい確認を追加します。どちらも適合認証ではありません。", labelWeb: "公開WebサイトまたはFigma URL", labelDesign: "公開FigmaデザインURL", placeholderWeb: "https://example.com または figma.com/design/…", placeholderDesign: "https://figma.com/design/…", submit: "URLを診断", loading: "リンクを確認中…", privacy: "Figmaファイルやデザイン内容をサーバーに保存しません。チェックリストの進捗は、エクスポートを選択しない限りブラウザ内にのみ保存されます。", error: "このリンクを診断できませんでした", score: "自動チェック総合スコア", figmaScore: "Figmaデザインレビュー", scoreNote: "適合証明ではなく、改善のための目安です。", figmaNote: "公開URLでデザインは表示できますが、レイヤーの意味はプラグインまたは人による確認が必要です。", preview: "公開インタラクティブプレビュー", passed: "合格", warnings: "警告", failed: "要修正", manual: "手動確認", report: "総合レポート", all: "すべて", issues: "問題を優先", export: "JSONを書き出す", again: "別のURLを診断", scanned: "診断日時", target: "対象", elements: "要素", response: "応答", bytes: "HTML", empty: "プラットフォームを選び、Webサイトまたは公開Figma URLを入力してください。", manualNote: "静的HTMLや公開プレビューだけではすべての障壁を発見できません。手動確認を行い、障害のある人と支援技術で重要な操作をテストしてください。", platforms: { web: "Web", mobile: "モバイル" }, levels: { AA: "AA・推奨", AAA: "AAA・強化" }, categories: { document: "文書", structure: "構造", images: "画像とコントラスト", forms: "フォーム", interaction: "操作", media: "メディア" } },
  ko: { eyebrow: "자동 검사의 첫 단계", title1: "웹페이지와 디자인의", title2: "접근성을 빠르게 진단하세요.", lead: "대상 플랫폼과 검토 우선순위를 선택하고 공개 웹사이트 또는 Figma 공유 URL을 입력하세요. 결과는 저장하지 않습니다.", homeLead: "공개 웹사이트나 Figma 공유 URL을 붙여 넣고 WCAG 2.2 AA 빠른 검사를 시작하세요.", quickDefault: "Web · Figma · WCAG 2.2 AA", advanced: "상세 진단 열기", platform: "어떤 플랫폼을 확인하나요?", platformHint: "모바일은 공개 Figma 디자인을 바탕으로 iOS와 Android를 함께 검토합니다.", level: "검토 우선순위", levelHint: "AAA는 A·AA 기준을 포함하고 강화된 검토를 추가합니다. 어느 쪽도 준수 인증은 아닙니다.", labelWeb: "공개 웹사이트 또는 Figma URL", labelDesign: "공개 Figma 디자인 URL", placeholderWeb: "https://example.com 또는 figma.com/design/…", placeholderDesign: "https://figma.com/design/…", submit: "URL 분석", loading: "링크를 살펴보는 중…", privacy: "Figma 파일이나 디자인 콘텐츠를 서버에 저장하지 않습니다. 체크리스트 진행 상황은 내보내기를 선택하지 않는 한 브라우저에만 저장됩니다.", error: "이 링크를 분석하지 못했어요", score: "자동 검사 종합 점수", figmaScore: "Figma 디자인 검토", scoreNote: "규정 준수 등급이 아닌 개선을 위한 신호입니다.", figmaNote: "공개 URL은 디자인을 보여주지만 레이어 의미는 플러그인이나 사람의 검토가 필요합니다.", preview: "공개 인터랙티브 미리보기", passed: "통과", warnings: "주의", failed: "실패", manual: "수동 확인", report: "종합 보고서", all: "전체 결과", issues: "문제 우선", export: "JSON 내보내기", again: "다른 URL 분석", scanned: "분석 시각", target: "대상", elements: "개 요소", response: "응답", bytes: "HTML", empty: "플랫폼을 선택하고 웹사이트 또는 공개 Figma URL을 입력하세요.", manualNote: "정적 HTML이나 공개 디자인 미리보기만으로 모든 장벽을 발견할 수는 없습니다. 수동 확인을 완료하고 장애인 및 보조 기술과 함께 주요 여정을 테스트하세요.", platforms: { web: "Web", mobile: "모바일" }, levels: { AA: "AA · 권장", AAA: "AAA · 강화" }, categories: { document: "문서", structure: "구조", images: "이미지와 대비", forms: "폼", interaction: "인터랙션", media: "미디어" } }
} as const;

const issueTitle: Record<"ja" | "ko", Record<string, string>> = {
  ja: { "page-title": "ページに説明的なタイトルがある", "document-language": "ページ言語が指定されている", "viewport-zoom": "ビューポートで拡大できる", h1: "主要な見出しが1つある", "heading-order": "見出しレベルが論理的に並ぶ", "main-landmark": "メインコンテンツのランドマークがある", "duplicate-ids": "IDが重複していない", "image-alt": "画像にalt属性がある", "button-name": "ボタンにアクセシブルな名前がある", "link-name": "リンク名が目的を説明する", "form-labels": "フォーム項目にラベルがある", "iframe-title": "埋め込みフレームにタイトルがある", "video-captions": "動画に字幕がある", "contrast-manual": "色のコントラストを視覚的に確認する", "keyboard-manual": "キーボードとフォーカスを操作して確認する", "screen-reader-manual": "支援技術でのテストが必要", "figma-url":"Figma URLの形式が有効", "figma-node":"特定のフレームまたはノードにリンク", "figma-public":"プレビューの公開アクセスを確認", "figma-contrast":"文字とUIのコントラストを確認", "figma-text":"文字拡大と多言語をテスト", "figma-semantics":"名前・役割・状態・読み順を注釈", "figma-focus":"キーボードとフォーカス動作を記録", "figma-states":"意味のある全状態を用意", "figma-targets":"ターゲットの大きさと間隔を確認", "figma-motion":"動きの軽減とメディア代替を指定", "platform-web-responsive":"レスポンシブリフローとブラウザ拡大をテスト", "platform-web-input":"キーボード・ポインター・音声入力に対応", "platform-ios-type":"Dynamic Typeと大きな文字に対応", "platform-ios-voiceover":"VoiceOver体験を明確に定義", "platform-ios-targets":"タッチターゲットとジェスチャー代替を確認", "platform-android-text":"文字と表示サイズの拡大に対応", "platform-android-talkback":"TalkBack体験を明確に定義", "platform-android-targets":"タッチターゲットとジェスチャー代替を確認", "platform-desktop-keyboard":"すべての操作をキーボードで完了", "platform-desktop-screenreader":"デスクトップコントロールの意味を公開", "platform-desktop-scale":"文字とインターフェースの拡大をテスト", "aaa-contrast":"強化された文字コントラストを確認", "aaa-reading":"読解レベルと複雑な表現を確認", "aaa-help":"複雑な操作に文脈的ヘルプを提供", "aaa-targets":"強化されたターゲットサイズを確認" },
  ko: { "page-title": "페이지에 설명적인 제목이 있다", "document-language": "페이지 언어가 선언되어 있다", "viewport-zoom": "뷰포트에서 확대할 수 있다", h1: "주요 제목이 하나 있다", "heading-order": "제목 단계가 논리적인 순서를 따른다", "main-landmark": "본문 랜드마크가 있다", "duplicate-ids": "ID가 중복되지 않는다", "image-alt": "이미지에 alt 속성이 있다", "button-name": "버튼에 접근 가능한 이름이 있다", "link-name": "링크 이름이 목적을 설명한다", "form-labels": "폼 필드에 레이블이 있다", "iframe-title": "임베디드 프레임에 제목이 있다", "video-captions": "동영상에 자막이 있다", "contrast-manual": "색상 대비를 시각적으로 테스트해야 한다", "keyboard-manual": "키보드와 포커스를 직접 테스트해야 한다", "screen-reader-manual": "보조 기술 테스트가 필요하다", "figma-url":"Figma URL 형식이 유효하다", "figma-node":"특정 프레임 또는 노드로 연결된다", "figma-public":"미리보기의 공개 접근 확인", "figma-contrast":"텍스트와 UI 대비 검토", "figma-text":"텍스트 확대와 다국어 테스트", "figma-semantics":"이름·역할·상태·읽기 순서 표시", "figma-focus":"키보드와 포커스 동작 기록", "figma-states":"의미 있는 모든 상태 포함", "figma-targets":"대상 크기와 간격 확인", "figma-motion":"모션 감소와 미디어 대안 지정", "platform-web-responsive":"반응형 재배치와 브라우저 확대 테스트", "platform-web-input":"키보드·포인터·음성 입력 지원", "platform-ios-type":"Dynamic Type과 큰 텍스트 지원", "platform-ios-voiceover":"명확한 VoiceOver 경험 정의", "platform-ios-targets":"터치 대상과 제스처 대안 확인", "platform-android-text":"글꼴 및 화면 크기 확대 지원", "platform-android-talkback":"명확한 TalkBack 경험 정의", "platform-android-targets":"터치 대상과 제스처 대안 확인", "platform-desktop-keyboard":"모든 여정을 키보드로 완료", "platform-desktop-screenreader":"데스크톱 컨트롤 의미 제공", "platform-desktop-scale":"텍스트와 인터페이스 확대 테스트", "aaa-contrast":"강화된 텍스트 대비 확인", "aaa-reading":"읽기 수준과 복잡한 표현 검토", "aaa-help":"복잡한 작업에 맥락 도움 제공", "aaa-targets":"강화된 대상 크기 확인" }
};

const mobileIssueTitle: Record<"ja" | "ko", Record<string, string>> = {
  ja: {
    "platform-mobile-text": "モバイルの文字と表示サイズの拡大に対応",
    "platform-mobile-screenreader": "VoiceOverとTalkBack体験を明確に定義",
    "platform-mobile-targets": "タッチターゲットとジェスチャー代替を確認"
  },
  ko: {
    "platform-mobile-text": "모바일 텍스트와 화면 크기 확대 지원",
    "platform-mobile-screenreader": "명확한 VoiceOver·TalkBack 경험 정의",
    "platform-mobile-targets": "터치 대상과 제스처 대안 확인"
  }
};

const auditGuideCopy = {
  en: {
    eyebrow: "EXAMPLE REPORT",
    title: "Know what the report is telling you.",
    intro: "The report combines automated findings with prompts that still need a person. Here is a small example before you run your own audit.",
    sample: "Example product page",
    sampleLabel: "AUTOMATED SIGNAL",
    target: "Web · WCAG 2.2 AA",
    findings: [
      { status: "fail", label: "Needs attention", standard: "WCAG 1.1.1", title: "Images need useful text alternatives", detail: "Fix clear failures first and use the linked criterion to understand the requirement." },
      { status: "warning", label: "Review context", standard: "WCAG 2.4.4", title: "A link name may be ambiguous", detail: "Warnings are patterns worth inspecting, not automatic proof of a barrier." },
      { status: "manual", label: "Manual check", standard: "WCAG 2.1.1", title: "Test keyboard and focus behavior", detail: "Static code cannot reveal every interaction, state, or assistive-technology experience." }
    ],
    readEyebrow: "HOW TO READ IT",
    readTitle: "Use the score as a starting point.",
    steps: [
      ["01", "Start with failed checks", "They indicate detectable problems that usually need a concrete fix."],
      ["02", "Review warnings in context", "Confirm whether the flagged pattern creates a barrier in the actual journey."],
      ["03", "Open the WCAG reference", "Use the criterion and explanation to guide the design or implementation change."],
      ["04", "Complete manual checks", "Test keyboard, zoom, screen readers, content, motion, and real user journeys."]
    ],
    note: "A high score is not a compliance certificate. Automated checks are one layer of a complete accessibility review."
  },
  ja: {
    eyebrow: "レポート例",
    title: "レポートが伝える内容を知る。",
    intro: "自動検出した結果と、人による確認が必要な項目を一つのレポートにまとめます。診断前に小さな例を確認できます。",
    sample: "商品ページの例",
    sampleLabel: "自動チェックの目安",
    target: "Web・WCAG 2.2 AA",
    findings: [
      { status: "fail", label: "要修正", standard: "WCAG 1.1.1", title: "画像に適切な代替テキストが必要", detail: "明確な問題から修正し、リンク先の基準で要件を確認します。" },
      { status: "warning", label: "文脈を確認", standard: "WCAG 2.4.4", title: "リンク名が曖昧な可能性", detail: "警告は確認すべきパターンであり、障壁を自動的に証明するものではありません。" },
      { status: "manual", label: "手動確認", standard: "WCAG 2.1.1", title: "キーボードとフォーカスをテスト", detail: "静的コードだけでは操作、状態、支援技術での体験をすべて判断できません。" }
    ],
    readEyebrow: "読み方",
    readTitle: "スコアは出発点として使う。",
    steps: [
      ["01", "要修正から始める", "検出できた問題で、具体的な修正が必要な可能性があります。"],
      ["02", "警告を文脈で確認", "実際の操作の中で障壁になるかを人が判断します。"],
      ["03", "WCAG公式基準を開く", "基準と解説を確認し、デザインや実装の変更に使います。"],
      ["04", "手動確認を完了する", "キーボード、拡大、読み上げ、内容、動き、主要な操作をテストします。"]
    ],
    note: "高いスコアは適合証明ではありません。自動チェックは完全なアクセシビリティレビューの一部です。"
  },
  ko: {
    eyebrow: "리포트 예시",
    title: "리포트가 말하는 내용을 알아보세요.",
    intro: "자동으로 발견한 결과와 사람이 직접 확인해야 할 항목을 하나의 리포트에 담습니다. 진단 전에 간단한 예시를 살펴보세요.",
    sample: "상품 페이지 예시",
    sampleLabel: "자동 검사 신호",
    target: "Web · WCAG 2.2 AA",
    findings: [
      { status: "fail", label: "수정 필요", standard: "WCAG 1.1.1", title: "이미지에 유용한 대체 텍스트가 필요합니다", detail: "명확한 실패 항목부터 수정하고 연결된 기준에서 요구사항을 확인하세요." },
      { status: "warning", label: "맥락 확인", standard: "WCAG 2.4.4", title: "링크 이름이 모호할 수 있습니다", detail: "주의 항목은 살펴볼 패턴이며 장벽을 자동으로 확정한다는 뜻은 아닙니다." },
      { status: "manual", label: "수동 확인", standard: "WCAG 2.1.1", title: "키보드와 포커스 동작을 테스트하세요", detail: "정적 코드만으로는 모든 인터랙션과 상태, 보조 기술 경험을 확인할 수 없습니다." }
    ],
    readEyebrow: "리포트 읽는 법",
    readTitle: "점수는 출발점으로 사용하세요.",
    steps: [
      ["01", "실패 항목부터 확인", "감지 가능한 문제로, 구체적인 수정이 필요할 가능성이 높습니다."],
      ["02", "주의 항목은 맥락과 함께 검토", "실제 사용자 여정에서 장벽이 되는지 사람이 판단해야 합니다."],
      ["03", "WCAG 공식 기준 열기", "기준과 설명을 읽고 디자인이나 구현을 바꾸는 근거로 사용하세요."],
      ["04", "수동 확인 완료", "키보드, 확대, 스크린 리더, 콘텐츠, 모션과 주요 여정을 테스트하세요."]
    ],
    note: "높은 점수는 규정 준수 인증서가 아닙니다. 자동 검사는 완전한 접근성 검토의 한 단계입니다."
  }
} as const;

const statusOrder: Record<Status, number> = { fail: 0, warning: 1, manual: 2, pass: 3 };

function WcagReferenceLinks({ criteria }: { criteria: string[] }) {
  return (
    <span className="wcag-reference-links">
      WCAG{" "}
      {criteria.map((criterion, index) => (
        <span className="wcag-reference" key={criterion}>
          {index > 0 && <span className="wcag-separator" aria-hidden="true"> · </span>}
          <a
            href={wcagUnderstandingUrl(criterion)}
            target="_blank"
            rel="noreferrer"
            aria-label={`WCAG ${criterion} official explanation`}
          >
            {criterion}<span className="external-mark" aria-hidden="true">↗</span>
          </a>
        </span>
      ))}
    </span>
  );
}

export function AuditPage({ embedded = false }: { embedded?: boolean }) {
  const { locale } = usePreferences();
  const c = copy[locale];
  const guide = auditGuideCopy[locale];
  const [platform, setPlatform] = useState<Platform>("web");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("AA");
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuesFirst, setIssuesFirst] = useState(true);

  const results = useMemo(() => report ? [...report.results].sort((a, b) => issuesFirst ? statusOrder[a.status] - statusOrder[b.status] : a.category.localeCompare(b.category)) : [], [issuesFirst, report]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setReport(null);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, locale, platform, targetLevel }) });
      const data = await response.json() as Report | { error: string };
      if (!response.ok || "error" in data) throw new Error("error" in data ? data.error : "Request failed");
      setReport(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : c.error); }
    finally { setLoading(false); }
  }

  function exportReport() {
    if (!report) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    link.download = `a11y-report-${new URL(report.finalUrl).hostname}.json`; link.click(); URL.revokeObjectURL(link.href);
  }

  return (
    <div className={`page-width page-content audit-page${embedded ? " home-audit" : ""}`}>
      <header className="audit-hero">
        <div><p className="eyebrow"><span /> {c.eyebrow}</p><h1>{c.title1}<br /><em>{c.title2}</em></h1><p>{embedded ? c.homeLead : c.lead}</p></div>
        <form className="url-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="audit-url">{platform === "web" ? c.labelWeb : c.labelDesign}</label>
          <div className="url-input">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input id="audit-url" type="text" inputMode="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder={platform === "web" ? c.placeholderWeb : c.placeholderDesign} autoComplete="url" />
            <button type="submit" disabled={loading} aria-label={loading ? c.loading : c.submit}><span className="submit-label">{loading ? c.loading : c.submit}</span><span className="submit-arrow" aria-hidden="true">{loading ? "…" : "→"}</span></button>
          </div>
          {!embedded && <div className="search-option-grid">
            <fieldset className="platform-picker">
              <legend>{c.platform}</legend>
              <div>{(Object.keys(c.platforms) as Platform[]).map((option) => <button key={option} type="button" aria-pressed={platform === option} onClick={() => { setPlatform(option); setError(""); setReport(null); }}>{c.platforms[option]}</button>)}</div>
              <p>{c.platformHint}</p>
            </fieldset>
            <fieldset className="priority-picker">
              <legend>{c.level}</legend>
              <div>{(Object.keys(c.levels) as TargetLevel[]).map((option) => <button key={option} type="button" aria-pressed={targetLevel === option} onClick={() => { setTargetLevel(option); setError(""); setReport(null); }}>{c.levels[option]}</button>)}</div>
              <p>{c.levelHint}</p>
            </fieldset>
          </div>}
          {embedded && <div className="home-search-meta"><span>{c.quickDefault}</span><Link to="/audit">{c.advanced} <span aria-hidden="true">↗</span></Link></div>}
          <p className="url-privacy"><span aria-hidden="true">◉</span> {c.privacy}</p>
        </form>
      </header>

      {error && <div className="audit-error" role="alert"><strong>{c.error}</strong><p>{error}</p></div>}

      {!embedded && !report && !error && !loading && <div className="audit-empty"><span aria-hidden="true">◎</span><p>{c.empty}</p></div>}

      {!embedded && !report && <section className="audit-guide" aria-labelledby="audit-guide-title">
        <header className="audit-guide-heading">
          <div><p className="section-number">{guide.eyebrow}</p><h2 id="audit-guide-title">{guide.title}</h2></div>
          <p>{guide.intro}</p>
        </header>
        <div className="audit-guide-layout">
          <article className="example-report-card">
            <header className="example-report-summary">
              <div className="example-score" aria-label="82 out of 100"><strong>82</strong><small>/ 100</small></div>
              <div><span>{guide.sampleLabel}</span><h3>{guide.sample}</h3><p>{guide.target}</p></div>
            </header>
            <div className="example-findings">{guide.findings.map((finding) => <div className={`example-finding example-${finding.status}`} key={finding.title}>
              <span className={`result-icon status-${finding.status}`} aria-hidden="true">{finding.status === "fail" ? "×" : finding.status === "warning" ? "!" : "?"}</span>
              <div><div className="example-finding-meta"><span>{finding.label}</span><span>{finding.standard}</span></div><h4>{finding.title}</h4><p>{finding.detail}</p></div>
            </div>)}</div>
          </article>
          <aside className="report-reading-guide">
            <p className="section-number">{guide.readEyebrow}</p>
            <h3>{guide.readTitle}</h3>
            <ol>{guide.steps.map(([number, title, detail]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ol>
            <p className="report-reading-note"><span aria-hidden="true">✦</span>{guide.note}</p>
          </aside>
        </div>
      </section>}

      {report && <section className="report" aria-live="polite">
        <header className="report-summary">
          <div className={`score-ring ${report.kind === "figma" ? "figma-score" : ""}`} style={{ "--score": `${(report.score || 0) * 3.6}deg` } as CSSProperties}><span>{report.score === null ? <strong className="figma-word">{c.platforms[report.platform]}</strong> : <><strong>{report.score}</strong><small>/ 100</small></>}</span></div>
          <div className="score-copy"><p className="section-number">{report.kind === "figma" ? c.figmaScore : c.score}</p><h2>{report.pageTitle}</h2><a href={report.finalUrl} target="_blank" rel="noreferrer">{report.finalUrl} <span aria-hidden="true">↗</span></a><p>{report.kind === "figma" ? c.figmaNote : c.scoreNote}</p></div>
          <div className="summary-counts">
            <div><strong>{report.summary.passed}</strong><span className="result-dot status-pass" />{c.passed}</div>
            <div><strong>{report.summary.warnings}</strong><span className="result-dot status-warning" />{c.warnings}</div>
            <div><strong>{report.summary.failed}</strong><span className="result-dot status-fail" />{c.failed}</div>
            <div><strong>{report.summary.manual}</strong><span className="result-dot status-manual" />{c.manual}</div>
          </div>
        </header>
        <div className="report-meta"><span>{c.target}: {c.platforms[report.platform]}</span><span>WCAG 2.2 {report.targetLevel}</span><span>{c.scanned}: {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.scannedAt))}</span>{report.kind === "web" ? <><span>{report.meta.elementCount} {c.elements}</span><span>{report.meta.responseMs} ms {c.response}</span><span>{Math.round(report.meta.htmlBytes / 1024)} KB {c.bytes}</span></> : <><span>Figma {report.figma?.fileType}</span>{report.figma?.nodeId && <span>Node {report.figma.nodeId}</span>}</>}</div>
        {report.figma && <section className="figma-preview"><div className="figma-preview-heading"><p className="section-number">{c.preview}</p><a href={report.finalUrl} target="_blank" rel="noreferrer">Open in Figma ↗</a></div><iframe src={report.figma.embedUrl} title={`${report.pageTitle} — Figma preview`} allowFullScreen /></section>}
        <div className="report-toolbar"><div><p className="section-number">{c.report}</p><h2>{report.summary.total} {c.all}</h2></div><div><button type="button" className={issuesFirst ? "active" : ""} onClick={() => setIssuesFirst(true)}>{c.issues}</button><button type="button" className={!issuesFirst ? "active" : ""} onClick={() => setIssuesFirst(false)}>{c.all}</button><button type="button" onClick={exportReport}>{c.export} ↓</button></div></div>
        <div className="report-list">{results.map((result) => <article className={`report-item report-${result.status}`} key={result.id}>
          <span className={`result-icon status-${result.status}`} aria-hidden="true">{result.status === "pass" ? "✓" : result.status === "fail" ? "×" : result.status === "warning" ? "!" : "?"}</span>
          <div><div className="result-topline"><span>{c.categories[result.category]}</span>{result.wcag && <WcagReferenceLinks criteria={result.wcag} />}</div><h3>{locale === "en" ? result.title : mobileIssueTitle[locale][result.id] || issueTitle[locale][result.id] || result.title}</h3><p>{result.detail}</p>{result.examples?.length ? <details><summary>Examples ({result.examples.length})</summary><ul>{result.examples.map((example) => <li key={example}><code>{example}</code></li>)}</ul></details> : null}</div>
        </article>)}</div>
        <aside className="manual-note"><span aria-hidden="true">✦</span><p>{c.manualNote}</p></aside>
        <button className="button button-dark center-button" type="button" onClick={() => { setReport(null); setUrl(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{c.again}</button>
      </section>}
    </div>
  );
}
