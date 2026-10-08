import { Link } from "react-router-dom";
import { categories, categoryTranslations, checklist, componentGuides, localizeComponentGuide } from "@a11y/content";
import { ChecklistCard } from "../components/ChecklistCard";
import { usePreferences } from "../preferences";
import { AuditPage } from "./AuditPage";

const sampleItems = ["contrast-text", "plain-labels", "focus-visible"]
  .map((id) => checklist.find((item) => item.id === id))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

const homePluginCopy = {
  en: {
    eyebrow: "NEW · FIGMA PLUGIN",
    title1: "Accessibility handoff,",
    title2: "directly in Figma.",
    lead: "Review the selected layer, record accessibility intent, and export a handoff your team can use — without leaving the design file.",
    primary: "Explore the Figma plugin",
    secondary: "Local install guide",
    features: ["Inspect selection", "Complete checklist", "Create annotation", "Export handoff"],
    trust: ["Free & open", "No network access", "Local plugin data"],
    selection: "CURRENT SELECTION",
    layer: "Checkout / Primary action",
    type: "COMPONENT · 144 × 48",
    pass: "Descriptive layer name",
    review: "Review final contrast",
    human: "Human review required",
    scan: "Scan selection",
    preview: "Figma plugin interface preview",
  },
  ja: {
    eyebrow: "NEW · FIGMAプラグイン",
    title1: "アクセシビリティの意図を、",
    title2: "Figmaからハンドオフ。",
    lead: "選択したレイヤーを確認し、アクセシビリティの意図を記録して、チームが使えるハンドオフとして書き出します。",
    primary: "Figmaプラグインを見る",
    secondary: "ローカルインストールガイド",
    features: ["選択を検査", "チェックリスト", "注釈を作成", "ハンドオフを書き出す"],
    trust: ["無料・オープン", "ネットワーク接続なし", "ローカルデータ"],
    selection: "現在の選択",
    layer: "Checkout / Primary action",
    type: "コンポーネント · 144 × 48",
    pass: "分かりやすいレイヤー名",
    review: "最終コントラストを確認",
    human: "人による確認が必要",
    scan: "選択を検査",
    preview: "Figmaプラグインの画面プレビュー",
  },
  ko: {
    eyebrow: "NEW · FIGMA 플러그인",
    title1: "접근성 핸드오프를",
    title2: "Figma 안에서.",
    lead: "선택한 레이어를 검토하고 접근성 의도를 기록한 뒤, 팀이 바로 사용할 수 있는 핸드오프로 내보내세요.",
    primary: "Figma 플러그인 살펴보기",
    secondary: "로컬 설치 가이드",
    features: ["선택 검사", "체크리스트", "애노테이션 생성", "핸드오프 내보내기"],
    trust: ["무료 · 오픈", "네트워크 접근 없음", "로컬 플러그인 데이터"],
    selection: "현재 선택",
    layer: "Checkout / Primary action",
    type: "컴포넌트 · 144 × 48",
    pass: "설명적인 레이어 이름",
    review: "최종 대비 검토",
    human: "사람의 검토 필요",
    scan: "선택 검사",
    preview: "Figma 플러그인 화면 미리보기",
  },
} as const;

export function HomePage() {
  const { locale, t } = usePreferences();
  const plugin = homePluginCopy[locale];
  const guides = componentGuides.map((guide) => localizeComponentGuide(guide, locale));
  const localizedCategories = categories.map((category) => locale === "en" ? category : { id: category.id, ...categoryTranslations[locale][category.id] });
  return (
    <>
      <AuditPage embedded />

      <section className="home-plugin-section">
        <div className="page-width home-plugin-layout">
          <div className="home-plugin-copy">
            <p className="section-number">{plugin.eyebrow}</p>
            <h2>{plugin.title1}<br /><em>{plugin.title2}</em></h2>
            <p>{plugin.lead}</p>
            <ul className="home-plugin-capabilities">
              {plugin.features.map((feature, index) => <li key={feature}><span>0{index + 1}</span>{feature}</li>)}
            </ul>
            <div className="home-plugin-actions">
              <Link className="button button-primary" to="/figma-plugin">{plugin.primary} <span aria-hidden="true">→</span></Link>
              <Link className="text-link" to="/figma-plugin#install">{plugin.secondary} <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="home-plugin-trust">{plugin.trust.map((item) => <span key={item}>◉ {item}</span>)}</div>
          </div>

          <div className="plugin-demo home-plugin-demo" aria-label={plugin.preview}>
            <div className="plugin-demo-bar"><span /><span /><span /><strong>A11y Before Handoff</strong></div>
            <div className="plugin-demo-tabs"><b>Audit</b><span>Checklist</span><span>Annotate</span><span>Export</span></div>
            <div className="plugin-demo-body">
              <p>{plugin.selection}</p>
              <h2>{plugin.layer}</h2>
              <small>{plugin.type}</small>
              <div className="plugin-demo-checks">
                <div><i className="demo-pass">✓</i><span>{plugin.pass}</span></div>
                <div><i className="demo-review">!</i><span>{plugin.review}</span></div>
                <div><i className="demo-info">?</i><span>{plugin.human}</span></div>
              </div>
              <button type="button" tabIndex={-1}>{plugin.scan}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="page-width split-intro">
          <div>
            <p className="section-number">{t("home.idea")}</p>
            <h2>{t("home.ideaTitle1")}<br />{t("home.ideaTitle2")}</h2>
          </div>
          <div className="manifesto-copy">
            <p>{t("home.ideaP1")}</p><p>{t("home.ideaP2")}</p>
            <div className="principle-row">
              <span>{t("home.principle1")}</span><span>{t("home.principle2")}</span><span>{t("home.principle3")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-width preview-section">
        <div className="section-heading-row">
          <div>
            <p className="section-number">{t("home.small")}</p>
            <h2>{t("home.smallTitle1")}<br />{t("home.smallTitle2")}</h2>
          </div>
          <p>{t("home.smallCopy")}</p>
        </div>
        <div className="preview-grid">
          {sampleItems.map((item) => <ChecklistCard key={item.id} item={item} compact />)}
        </div>
        <Link className="button button-dark center-button" to="/checklist">{t("home.all").replace("{count}", String(checklist.length))} <span aria-hidden="true">→</span></Link>
      </section>

      <section className="component-strip">
        <div className="page-width">
          <div className="section-heading-row light-heading">
            <div>
              <p className="section-number">{t("home.context")}</p>
              <h2>{t("home.contextTitle1")}<br /><em>{t("home.contextTitle2")}</em></h2>
            </div>
            <p>{t("home.contextCopy")}</p>
          </div>
          <div className="component-card-grid">
            {guides.map((guide, index) => (
              <Link className="component-card" to={`/components/${guide.slug}`} key={guide.slug}>
                <span className="component-index">0{index + 1}</span>
                <span className="component-icon" aria-hidden="true">{guide.icon}</span>
                <h3>{guide.name}</h3>
                <p>{guide.summary}</p>
                <span className="component-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-width category-section">
        <p className="section-number">{t("home.foundations")}</p>
        <div className="category-list">
          {localizedCategories.map((category, index) => (
            <Link to={`/checklist?category=${category.id}`} key={category.id}>
              <span>0{index + 1}</span>
              <strong>{category.label}</strong>
              <p>{category.description}</p>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
