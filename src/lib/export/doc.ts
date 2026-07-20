// A Word/Google-Docs-openable copy of the draft, for sending to a human reviewer.
//
// WHY NOT REAL .docx: .docx is a zip of OOXML parts and would mean a new
// dependency and a build step to produce a file whose only job is to be read and
// commented on. Word, Google Docs, Pages and LibreOffice all open an HTML file
// served as application/msword and render the headings, lists and tables
// correctly, which is the whole requirement. The trade-off is that Word may warn
// once about the format not matching the extension; the file still opens.
//
// The article HTML comes from toHtml() rather than being rebuilt here, so a
// reviewer reads exactly what publishes - the FAQ included.

export const DOC_MIME = 'application/msword';

function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wrap article HTML in a document a word processor will open.
 *
 * The Office namespaces are what make Word treat this as a document rather than
 * a web page. The print-oriented styles keep it readable on paper, since a
 * reviewer often prints or comments in Google Docs.
 */
export function toDoc(articleHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escAttr(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.55; color: #111; max-width: 42em; }
  h1 { font-size: 22pt; line-height: 1.25; margin: 0 0 .6em; }
  h2 { font-size: 15pt; margin: 1.6em 0 .4em; }
  h3 { font-size: 12.5pt; margin: 1.2em 0 .3em; }
  p, li { margin: 0 0 .8em; }
  blockquote { margin: 1em 0 1em 1.5em; padding-left: 1em; border-left: 3px solid #bbb; font-style: italic; }
  table { border-collapse: collapse; margin: 1em 0; }
  th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; }
  th { background: #f2f2f2; }
</style>
</head>
<body>
${articleHtml}
</body>
</html>`;
}
