// Web only: renders an HTML string in a hidden iframe and downloads it as a real
// PDF (window.print() is a no-op on most phone browsers). html2pdf loads from
// cdnjs on first use. Resolves true on success, false so callers can fall back.
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

export async function downloadHtmlAsPdf(html, filename = 'CORE-Report.pdf') {
  let frame = null;
  try {
    if (!window.html2pdf) {
      await new Promise((ok, fail) => {
        const sc = document.createElement('script');
        sc.src = LIB; sc.onload = ok; sc.onerror = fail;
        document.head.appendChild(sc);
      });
    }
    // Always render in a hidden A4-width (794px) frame so the layout is the same on
    // phones and desktops, independent of the visible preview's size.
    frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0';
    frame.srcdoc = html;
    document.body.appendChild(frame);
    await new Promise((r) => { frame.onload = r; });
    const doc = frame.contentDocument;
    // html2pdf only captures the element it is given; the report's <style> lives in
    // <head>, so move it into <body> or the PDF comes out unstyled.
    doc.querySelectorAll('head style').forEach((st) => doc.body.insertBefore(st, doc.body.firstChild));
    doc.body.style.width = '794px';
    if (doc.fonts?.ready) await doc.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));
    await window.html2pdf().set({
      margin: 0, filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      pagebreak: { mode: ['css', 'legacy'] },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(frame.contentDocument.body).save();
    return true;
  } catch (e) {
    console.warn('PDF download failed:', e);
    return false;
  } finally {
    if (frame) frame.remove();
  }
}
