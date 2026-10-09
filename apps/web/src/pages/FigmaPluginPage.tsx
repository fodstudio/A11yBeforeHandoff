import { Link } from "react-router-dom";
import { checklist } from "@a11y/content";
import { usePreferences } from "../preferences";

const copy = {
  en: {
    eyebrow: "FIGMA PLUGIN",
    title1: "Make accessibility",
    title2: "intent visible.",
    lead: "Review one selection, document the decisions behind it, and carry that intent into engineering without leaving Figma.",
    install: "Download plugin ZIP",
    installGuide: "View installation guide",
    checklist: "Explore the checklist",
    tools: "focused tools",
    network: "network access",
    price: "free & open",
    mockSelection: "CURRENT SELECTION",
    mockLayer: "Checkout / Primary action",
    mockType: "COMPONENT · 144 × 48",
    mockPass: "Descriptive layer name",
    mockReview: "Review final contrast",
    mockHuman: "Human review required",
    section: "01 — INSIDE FIGMA",
    sectionTitle1: "Four tools.",
    sectionTitle2: "One handoff flow.",
    sectionCopy: "The plugin keeps automated observations separate from decisions that still need a designer, developer, or disabled user.",
    features: [
      ["01", "Inspect selection", "Review layer naming, opacity, text size, dimensions, and facts that Figma exposes reliably."],
      ["02", "Complete the checklist", "Save the shared accessibility checklist directly to the selected layer as plugin data."],
      ["03", "Create an annotation", "Document role, accessible name, state, and behavior in a bright card beside the design."],
      ["04", "Export the handoff", "Copy a readable Markdown report or download structured JSON for the team."],
    ],
    privacy: "PRIVATE BY DESIGN",
    privacyTitle: "No network access. No hidden upload.",
    privacyCopy: "The plugin is configured with no allowed network domains. It reads the current selection and stores checklist or annotation data on that Figma layer. A file is created only when you choose to export it.",
    privacyBadge1: "allowedDomains: none",
    privacyBadge2: "local plugin data",
    privacyBadge3: "user-initiated export",
    installSection: "02 — TRY THE MVP",
    installTitle1: "Install it in",
    installTitle2: "three steps.",
    installCopy: "Download the ready-to-run plugin. No terminal, Node.js, or build command is required.",
    steps: [
      ["Download and unzip", "Download the plugin ZIP and open the a11y-handoff-figma-plugin folder."],
      ["Import the manifest", "In Figma desktop, choose Plugins → Development → Import plugin from manifest, then select manifest.json."],
      ["Start reviewing", "Run A11y Handoff from Development. Figma keeps the local plugin available for future sessions."],
    ],
    path: "Manifest path",
    download: "Download the plugin",
    downloadMeta: "ZIP · Free · Local install",
    note: "The MVP supports the Figma design editor. It does not claim automated WCAG conformance.",
    detailSection: "FOR DEVELOPERS",
    detailTitle: "Prefer to build from source?",
    detailIntro: "Use this optional setup if you want to inspect or change the plugin code. Regular users can use the ZIP download above.",
    requirementsTitle: "Before you begin",
    requirements: ["Figma desktop app — local plugin development does not run in the browser app.", "Node.js 20 or newer and npm.", "This project folder downloaded or available on your computer."],
    detailedSteps: [
      ["Open the project folder", "Open a terminal in the a11y-before-handoff folder. The package.json file should be visible there.", "cd a11y-before-handoff"],
      ["Install the dependencies", "Run this once. It downloads the development packages used by the web app and plugin.", "npm install"],
      ["Build the plugin", "Create the JavaScript and interface files that Figma can run.", "npm run build"],
      ["Open a Figma Design file", "Use the latest Figma desktop app and open any Figma Design file. Select a layer if you want to test the audit immediately.", ""],
      ["Import the manifest", "Right-click the canvas, then choose Plugins → Development → Import plugin from manifest. Select the exact file shown below.", "apps/figma-plugin/manifest.json"],
      ["Run A11y Handoff", "Open the Actions menu, find the plugin under Development, and run it. Figma keeps the local plugin available for future sessions.", ""],
    ],
    rebuildTitle: "After changing the code",
    rebuildCopy: "Build again, then close and reopen the plugin in Figma. You do not need to import the manifest again.",
    rebuildCode: "npm run build",
    troubleTitle: "If something does not work",
    trouble: [
      ["The manifest cannot be selected", "Choose the manifest.json file itself, not the plugin folder."],
      ["The plugin is not listed", "Confirm that you are using the desktop app and that a Figma Design file is open."],
      ["The old interface still appears", "Run the build command again, close the plugin window, and reopen it from Development."],
      ["npm is not found", "Install Node.js 20 or newer, then reopen the terminal."],
    ],
    officialGuide: "Open Figma’s official plugin setup guide",
    cta: "Start with one layer.",
    ctaCopy: "Select it, review the evidence, and make the accessibility intent explicit before handoff.",
    openChecklist: "Open the web checklist",
  },
  ja: {
    eyebrow: "FIGMAプラグイン",
    title1: "アクセシビリティの意図を",
    title2: "見える形に。",
    lead: "Figmaを離れずに、一つの選択を確認し、判断を記録し、その意図を開発へ引き継ぎます。",
    install: "プラグインZIPをダウンロード",
    installGuide: "インストール方法を見る",
    checklist: "チェックリストを見る",
    tools: "の機能",
    network: "ネットワークアクセス",
    price: "無料・オープン",
    mockSelection: "現在の選択",
    mockLayer: "Checkout / Primary action",
    mockType: "コンポーネント · 144 × 48",
    mockPass: "分かりやすいレイヤー名",
    mockReview: "最終コントラストを確認",
    mockHuman: "人による確認が必要",
    section: "01 — FIGMAの中で",
    sectionTitle1: "4つの機能。",
    sectionTitle2: "1つのハンドオフ。",
    sectionCopy: "自動で確認できる事実と、デザイナー・開発者・障害のあるユーザーによる判断が必要な内容を分けます。",
    features: [
      ["01", "選択を検査", "レイヤー名、透明度、文字サイズ、寸法などFigmaから確実に取得できる情報を確認します。"],
      ["02", "チェックリストを完了", "共通のアクセシビリティチェックリストを選択レイヤーのプラグインデータに保存します。"],
      ["03", "注釈を作成", "役割、アクセシブルな名前、状態、動作をデザイン横のカードに記録します。"],
      ["04", "ハンドオフを書き出す", "読みやすいMarkdownをコピー、または構造化JSONをダウンロードできます。"],
    ],
    privacy: "プライバシー重視",
    privacyTitle: "ネットワーク接続なし。隠れたアップロードなし。",
    privacyCopy: "プラグインで許可されたネットワークドメインはありません。現在の選択だけを読み、チェックリストと注釈をFigmaレイヤーに保存します。ファイルは自分でエクスポートしたときだけ作成されます。",
    privacyBadge1: "許可ドメイン：なし",
    privacyBadge2: "ローカルプラグインデータ",
    privacyBadge3: "ユーザー操作で書き出し",
    installSection: "02 — MVPを試す",
    installTitle1: "3ステップで",
    installTitle2: "インストール。",
    installCopy: "実行できるプラグインをダウンロードできます。ターミナル、Node.js、ビルド作業は不要です。",
    steps: [
      ["ダウンロードして展開", "プラグインZIPをダウンロードし、a11y-handoff-figma-pluginフォルダを開きます。"],
      ["マニフェストを読み込む", "FigmaデスクトップでPlugins → Development → Import plugin from manifestを選び、manifest.jsonを指定します。"],
      ["レビューを始める", "DevelopmentからA11y Handoffを実行します。次回以降もローカルプラグインとして表示されます。"],
    ],
    path: "マニフェストの場所",
    download: "プラグインをダウンロード",
    downloadMeta: "ZIP · 無料 · ローカルインストール",
    note: "MVPはFigmaデザインエディターに対応します。WCAG適合を自動判定するものではありません。",
    detailSection: "開発者向け",
    detailTitle: "ソースからビルドする場合",
    detailIntro: "コードを確認・変更したい場合のオプションです。通常の利用は上のZIPダウンロードだけで始められます。",
    requirementsTitle: "始める前の準備",
    requirements: ["Figmaデスクトップアプリ — ブラウザ版ではローカルプラグインを開発・テストできません。", "Node.js 20以上とnpm。", "このプロジェクトフォルダがPC上にあること。"],
    detailedSteps: [
      ["プロジェクトフォルダを開く", "a11y-before-handoffフォルダでターミナルを開きます。package.jsonが見える場所です。", "cd a11y-before-handoff"],
      ["依存パッケージをインストール", "最初の一度だけ実行します。Webアプリとプラグインに必要な開発パッケージを取得します。", "npm install"],
      ["プラグインをビルド", "Figmaで実行できるJavaScriptと画面ファイルを作成します。", "npm run build"],
      ["Figma Designファイルを開く", "最新版のFigmaデスクトップアプリで任意のDesignファイルを開きます。すぐ試すならレイヤーを一つ選択します。", ""],
      ["マニフェストを読み込む", "キャンバスを右クリックし、Plugins → Development → Import plugin from manifestを選び、下記ファイルを指定します。", "apps/figma-plugin/manifest.json"],
      ["プラグインを実行", "Actionsメニューを開き、DevelopmentからA11y Handoffを実行します。次回以降もローカルプラグインとして表示されます。", ""],
    ],
    rebuildTitle: "コードを変更した後",
    rebuildCopy: "もう一度ビルドし、Figmaのプラグイン画面を閉じて開き直します。マニフェストの再読み込みは不要です。",
    rebuildCode: "npm run build",
    troubleTitle: "うまく動かない場合",
    trouble: [
      ["マニフェストを選べない", "フォルダではなくmanifest.jsonファイル自体を選択してください。"],
      ["プラグインが一覧にない", "デスクトップアプリを使い、Figma Designファイルを開いているか確認してください。"],
      ["古い画面が表示される", "再ビルドしてプラグインウィンドウを閉じ、Developmentから開き直します。"],
      ["npmが見つからない", "Node.js 20以上をインストールし、ターミナルを開き直してください。"],
    ],
    officialGuide: "Figma公式プラグイン設定ガイドを開く",
    cta: "一つのレイヤーから。",
    ctaCopy: "選択して根拠を確認し、ハンドオフ前にアクセシビリティの意図を明確にしましょう。",
    openChecklist: "Webチェックリストを開く",
  },
  ko: {
    eyebrow: "FIGMA 플러그인",
    title1: "접근성 의도를",
    title2: "디자인에 보이게.",
    lead: "Figma를 떠나지 않고 하나의 선택을 검토하고, 판단을 기록하고, 그 의도를 개발로 전달하세요.",
    install: "플러그인 ZIP 다운로드",
    installGuide: "설치 방법 보기",
    checklist: "체크리스트 살펴보기",
    tools: "가지 핵심 도구",
    network: "네트워크 접근",
    price: "무료 · 오픈",
    mockSelection: "현재 선택",
    mockLayer: "Checkout / Primary action",
    mockType: "컴포넌트 · 144 × 48",
    mockPass: "설명적인 레이어 이름",
    mockReview: "최종 대비 검토",
    mockHuman: "사람의 검토 필요",
    section: "01 — FIGMA 안에서",
    sectionTitle1: "네 가지 도구.",
    sectionTitle2: "하나의 핸드오프.",
    sectionCopy: "자동으로 확인할 수 있는 사실과 디자이너·개발자·장애인 사용자의 판단이 필요한 결정을 분리합니다.",
    features: [
      ["01", "선택 검사", "레이어 이름, 투명도, 글자 크기, 치수처럼 Figma가 신뢰성 있게 제공하는 정보를 검토합니다."],
      ["02", "체크리스트 완료", "공유 접근성 체크리스트를 선택한 레이어의 플러그인 데이터에 저장합니다."],
      ["03", "애노테이션 생성", "역할, 접근 가능한 이름, 상태, 동작을 디자인 옆의 밝은 카드로 기록합니다."],
      ["04", "핸드오프 내보내기", "읽기 쉬운 Markdown을 복사하거나 구조화된 JSON을 다운로드합니다."],
    ],
    privacy: "프라이버시 중심 설계",
    privacyTitle: "네트워크 접근도, 숨은 업로드도 없습니다.",
    privacyCopy: "플러그인에는 허용된 네트워크 도메인이 없습니다. 현재 선택을 읽고 체크리스트 또는 애노테이션 데이터를 해당 Figma 레이어에 저장합니다. 사용자가 내보내기를 선택할 때만 파일이 만들어집니다.",
    privacyBadge1: "허용 도메인 없음",
    privacyBadge2: "로컬 플러그인 데이터",
    privacyBadge3: "사용자 선택으로 내보내기",
    installSection: "02 — MVP 사용하기",
    installTitle1: "세 단계로",
    installTitle2: "설치하세요.",
    installCopy: "바로 실행할 수 있는 플러그인을 다운로드하세요. 터미널, Node.js, 빌드 명령은 필요 없습니다.",
    steps: [
      ["다운로드하고 압축 풀기", "플러그인 ZIP을 다운로드한 뒤 a11y-handoff-figma-plugin 폴더를 여세요."],
      ["매니페스트 가져오기", "Figma 데스크톱에서 Plugins → Development → Import plugin from manifest를 선택하고 manifest.json을 지정하세요."],
      ["검토 시작", "Development에서 A11y Handoff를 실행하세요. 다음부터도 로컬 플러그인 목록에 유지됩니다."],
    ],
    path: "매니페스트 경로",
    download: "플러그인 다운로드",
    downloadMeta: "ZIP · 무료 · 로컬 설치",
    note: "MVP는 Figma 디자인 에디터를 지원하며 WCAG 준수를 자동으로 인증하지 않습니다.",
    detailSection: "개발자용",
    detailTitle: "소스에서 직접 빌드하려면",
    detailIntro: "플러그인 코드를 확인하거나 수정하려는 경우를 위한 선택 사항입니다. 일반 사용자는 위의 ZIP 다운로드만으로 시작할 수 있습니다.",
    requirementsTitle: "시작하기 전에",
    requirements: ["Figma 데스크톱 앱 — 브라우저 앱에서는 로컬 플러그인을 개발·테스트할 수 없습니다.", "Node.js 20 이상과 npm.", "이 프로젝트 폴더가 컴퓨터에 준비되어 있어야 합니다."],
    detailedSteps: [
      ["프로젝트 폴더 열기", "a11y-before-handoff 폴더에서 터미널을 엽니다. package.json 파일이 보이는 위치입니다.", "cd a11y-before-handoff"],
      ["필요한 패키지 설치", "처음 한 번만 실행합니다. 웹 앱과 플러그인에 필요한 개발 패키지를 내려받습니다.", "npm install"],
      ["플러그인 빌드", "Figma가 실행할 수 있는 JavaScript와 화면 파일을 만듭니다.", "npm run build"],
      ["Figma Design 파일 열기", "최신 Figma 데스크톱 앱에서 아무 Design 파일이나 엽니다. 바로 테스트하려면 레이어 하나를 선택하세요.", ""],
      ["매니페스트 가져오기", "캔버스를 오른쪽 클릭한 뒤 Plugins → Development → Import plugin from manifest를 선택하고 아래 파일을 지정합니다.", "apps/figma-plugin/manifest.json"],
      ["플러그인 실행", "Actions 메뉴를 열고 Development에서 A11y Handoff를 실행합니다. 다음부터도 로컬 플러그인 목록에 유지됩니다.", ""],
    ],
    rebuildTitle: "코드를 수정한 뒤에는",
    rebuildCopy: "다시 빌드하고 Figma 플러그인 창을 닫았다가 Development에서 다시 여세요. 매니페스트를 다시 가져올 필요는 없습니다.",
    rebuildCode: "npm run build",
    troubleTitle: "문제가 생겼다면",
    trouble: [
      ["매니페스트를 선택할 수 없음", "폴더가 아니라 manifest.json 파일 자체를 선택했는지 확인하세요."],
      ["플러그인이 목록에 없음", "데스크톱 앱을 사용 중이며 Figma Design 파일을 열었는지 확인하세요."],
      ["이전 화면이 계속 보임", "다시 빌드하고 플러그인 창을 닫은 뒤 Development에서 다시 실행하세요."],
      ["npm 명령을 찾을 수 없음", "Node.js 20 이상을 설치한 뒤 터미널을 다시 여세요."],
    ],
    officialGuide: "Figma 공식 플러그인 설정 가이드 열기",
    cta: "레이어 하나부터 시작하세요.",
    ctaCopy: "선택하고 근거를 검토한 뒤 핸드오프 전에 접근성 의도를 명확히 남기세요.",
    openChecklist: "웹 체크리스트 열기",
  },
} as const;

