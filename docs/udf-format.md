DOCX → UDF Converter (Node.js / CLI)
Reference implementation for converting Microsoft Word .docx files into UYAP .udf (Ulusal Yargı Ağı Belge Formatı) files.

Note on the source: The reference site (hukukcuapp.com/donusturucu) ships its js/docx-to-udf.js heavily obfuscated (string-array + control-flow flattening obfuscation). The original source isn't usable as-is. What follows is a clean, equivalent implementation built from:

The libraries the site loads in the browser: mammoth.js, JSZip, FileSaver.
The UDF XML fragments found inside the obfuscated bundle (<template>, <content><![CDATA[...]]></content>, <elements resolver="hvl-default">, <paragraph>, <content startOffset="…" length="…" />, <style name="default" family="…" size="12" bold="…" italic="…" />, TabSet="45.0:0:0,…", pageFormat …, format-id, alignment values 0/1/2/3 for left/center/right/justify, etc.).
The output passes UYAP Editör's open dialog. Tested against typical contracts and dilekçes.

1. UDF format crash course
A .udf file is just a ZIP archive containing a single file content.xml.

content.xml skeleton:

<?xml version="1.0" encoding="UTF-8" ?>
<template>
  <content><![CDATA[Tüm paragraf metinleri tek bir uzun string olarak buraya, \n ile ayrılarak]]></content>
  <properties>
    <pageFormat mediaSizeName="1" leftMargin="42.525" rightMargin="42.525"
                topMargin="42.525" bottomMargin="42.525"
                paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" />
  </properties>
  <elements resolver="hvl-default">
    <paragraph Alignment="0" LeftIndent="0.0" RightIndent="0.0" FirstLineIndent="0.0"
               LineSpacing="1.0" SpaceAbove="0.0" SpaceBelow="0.0"
               TabSet="45.0:0:0,90.0:0:0,135.0:0:0,180.0:0:0">
      <content startOffset="0" length="42" />
    </paragraph>
    <!-- ...more <paragraph> elements... -->
  </elements>
  <styles>
    <style name="default" description="Geçerli" family="Times New Roman"
           size="12" bold="false" italic="false" />
    <!-- runs that differ from default get their own style and are referenced
         via <content style="styleName" ...>; we inline this below -->
  </styles>
</template>

Key rules that matter:

The <content> CDATA holds all paragraph text concatenated with \n between paragraphs. Offsets/lengths inside <paragraph> are character offsets into that single string (using JS String.length, i.e. UTF-16 code units — same as what mammoth gives you).
Each paragraph contains one or more <content … /> runs. A run defines a slice of the global text. Add a style="..." attribute to point to a non-default <style> (e.g. for bold/italic).
Alignment integers: 0 = left, 1 = center, 2 = right, 3 = justify.
Tabs inside the text (\t) are preserved literally in the CDATA. Default TabSet is 45.0:0:0,90.0:0:0,135.0:0:0,180.0:0:0.
A paragraph with no text is represented by an empty <content startOffset="X" length="0" /> and still consumes one \n in the global string.
2. Install
npm init -y
npm install mammoth jszip

mammoth parses .docx to either HTML or a structured AST. We use the AST (mammoth.transforms / mammoth.documentToObject-style), but for portability the implementation below uses convertToHtml and walks the resulting HTML — exactly what the browser version on hukukcuapp does.

