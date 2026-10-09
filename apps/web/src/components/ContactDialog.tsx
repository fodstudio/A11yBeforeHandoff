import { FormEvent, useEffect, useId, useRef } from "react";
import { usePreferences } from "../preferences";

type ContactDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactDialog({ open, onClose }: ContactDialogProps) {
  const { t } = usePreferences();
  const titleId = useId();
  const descriptionId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, textarea, [href]") ?? []).filter((element) => !element.hasAttribute("disabled"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `A11y Handoff — ${name}`;
    const body = `${t("contact.formName")}: ${name}\n${t("contact.formEmail")}: ${email}\n\n${message}`;
    window.location.href = `mailto:hello@a11yhandoff.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="contact-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <button className="contact-dialog-close" type="button" onClick={onClose} aria-label={t("contact.close")}>×</button>
        <p className="section-number">{t("contact.eyebrow")}</p>
        <h2 id={titleId}>{t("contact.formTitle")}</h2>
        <p id={descriptionId} className="contact-dialog-copy">{t("contact.formCopy")}</p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>{t("contact.formName")}<input ref={nameRef} name="name" autoComplete="name" required /></label>
          <label>{t("contact.formEmail")}<input name="email" type="email" autoComplete="email" required /></label>
          <label>{t("contact.formMessage")}<textarea name="message" rows={6} required /></label>
          <button className="button button-primary" type="submit">{t("contact.formSubmit")} <span aria-hidden="true">→</span></button>
          <p className="contact-form-note">{t("contact.formNote")}</p>
        </form>
      </section>
    </div>
  );
}