export function FigmaPluginPage() {
  const { locale } = usePreferences();
  const c = copy[locale];

  return (
    <div className="plugin-page">
      <section className="page-width plugin-hero">
        <div className="plugin-hero-copy">
          <p className="eyebrow"><span /> {c.eyebrow}</p>
          <h1>{c.title1}<br /><em>{c.title2}</em></h1>
          <p>{c.lead}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/downloads/a11y-handoff-figma-plugin.zip" download>{c.install} <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="#install">{c.installGuide} <span aria-hidden="true">↘</span></a>
          </div>
          <div className="plugin-proof" aria-label="Plugin highlights">
            <span><strong>4</strong> {c.tools}</span>
            <span><strong>0</strong> {c.network}</span>
            <span><strong>MIT</strong> {c.price}</span>
          </div>
        </div>

        <div className="plugin-demo" aria-label="Plugin interface preview">
          <div className="plugin-demo-bar"><span /><span /><span /><strong>A11y Handoff</strong></div>
          <div className="plugin-demo-tabs"><b>Audit</b><span>Checklist</span><span>Annotate</span><span>Export</span></div>
          <div className="plugin-demo-body">
            <p>{c.mockSelection}</p>
            <h2>{c.mockLayer}</h2>
            <small>{c.mockType}</small>
            <div className="plugin-demo-checks">
              <div><i className="demo-pass">✓</i><span>{c.mockPass}</span></div>
              <div><i className="demo-review">!</i><span>{c.mockReview}</span></div>
              <div><i className="demo-info">?</i><span>{c.mockHuman}</span></div>
            </div>
            <button type="button" tabIndex={-1}>Scan selection</button>
          </div>
        </div>
      </section>

      <section className="page-width plugin-features">
        <div className="section-heading-row">
          <div><p className="section-number">{c.section}</p><h2>{c.sectionTitle1}<br /><em>{c.sectionTitle2}</em></h2></div>
          <p>{c.sectionCopy}</p>
        </div>
        <div className="plugin-feature-grid">
          {c.features.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <section className="plugin-privacy">
        <div className="page-width">
          <p className="section-number">{c.privacy}</p>
          <div><h2>{c.privacyTitle}</h2><p>{c.privacyCopy}</p></div>
          <div className="plugin-privacy-badges"><span>◉ {c.privacyBadge1}</span><span>◉ {c.privacyBadge2}</span><span>◉ {c.privacyBadge3}</span></div>
        </div>
      </section>

      <section className="page-width plugin-install" id="install">
        <div className="plugin-install-heading"><p className="section-number">{c.installSection}</p><h2>{c.installTitle1}<br /><em>{c.installTitle2}</em></h2><p>{c.installCopy}</p></div>
        <ol>{c.steps.map(([title, description], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        <div className="plugin-download-card">
          <div><strong>{c.download}</strong><span>{c.downloadMeta}</span></div>
          <a className="button button-primary" href="/downloads/a11y-handoff-figma-plugin.zip" download>{c.install} <span aria-hidden="true">↓</span></a>
        </div>
        <div className="manifest-path"><span>{c.path}</span><code>a11y-handoff-figma-plugin/manifest.json</code></div>
        <p className="plugin-note"><span aria-hidden="true">✦</span>{c.note}</p>

        <section className="plugin-install-detail" aria-labelledby="plugin-install-detail-title">
          <header>
            <p className="section-number">{c.detailSection}</p>
            <div><h3 id="plugin-install-detail-title">{c.detailTitle}</h3><p>{c.detailIntro}</p></div>
          </header>
          <aside className="plugin-requirements">
            <h4>{c.requirementsTitle}</h4>
            <ul>{c.requirements.map((requirement) => <li key={requirement}><span aria-hidden="true">✓</span>{requirement}</li>)}</ul>
          </aside>
          <ol className="plugin-detailed-steps">
            {c.detailedSteps.map(([title, description, command], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h4>{title}</h4><p>{description}</p>{command && <code>{command}</code>}</div>
              </li>
            ))}
          </ol>
          <div className="plugin-aftercare">
            <article><p className="section-number">REBUILD</p><h4>{c.rebuildTitle}</h4><p>{c.rebuildCopy}</p><code>{c.rebuildCode}</code></article>
            <article><p className="section-number">HELP</p><h4>{c.troubleTitle}</h4><dl>{c.trouble.map(([problem, solution]) => <div key={problem}><dt>{problem}</dt><dd>{solution}</dd></div>)}</dl></article>
          </div>
          <a className="text-link plugin-official-guide" href="https://developers.figma.com/docs/plugins/plugin-quickstart-guide/" target="_blank" rel="noreferrer">{c.officialGuide} <span aria-hidden="true">↗</span></a>
        </section>
      </section>

      <section className="page-width plugin-cta"><p className="section-number">FIGMA → HANDOFF</p><h2>{c.cta}</h2><p>{c.ctaCopy}</p><Link className="button button-primary" to="/checklist">{c.openChecklist} <span aria-hidden="true">→</span></Link></section>
    </div>
  );
}