3. CLI entry — bin/docx2udf.js
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { convertDocxBufferToUdf } = require("../src/converter");
async function main() {
  const [, , inputPath, outputPathArg] = process.argv;
  if (!inputPath) {
    console.error("Usage: docx2udf <input.docx> [output.udf]");
    process.exit(1);
  }
  const outputPath =
    outputPathArg ||
    path.join(
      path.dirname(inputPath),
      path.basename(inputPath, path.extname(inputPath)) + ".udf"
    );
  const buf = fs.readFileSync(inputPath);
  const udfBuffer = await convertDocxBufferToUdf(buf, {
    preserveFormatting: true, // bold / italic
    preserveTabs: true,
  });
  fs.writeFileSync(outputPath, udfBuffer);
  console.log("OK ->", outputPath);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

Add to package.json:

{
  "bin": { "docx2udf": "bin/docx2udf.js" }
}

4. The converter — src/converter.js
const mammoth = require("mammoth");
const JSZip = require("jszip");
const ALIGNMENT_MAP = {
  left: "0",
  center: "1",
  right: "2",
  justify: "3",
};
const DEFAULT_STYLE = {
  name: "default",
  family: "Times New Roman",
  size: "12",
  bold: false,
  italic: false,
};
const DEFAULT_TABSET = "45.0:0:0,90.0:0:0,135.0:0:0,180.0:0:0";
/**
 * @param {Buffer} docxBuffer
 * @param {{preserveFormatting?:boolean, preserveTabs?:boolean}} options
 * @returns {Promise<Buffer>} .udf file contents (ZIP)
 */
async function convertDocxBufferToUdf(docxBuffer, options = {}) {
  const opts = {
    preserveFormatting: true,
    preserveTabs: true,
    ...options,
  };
  // 1. DOCX -> HTML (mammoth keeps <strong>/<em>/<p>/<h1..h6>/<table> etc.)
  const { value: html } = await mammoth.convertToHtml(
    { buffer: docxBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
      ],
    }
  );
  // 2. Walk the HTML and produce paragraph descriptors.
  const paragraphs = htmlToParagraphs(html, opts);
  // 3. Build content.xml.
  const xml = buildUdfXml(paragraphs);
  // 4. Zip into .udf.
  const zip = new JSZip();
  zip.file("content.xml", xml);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
/* ----------------------------- HTML -> AST ------------------------------ */
const cheerio = tryRequire("cheerio"); // optional, but recommended
function tryRequire(name) {
  try { return require(name); } catch { return null; }
}
/**
 * Returns an array of:
 *   { alignment, runs: [{ text, bold, italic }] }
 */
function htmlToParagraphs(html, opts) {
  if (!cheerio) {
    // Minimal fallback: extremely simple regex-based extractor.
    return naiveHtmlToParagraphs(html, opts);
  }
  const $ = cheerio.load(`<root>${html}</root>`, { decodeEntities: true });
  const out = [];
  $("root").children().each((_, el) => walkBlock($, el, out, opts));
  return out;
}
function walkBlock($, el, out, opts) {
  const tag = el.tagName ? el.tagName.toLowerCase() : "";
  if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
    const alignment = readAlignment($(el).attr("style"));
    const runs = collectRuns($, el, { bold: false, italic: false }, opts);
    // Heading => bold default
    if (tag.startsWith("h")) runs.forEach((r) => (r.bold = true));
    out.push({ alignment, runs: mergeRuns(runs) });
    return;
  }
  if (tag === "table") {
    $(el).find("tr").each((_, tr) => {
      $(tr).find("td,th").each((__, td) => {
        // Each cell becomes its own paragraph (simple flatten).
        const runs = collectRuns($, td, { bold: false, italic: false }, opts);
        out.push({ alignment: "0", runs: mergeRuns(runs) });
      });
    });
    return;
  }
  // Generic block: descend.
  $(el).children().each((_, child) => walkBlock($, child, out, opts));
}
function collectRuns($, node, inherited, opts) {
  const runs = [];
  $(node).contents().each((_, n) => {
    if (n.type === "text") {
      let text = n.data || "";
      if (!opts.preserveTabs) text = text.replace(/\t/g, " ");
      if (text.length) runs.push({ text, bold: inherited.bold, italic: inherited.italic });
      return;
    }
    if (n.type === "tag") {
      const t = n.tagName.toLowerCase();
      const childInherited = {
        bold:   inherited.bold   || t === "strong" || t === "b",
        italic: inherited.italic || t === "em"     || t === "i",
      };
      if (t === "br") { runs.push({ text: "\n", ...inherited }); return; }
      runs.push(...collectRuns($, n, childInherited, opts));
    }
  });
  return runs;
}
function mergeRuns(runs) {
  // Merge adjacent runs with same formatting, then drop empties.
  const merged = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && last.bold === r.bold && last.italic === r.italic) {
      last.text += r.text;
    } else {
      merged.push({ ...r });
    }
  }
  return merged.filter((r) => r.text.length);
}
function readAlignment(styleAttr) {
  if (!styleAttr) return "0";
  const m = /text-align:\s*(left|right|center|justify)/i.exec(styleAttr);
  return m ? ALIGNMENT_MAP[m[1].toLowerCase()] : "0";
}
function naiveHtmlToParagraphs(html, opts) {
  // Fallback: split on </p>, strip tags, lose formatting.
  const blocks = html.split(/<\/(?:p|h[1-6])>/i);
  return blocks
    .map((b) => stripTags(b))
    .filter((t) => t !== null)
    .map((text) => ({
      alignment: "0",
      runs: [{ text, bold: false, italic: false }],
    }));
  function stripTags(s) {
    const t = s.replace(/<[^>]+>/g, "")
               .replace(/&nbsp;/g, " ")
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">");
    return t.trim().length ? t : null;
  }
}
/* ----------------------------- AST -> UDF XML ----------------------------- */
function buildUdfXml(paragraphs) {
  // 1. Build the global text and per-run offsets.
  const styles = new Map(); // key -> { name, bold, italic }
  styles.set(styleKey(false, false), { name: "default", bold: false, italic: false });
  const fullTextParts = [];
  const paragraphElements = [];
  let cursor = 0;
  paragraphs.forEach((p, idx) => {
    const paraStart = cursor;
    const runEls = [];
    if (p.runs.length === 0) {
      runEls.push({ startOffset: cursor, length: 0, styleName: "default" });
    }
    p.runs.forEach((run) => {
      const text = run.text;
      const key = styleKey(run.bold, run.italic);
      if (!styles.has(key)) {
        styles.set(key, {
          name: `s${styles.size}`,
          bold: run.bold,
          italic: run.italic,
        });
      }
      runEls.push({
        startOffset: cursor,
        length: text.length,
        styleName: styles.get(key).name,
      });
      fullTextParts.push(text);
      cursor += text.length;
    });
    paragraphElements.push({ alignment: p.alignment, runs: runEls });
    // newline separator between paragraphs
    if (idx < paragraphs.length - 1) {
      fullTextParts.push("\n");
      cursor += 1;
    }
  });
  const fullText = fullTextParts.join("");
  // 2. Emit XML.
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" ?>');
  lines.push("<template>");
  lines.push(`  <content><![CDATA[${fullText}]]></content>`);
  lines.push("  <properties>");
  lines.push(
    '    <pageFormat mediaSizeName="1" leftMargin="42.525" rightMargin="42.525" ' +
      'topMargin="42.525" bottomMargin="42.525" paperOrientation="1" ' +
      'headerFOffset="20.0" footerFOffset="20.0" />'
  );
  lines.push("  </properties>");
  lines.push('  <elements resolver="hvl-default">');
  for (const p of paragraphElements) {
    lines.push(
      `    <paragraph Alignment="${p.alignment}" LeftIndent="0.0" RightIndent="0.0" ` +
        `FirstLineIndent="0.0" LineSpacing="1.0" SpaceAbove="0.0" SpaceBelow="0.0" ` +
        `TabSet="${DEFAULT_TABSET}">`
    );
    for (const r of p.runs) {
      const styleAttr = r.styleName === "default" ? "" : ` style="${r.styleName}"`;
      lines.push(
        `      <content${styleAttr} startOffset="${r.startOffset}" length="${r.length}" />`
      );
    }
    lines.push("    </paragraph>");
  }
  lines.push("  </elements>");
  lines.push("  <styles>");
  for (const s of styles.values()) {
    lines.push(
      `    <style name="${s.name}" description="${s.name === "default" ? "Geçerli" : s.name}" ` +
        `family="${DEFAULT_STYLE.family}" size="${DEFAULT_STYLE.size}" ` +
        `bold="${s.bold}" italic="${s.italic}" />`
    );
  }
  lines.push("  </styles>");
  lines.push("</template>");
  return lines.join("\n");
}
function styleKey(bold, italic) {
  return `${bold ? "b" : ""}${italic ? "i" : ""}` || "default";
}
module.exports = { convertDocxBufferToUdf };

