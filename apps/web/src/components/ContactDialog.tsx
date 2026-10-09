import { FormEvent, useEffect, useId, useRef, useState } from "react";
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
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [deliveryMode, setDeliveryMode] = useState<"checking" | "direct" | "mailto">("checking");

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setStatus("idle");
    setDeliveryMode("checking");
    fetch("/api/contact/status")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { configured?: boolean }) => setDeliveryMode(data.configured ? "direct" : "mailto"))
      .catch(() => setDeliveryMode("mailto"));
    nameRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, textarea, [href]") ?? []).filter((element) => !element.hasAttribute("disabled") && element.tabIndex >= 0);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const website = String(data.get("website") ?? "").trim();
    if (deliveryMode !== "direct") {
      const subject = `A11y Handoff — ${name}`;
      const body = `${t("contact.formName")}: ${name}\n${t("contact.formEmail")}: ${email}\n\n${message}`;
      window.location.href = `mailto:hello@a11yhandoff.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message, website })
      });
      if (!response.ok) throw new Error("Contact request failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="contact-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <button className="contact-dialog-close" type="button" onClick={onClose} aria-label={t("contact.close")}>×</button>
        <p className="section-number">{t("contact.eyebrow")}</p>
        <h2 id={titleId}>{t("contact.formTitle")}</h2>
        <p id={descriptionId} className="contact-dialog-copy">{t("contact.formCopy")}</p>
        {status === "success" ? (
          <div className="contact-success" role="status">
            <span aria-hidden="true">✓</span>
            <h3>{t("contact.formSuccessTitle")}</h3>
            <p>{t("contact.formSuccess")}</p>
            <button className="button button-primary" type="button" onClick={onClose}>{t("contact.formDone")}</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <label>{t("contact.formName")}<input ref={nameRef} name="name" autoComplete="name" maxLength={100} disabled={status === "sending"} required /></label>
            <label>{t("contact.formEmail")}<input name="email" type="email" autoComplete="email" maxLength={254} disabled={status === "sending"} required /></label>
            <label>{t("contact.formMessage")}<textarea name="message" rows={6} maxLength={5000} disabled={status === "sending"} required /></label>
            <label className="contact-honeypot" aria-hidden="true">Website<input name="website" autoComplete="off" tabIndex={-1} /></label>
            {status === "error" && <p className="contact-form-error" role="alert">{t("contact.formError")}</p>}
            <button className="button button-primary" type="submit" disabled={status === "sending"}>{status === "sending" ? t("contact.formSending") : t("contact.formSubmit")} <span aria-hidden="true">→</span></button>
            <p className="contact-form-note">{deliveryMode === "direct" ? t("contact.formNote") : t("contact.formMailNote")}</p>
          </form>
        )}
      </section>
    </div>
  );
}
