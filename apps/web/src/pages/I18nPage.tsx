import { useMemo, useState } from "react";
import { usePreferences } from "../preferences";

type TargetLocale = "de" | "fi" | "fr" | "es" | "ja" | "ko" | "ar" | "pseudo";

const localePresets: Array<{ value: TargetLocale; label: string; expansion: number; direction: "ltr" | "rtl" }> = [
  { value: "de", label: "Deutsch · German", expansion: 30, direction: "ltr" },
  { value: "fi", label: "Suomi · Finnish", expansion: 35, direction: "ltr" },
  { value: "fr", label: "Français · French", expansion: 20, direction: "ltr" },
  { value: "es", label: "Español · Spanish", expansion: 25, direction: "ltr" },
  { value: "ja", label: "日本語 · Japanese", expansion: 10, direction: "ltr" },
  { value: "ko", label: "한국어 · Korean", expansion: 15, direction: "ltr" },
  { value: "ar", label: "العربية · Arabic RTL", expansion: 30, direction: "rtl" },
  { value: "pseudo", label: "Pseudo locale · Stress test", expansion: 40, direction: "ltr" }
];

const copy = {
  en: {
    eyebrow: "LOCALIZATION BEFORE HANDOFF", title: "Will your design survive translation?", lead: "Stress-test product copy for text expansion, clipping, hard-coded line breaks, and right-to-left layouts before localization becomes expensive.",
    source: "Source copy", placeholder: "Paste a button label, error message, or interface string…", locale: "Target locale", expansion: "Estimated expansion", preview: "Pseudo-localized preview", copyAction: "Copy preview", copied: "Copied", local: "Runs locally in your browser. Your text is not uploaded.",
    findings: "What to review", ready: "Add interface copy to see practical checks.", fixed: "Test fixed-width containers and buttons with this longer string.", rtl: "Mirror the layout and verify reading order, icon direction, and text alignment.", breaks: "The source contains a hard-coded line break. Let the layout wrap naturally when possible.", placeholders: "Keep variables and placeholders intact, and give translators enough context.", short: "Short labels can be abbreviations or rely too much on visual context.", context: "Include screenshots, character limits, variables, and a description of where this string appears.",
    pluginEyebrow: "FIGMA PLUGIN MVP", pluginTitle: "Check the real layout, inside Figma.", pluginCopy: "Select a frame, scan every text layer, then duplicate a safe pseudo-localized preview beside the original. Export the findings as CSV for content and localization handoff.", download: "Download plugin ZIP", install: "How to install", step1: "Unzip the download.", step2: "Open a Design file in the Figma desktop app.", step3: "Choose Plugins → Development → Import plugin from manifest.", step4: "Select manifest.json from the unzipped folder and run I18n Handoff.", privacy: "The plugin works offline and does not send Figma content to a server.", scope: "This MVP estimates risk. A native speaker and localization QA should make the final decision."
  },
  ja: {
    eyebrow: "ハンドオフ前のローカライズ", title: "翻訳しても、レイアウトは崩れない？", lead: "文字の拡張、切れ、固定改行、右から左へ読むレイアウトを、ローカライズのコストが高くなる前に確認できます。",
    source: "原文", placeholder: "ボタンラベル、エラーメッセージ、UIテキストを入力…", locale: "対象言語", expansion: "想定文字拡張", preview: "疑似ローカライズのプレビュー", copyAction: "プレビューをコピー", copied: "コピーしました", local: "ブラウザ内だけで動作し、入力したテキストは送信されません。",
    findings: "確認ポイント", ready: "UIテキストを入力すると、実践的な確認ポイントが表示されます。", fixed: "長くなった文字列で、固定幅のボタンやコンテナを確認してください。", rtl: "レイアウトを反転し、読み順、アイコンの向き、文字揃えを確認してください。", breaks: "原文に固定改行があります。可能な場合はレイアウト側で自然に折り返します。", placeholders: "変数やプレースホルダーを保ち、翻訳者に十分な文脈を渡してください。", short: "短いラベルは省略語だったり、見た目の文脈に依存しすぎることがあります。", context: "スクリーンショット、文字数制限、変数、この文字列が表示される場所の説明を添えてください。",
    pluginEyebrow: "FIGMAプラグインMVP", pluginTitle: "実際のレイアウトをFigmaで確認。", pluginCopy: "フレームを選び、すべてのテキストレイヤーを確認。原本を変更せず、横に疑似ローカライズ版を複製し、結果をCSVで共有できます。", download: "プラグインZIPをダウンロード", install: "インストール方法", step1: "ZIPを展開します。", step2: "FigmaデスクトップアプリでDesignファイルを開きます。", step3: "Plugins → Development → Import plugin from manifestを選びます。", step4: "展開したフォルダのmanifest.jsonを選び、I18n Handoffを実行します。", privacy: "プラグインはオフラインで動作し、Figmaの内容をサーバーへ送りません。", scope: "MVPはリスクの目安です。最終判断にはネイティブ話者とローカライズQAが必要です。"
  },
  ko: {
    eyebrow: "핸드오프 전 현지화", title: "번역 후에도 레이아웃이 견딜까요?", lead: "현지화 비용이 커지기 전에 텍스트 확장, 잘림, 강제 줄바꿈, 오른쪽에서 왼쪽으로 읽는 레이아웃을 점검하세요.",
    source: "원문", placeholder: "버튼 라벨, 오류 메시지 또는 UI 문구를 입력하세요…", locale: "대상 언어", expansion: "예상 텍스트 확장", preview: "의사 현지화 미리보기", copyAction: "미리보기 복사", copied: "복사됨", local: "브라우저 안에서만 작동하며 입력한 텍스트는 전송되지 않습니다.",
    findings: "검토할 내용", ready: "UI 문구를 입력하면 실용적인 검토 항목을 보여줍니다.", fixed: "길어진 문구로 고정 너비 버튼과 컨테이너를 확인하세요.", rtl: "레이아웃을 반전하고 읽기 순서, 아이콘 방향, 텍스트 정렬을 확인하세요.", breaks: "원문에 강제 줄바꿈이 있습니다. 가능하면 레이아웃에서 자연스럽게 줄바꿈하세요.", placeholders: "변수와 플레이스홀더를 유지하고 번역가에게 충분한 맥락을 제공하세요.", short: "짧은 라벨은 약어이거나 시각적 맥락에 지나치게 의존할 수 있습니다.", context: "스크린샷, 글자 수 제한, 변수와 이 문구가 나타나는 위치 설명을 함께 전달하세요.",
    pluginEyebrow: "FIGMA 플러그인 MVP", pluginTitle: "실제 레이아웃을 Figma에서 확인하세요.", pluginCopy: "프레임을 선택해 모든 텍스트 레이어를 검사하고, 원본 옆에 안전한 의사 현지화 사본을 만드세요. 결과는 CSV로 내보낼 수 있습니다.", download: "플러그인 ZIP 다운로드", install: "설치 방법", step1: "다운로드한 ZIP의 압축을 풉니다.", step2: "Figma 데스크톱 앱에서 Design 파일을 엽니다.", step3: "Plugins → Development → Import plugin from manifest를 선택합니다.", step4: "압축을 푼 폴더의 manifest.json을 선택하고 I18n Handoff를 실행합니다.", privacy: "플러그인은 오프라인으로 작동하며 Figma 콘텐츠를 서버로 보내지 않습니다.", scope: "이 MVP는 위험을 추정합니다. 최종 판단에는 원어민 검토와 현지화 QA가 필요합니다."
  }
} as const;

