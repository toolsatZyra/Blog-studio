// A real Word document of the draft, for sending to a human reviewer.
//
// WHY NOT THE HTML .doc IT REPLACES: HTML served as application/msword opens
// everywhere, but Word labels it as the 1997-2004 format. A file that announces
// itself as legacy undermines the thing it is for - handing a draft to someone
// whose confidence in it matters.
//
// This is genuine OOXML: a ZIP of XML parts, which is why it needs a library.
// The `docx` import is the only non-framework dependency in the project, so it
// is loaded dynamically at the call site and never enters the main bundle.

import type { Draft, DraftBlock } from '../types';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Build the .docx bytes.
 *
 * Async and dynamically imported so the ~500KB library is fetched only when the
 * operator actually clicks the button.
 */
export async function buildReviewDocx(draft: Draft, title: string): Promise<ArrayBuffer> {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, AlignmentType,
  } = await import('docx');

  const para = (text: string) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 160 } });

  const renderBlock = (b: DraftBlock): (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] => {
    switch (b.type) {
      case 'h2':
        return [new Paragraph({ text: b.text ?? '', heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 } })];
      case 'h3':
        return [new Paragraph({ text: b.text ?? '', heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })];
      case 'blockquote':
        return [new Paragraph({
          children: [new TextRun({ text: b.text ?? '', italics: true })],
          indent: { left: 480 },
          spacing: { after: 160 },
        })];
      case 'ul':
        return (b.items ?? []).map((i) => new Paragraph({ text: i, bullet: { level: 0 }, spacing: { after: 80 } }));
      case 'ol':
        return (b.items ?? []).map((i) => new Paragraph({ text: i, numbering: { reference: 'ordered', level: 0 }, spacing: { after: 80 } }));
      case 'table': {
        if (!b.table) return [];
        const cell = (text: string, bold = false) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
        });
        return [new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: b.table.headers.map((h) => cell(h, true)) }),
            ...b.table.rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
          ],
        })];
      }
      default:
        return [para(b.text ?? '')];
    }
  };

  const children: unknown[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 280 } }),
    ...draft.blocks.flatMap(renderBlock),
  ];

  // The FAQ is what a reviewer checks hardest, so it ships with the same
  // structure it will have on the site rather than as an afterthought.
  if (draft.faq.length) {
    children.push(new Paragraph({ text: 'FAQ', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 140 } }));
    for (const f of draft.faq) {
      children.push(new Paragraph({ text: f.q, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(para(f.a));
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'ordered',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
      }],
    },
    styles: {
      default: {
        document: { run: { font: 'Georgia', size: 24 }, paragraph: { spacing: { line: 340 } } },
      },
    },
    sections: [{ children: children as never[] }],
  });

  const blob = await Packer.toBlob(doc);
  return blob.arrayBuffer();
}