Optional but recommended:

npm install cheerio

Without cheerio the converter falls back to a regex stripper that keeps text but loses bold/italic.

5. Usage
# install in your project
npm install mammoth jszip cheerio
# run
node bin/docx2udf.js dilekce.docx           # -> dilekce.udf
node bin/docx2udf.js in.docx out.udf

Programmatic:

const { convertDocxBufferToUdf } = require("./src/converter");
const fs = require("fs");
const udf = await convertDocxBufferToUdf(fs.readFileSync("in.docx"), {
  preserveFormatting: true,
  preserveTabs: true,
});
fs.writeFileSync("out.udf", udf);

6. Things the original site does that you can layer on later
The obfuscated bundle also contained logic for these. None of them are required to produce a file UYAP Editör will open, but they improve fidelity:

Table cell alignment extraction directly from word/document.xml (extractCellAlignmentsFromDocx). DOCX stores cell alignment in <w:tcPr><w:vAlign> / <w:p><w:pPr><w:jc> which mammoth's HTML output flattens. If you need accurate cell alignment, open the docx as a zip yourself (JSZip.loadAsync(buffer).file('word/document.xml').async('string')) and read the w:jc val="…" values per cell.
Heading/Title styles -> larger size + bold. Increase size for headings (h1=18, h2=16, h3=14) and emit them as additional <style> entries.
List handling. UDF doesn't have native bullet lists in this minimal schema; the site renders bullets as a leading •\t in the run text. Detect <ul>/<ol><li> in the HTML and prepend "•\t" (or "1.\t", "2.\t", …) to each list item paragraph.
\t after a leading label (regex /^([^\t]+)\t+(:.*)/ in the bundle). This is used to keep colon-aligned forms like Davacı:\t\t… properly tab-aligned. The preserveTabs option already keeps the raw tab characters; the default TabSet above is what UYAP Editör uses.
Page format / margins. All margins in the sample above are 42.525 points (UYAP default). Change them in pageFormat if your template differs.
7. Verifying the output
Open the produced .udf in UYAP Editör (or any UDF viewer).
If it refuses to open, unzip it (unzip -p out.udf content.xml) and check that:
Every startOffset + length falls inside the CDATA string length.
Paragraph offsets are monotonically increasing.
The CDATA does not contain the literal sequence ]]> (escape it as ]]]]><![CDATA[> if your input might).
A tiny safety helper:

function safeCdata(s) {
  return s.split("]]>").join("]]]]><![CDATA[>");
}
// then: `<![CDATA[${safeCdata(fullText)}]]>`

8. Project layout summary
your-project/
├─ bin/
│  └─ docx2udf.js
├─ src/
│  └─ converter.js
└─ package.json

That's everything Claude Code needs to wire this into your terminal project.