const accents: Record<string, string> = { a:"á",b:"ƀ",c:"ç",d:"ð",e:"ë",f:"ƒ",g:"ğ",h:"ħ",i:"ï",j:"ĵ",k:"ķ",l:"ľ",m:"ɱ",n:"ñ",o:"ö",p:"þ",q:"ɋ",r:"ř",s:"š",t:"ŧ",u:"ü",v:"ṽ",w:"ŵ",x:"ẋ",y:"ÿ",z:"ž" };

function pseudoLocalize(value: string, expansion: number) {
  const transformed = value.replace(/[A-Za-z]/g, (letter) => {
    const mapped = accents[letter.toLowerCase()] || letter;
    return letter === letter.toUpperCase() ? mapped.toUpperCase() : mapped;
  });
  const padding = " ~".repeat(Math.ceil((value.replace(/\s/g, "").length * expansion) / 200));
  return value ? `⟦${transformed}${padding}⟧` : "";
}

export function I18nPage() {
  const { locale } = usePreferences();
  const text = copy[locale];
  const [source, setSource] = useState("Your account settings have been saved.");
  const [target, setTarget] = useState<TargetLocale>("de");
  const preset = localePresets.find((item) => item.value === target)!;
  const [expansion, setExpansion] = useState(preset.expansion);
  const [copied, setCopied] = useState(false);
  const preview = useMemo(() => pseudoLocalize(source, expansion), [expansion, source]);
  const findings = useMemo(() => {
    if (!source.trim()) return [text.ready];
    const items: string[] = [text.fixed, text.context];
    if (preset.direction === "rtl") items.unshift(text.rtl);
    if (source.includes("\n")) items.push(text.breaks);
    if (/\{\{|\$\{|%[a-z]|\{\w+\}/i.test(source)) items.push(text.placeholders);
    if (source.trim().length <= 3) items.push(text.short);
    return items;
  }, [preset.direction, source, text]);

  function changeTarget(value: TargetLocale) {
    const next = localePresets.find((item) => item.value === value)!;
    setTarget(value); setExpansion(next.expansion);
  }

  async function copyPreview() {
    await navigator.clipboard.writeText(preview);
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  }

  return <div className="i18n-page">
    <section className="i18n-hero page-width">
      <div className="i18n-intro"><p className="section-number">{text.eyebrow}</p><h1>{text.title}</h1><p>{text.lead}</p></div>
      <div className="i18n-lab" aria-label="Localization text stress test">
        <label><span>{text.source}</span><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={text.placeholder} rows={4} /></label>
        <div className="i18n-lab-controls">
          <label><span>{text.locale}</span><select value={target} onChange={(event) => changeTarget(event.target.value as TargetLocale)}>{localePresets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span>{text.expansion} · {expansion}%</span><input type="range" min="0" max="60" step="5" value={expansion} onChange={(event) => setExpansion(Number(event.target.value))} /></label>
        </div>
        <div className="i18n-preview"><div><span>{text.preview}</span><span>{source.length} → ~{Math.ceil(source.length * (1 + expansion / 100))}</span></div><p dir={preset.direction}>{preview || "—"}</p><button type="button" onClick={copyPreview} disabled={!preview}>{copied ? text.copied : text.copyAction}</button></div>
        <p className="i18n-local-note">● {text.local}</p>
      </div>
    </section>

    <section className="i18n-findings page-width"><p className="section-number">02 — {text.findings}</p><ol>{findings.map((finding, index) => <li key={finding}><span>{String(index + 1).padStart(2, "0")}</span><p>{finding}</p></li>)}</ol></section>

    <section className="i18n-plugin-section"><div className="page-width i18n-plugin-layout"><div><p className="section-number">03 — {text.pluginEyebrow}</p><h2>{text.pluginTitle}</h2><p>{text.pluginCopy}</p><a className="button acid-button" href="/downloads/i18n-handoff-figma-plugin.zip" download>{text.download} <span aria-hidden="true">↓</span></a><p className="i18n-plugin-note">{text.privacy}</p></div><div className="i18n-install"><h3>{text.install}</h3><ol><li>{text.step1}</li><li>{text.step2}</li><li>{text.step3}</li><li>{text.step4}</li></ol><p>{text.scope}</p></div></div></section>
  </div>;
}
