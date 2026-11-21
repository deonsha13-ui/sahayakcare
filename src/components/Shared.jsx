import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Badge({ children, tone = "green" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const listener = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll("button,input,select,a,textarea");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}>
            <X />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Empty({ text }) {
  return (
    <div className="empty">
      <CheckCircle2 />
      <h3>{text}</h3>
      <p>No matching items right now.</p>
    </div>
  );
}
export function Waveform({ active = false }) {
  return (
    <div className={`waveform ${active ? "moving" : ""}`} aria-hidden="true">
      {Array.from({ length: 37 }, (_, i) => (
        <i key={i} className={`wave-${i % 9}`} />
      ))}
    </div>
  );
}
