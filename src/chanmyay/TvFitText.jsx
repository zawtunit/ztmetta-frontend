import { useLayoutEffect, useRef } from "react";

// Fit complete text inside its assigned TV cell without truncating names.
export default function TvFitText({ active, children, className = "" }) {
  const frame = useRef(null);
  const copy = useRef(null);
  useLayoutEffect(() => {
    const box = frame.current;
    const content = copy.current;
    let stopped = false;
    function fit() {
      if (stopped || !box || !content) return;
      box.style.setProperty("--copy-fit", "1");
      if (!active || !box.clientHeight || !box.clientWidth) return;
      const fits = () => content.scrollHeight <= box.clientHeight - 2 && content.scrollWidth <= box.clientWidth;
      if (fits()) return;
      let low = 0.05, high = 1;
      for (let pass = 0; pass < 12; pass++) {
        const size = (low + high) / 2;
        box.style.setProperty("--copy-fit", String(size));
        if (fits()) low = size;
        else high = size;
      }
      box.style.setProperty("--copy-fit", String(low));
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      stopped = true;
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, [active, children]);
  return <div className={`cm-tv-fit-text ${className}`} ref={frame}>
    <div className="cm-tv-fit-copy" ref={copy}>{children}</div>
  </div>;
}
