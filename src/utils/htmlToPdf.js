// Web only: renders an HTML string in a hidden iframe and downloads it as a real
// PDF (window.print() is a no-op on most phone browsers). html2pdf loads from
// cdnjs on first use. Resolves true on success, false so callers can fall back.
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

export async function downloadHtmlAsPdf(html, filename = 'CORE-Report.pdf', existingFrame = null) {
  let frame = existingFrame;
  try {
    if (!window.html2pdf) {
      await new Promise((ok, fail) => {
        const sc = document.createElement('script');
        sc.src = LIB; sc.onload = ok; sc.onerror = fail;
        document.head.appendChild(sc);
      });
    }
    if (!frame) {
      frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0';
      frame.srcdoc = html;
      document.body.appendChild(frame);
      await new Promise((r) => { frame.onload = r; });
    }
    await window.html2pdf().set({
      margin: 0, filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(frame.contentDocument.body).save();
    return true;
  } catch (e) {
    console.warn('PDF download failed:', e);
    return false;
  } finally {
    if (!existingFrame && frame) frame.remove();
  }
}
