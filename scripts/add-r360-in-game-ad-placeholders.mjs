#!/usr/bin/env node
/**
 * R360: add the R347 static in-game ad reservations to live top-level canvas
 * games. This intentionally edits source ranges instead of serializing HTML,
 * so page-specific markup, JSON-LD, and inline game code stay byte-for-byte.
 *
 * Usage:
 *   node scripts/add-r360-in-game-ad-placeholders.mjs --check
 *   node scripts/add-r360-in-game-ad-placeholders.mjs --write
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const EXCLUDED_TOP_LEVEL_DIRECTORIES = new Set(['admin', 'api', 'blog', 'docs', 'tools']);
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);
const UNSAFE_SIBLING_PARENTS = new Set(['a', 'button', 'label', 'option', 'p', 'select']);
const AUXILIARY_CANVAS = /(?:^|[-_\s]|(?<=[a-z])(?=[A-Z]))(bg|background|star|particle|particles|confetti|celebration|effect|effects|overlay|tutorial|preview|thumb|thumbnail|mini|next|hold|title)(?:[-_\s]|(?=[A-Z])|$)/i;
const PRIMARY_CANVAS = /(?:^|[-_\s])(game|board|play|stage|field|main|canvas)(?:[-_\s]|$)/i;
const POSITIONED_CANVAS = /(?:^|[-_\s]|(?<=[a-z])(?=[A-Z]))(bg|background)(?:[-_\s]|(?=[A-Z])|$)/i;

const PLACEHOLDER_CSS = `
/* R360: R347 static in-game banner placeholders. */
#gz-ad-above-game,#gz-ad-below-canvas{
  display:block;max-width:728px;width:100%;height:90px;min-height:50px;max-height:90px;
  margin:6px auto;text-align:center;overflow:hidden;
  contain:layout paint style;box-sizing:border-box;position:relative;
  background:transparent;border-radius:6px;
}
#gz-ad-above-game ins,#gz-ad-below-canvas ins,
#gz-ad-above-game iframe,#gz-ad-below-canvas iframe{
  display:block;position:absolute!important;top:0!important;left:0!important;
  width:100%!important;max-width:728px!important;height:100%!important;
  min-height:50px!important;max-height:90px!important;overflow:hidden;
  border:0;
}
#gz-ad-above-game:empty::after,#gz-ad-below-canvas:empty::after{
  content:"Sponsored · Advertisement";position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);color:#1a3a5c;font-size:.7em;opacity:.35;
  letter-spacing:.05em;pointer-events:none;
}
@media(max-width:600px){
  #gz-ad-above-game,#gz-ad-below-canvas{height:50px;min-height:50px;max-height:60px;margin:4px auto}
  #gz-ad-above-game ins,#gz-ad-below-canvas ins,
  #gz-ad-above-game iframe,#gz-ad-below-canvas iframe{
    max-height:60px!important;min-height:50px!important;
  }
}
`;

const PLACEHOLDER_STYLE_MARKER = 'data-gz-r360-placeholders';

const ABOVE_PLACEHOLDER = '<div id="gz-ad-above-game"></div>';
const BELOW_PLACEHOLDER = '<div id="gz-ad-below-canvas"></div>';

function findTagEnd(html, start) {
  let quote = '';
  let quotedCandidateEnd = -1;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = '';
      else if (character === '>') quotedCandidateEnd = quotedCandidateEnd === -1 ? index + 1 : quotedCandidateEnd;
      // A few legacy pages have an unclosed attribute quote. Prefer the first
      // candidate tag end if a new tag starts, matching browser recovery.
      else if (character === '<' && quotedCandidateEnd !== -1) return quotedCandidateEnd;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }
  return -1;
}

function parseTag(raw) {
  const match = raw.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)\b([\s\S]*?)>$/);
  if (!match) return null;
  return {
    closing: Boolean(match[1]),
    name: match[2].toLowerCase(),
    attributes: match[3],
    selfClosing: /\/\s*$/.test(match[3]),
  };
}

function attributeValue(attributes, name) {
  const expression = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = attributes.match(expression);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

function tokenizeHtml(html) {
  const tokens = [];
  const stack = [];
  let index = 0;

  while (index < html.length) {
    const start = html.indexOf('<', index);
    if (start === -1) break;

    if (html.startsWith('<!--', start)) {
      const end = html.indexOf('-->', start + 4);
      index = end === -1 ? html.length : end + 3;
      continue;
    }

    if (/^<![^>]*>/i.test(html.slice(start))) {
      const end = findTagEnd(html, start + 2);
      index = end === -1 ? html.length : end;
      continue;
    }

    const end = findTagEnd(html, start + 1);
    if (end === -1) break;
    const raw = html.slice(start, end);
    const parsed = parseTag(raw);
    if (!parsed) {
      index = end;
      continue;
    }

    if (parsed.closing) {
      for (let stackIndex = stack.length - 1; stackIndex >= 0; stackIndex -= 1) {
        if (stack[stackIndex].name === parsed.name) {
          const open = stack[stackIndex];
          open.closeStart = start;
          open.closeEnd = end;
          stack.length = stackIndex;
          break;
        }
      }
      tokens.push({ ...parsed, start, end, raw, closing: true });
      index = end;
      continue;
    }

    const token = {
      ...parsed,
      start,
      end,
      raw,
      parent: stack[stack.length - 1] || null,
      ancestors: [...stack],
      closeStart: null,
      closeEnd: null,
    };
    tokens.push(token);

    if (!parsed.selfClosing && !VOID_ELEMENTS.has(parsed.name)) stack.push(token);

    // Script and style contents are raw text, so do not mistake strings such as
    // "<canvas>" in game code for elements.
    if (!parsed.selfClosing && (parsed.name === 'script' || parsed.name === 'style')) {
      const closeExpression = new RegExp(`<\\s*\\/\\s*${parsed.name}\\s*>`, 'ig');
      closeExpression.lastIndex = end;
      const close = closeExpression.exec(html);
      if (!close) {
        index = html.length;
        continue;
      }
      const closeStart = close.index;
      const closeEnd = closeStart + close[0].length;
      token.closeStart = closeStart;
      token.closeEnd = closeEnd;
      stack.pop();
      tokens.push({ name: parsed.name, closing: true, start: closeStart, end: closeEnd, raw: close[0] });
      index = closeEnd;
      continue;
    }

    index = end;
  }

  return tokens;
}

function canvasScore(canvas, sequence) {
  const own = `${attributeValue(canvas.attributes, 'id')} ${attributeValue(canvas.attributes, 'class')} ${attributeValue(canvas.attributes, 'aria-label')}`;
  const context = [own, ...canvas.ancestors.slice(-3).map((ancestor) => `${attributeValue(ancestor.attributes, 'id')} ${attributeValue(ancestor.attributes, 'class')}`)].join(' ');
  let score = 100 - sequence;
  const id = attributeValue(canvas.attributes, 'id').toLowerCase();
  const width = Number(attributeValue(canvas.attributes, 'width')) || 0;
  const height = Number(attributeValue(canvas.attributes, 'height')) || 0;

  if (id === 'c' || id === 'canvas') score += 80;
  if (PRIMARY_CANVAS.test(own)) score += 60;
  if (PRIMARY_CANVAS.test(context)) score += 25;
  if (AUXILIARY_CANVAS.test(own)) score -= 240;
  if (AUXILIARY_CANVAS.test(context)) score -= 80;
  if (width * height >= 120000) score += 20;
  if (width * height > 0 && width * height <= 70000) score -= 15;
  return score;
}

function selectPrimaryCanvas(tokens) {
  const canvases = tokens.filter((token) => !token.closing && token.name === 'canvas' && token.ancestors.some((ancestor) => ancestor.name === 'body'));
  if (!canvases.length) return null;
  const scored = canvases
    .map((canvas, sequence) => ({ canvas, score: canvasScore(canvas, sequence) }))
    .sort((left, right) => right.score - left.score || left.canvas.start - right.canvas.start);
  return AUXILIARY_CANVAS.test(`${attributeValue(scored[0].canvas.attributes, 'id')} ${attributeValue(scored[0].canvas.attributes, 'class')}`) ? null : scored[0].canvas;
}

function dynamicGameAnchor(tokens) {
  const elements = tokens.filter((token) => !token.closing && token.ancestors.some((ancestor) => ancestor.name === 'body'));
  const candidates = elements
    .filter((element) => !['body', 'html', 'script', 'style', 'canvas'].includes(element.name))
    .map((element, sequence) => {
      const id = attributeValue(element.attributes, 'id');
      const className = attributeValue(element.attributes, 'class');
      const own = `${id} ${className}`;
      let score = -sequence;
      if (/^(?:app|stage|game|gamearea|game-container|game-area|game-stage|screen-container)$/i.test(id)) score += 220;
      else if (/^(?:game-screen|screen-game|board|board-wrap|canvas-wrap)$/i.test(id)) score += 180;
      if (/^(?:container|game-container|game-area|game-screen|board-wrap|canvas-wrap)$/i.test(className)) score += 120;
      if (PRIMARY_CANVAS.test(own)) score += 80;
      if (AUXILIARY_CANVAS.test(own)) score -= 160;
      return { element, score };
    })
    .sort((left, right) => right.score - left.score || left.element.start - right.element.start);
  return candidates[0]?.element || null;
}

function startOfIndentedLine(html, offset) {
  const lineStart = html.lastIndexOf('\n', offset - 1) + 1;
  return /^[ \t]*$/.test(html.slice(lineStart, offset)) ? lineStart : offset;
}

function pageFiles() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !EXCLUDED_TOP_LEVEL_DIRECTORIES.has(entry.name))
    .map((entry) => join(ROOT, entry.name, 'index.html'))
    .filter((file) => existsSync(file) && /<canvas\b/i.test(readFileSync(file, 'utf8')))
    .sort();
}

function promotableAnchor(canvas) {
  if (!canvas?.parent) return canvas;
  const canvasName = `${attributeValue(canvas.attributes, 'id')} ${attributeValue(canvas.attributes, 'class')}`;
  const parentId = attributeValue(canvas.parent.attributes, 'id');
  const parentClass = attributeValue(canvas.parent.attributes, 'class');
  if ((POSITIONED_CANVAS.test(canvasName) || /(?:^|\s)(?:board-wrap|canvas-wrap|game-board|game-container)(?:\s|$)/i.test(`${parentId} ${parentClass}`)) && canvas.parent.closeEnd) {
    return canvas.parent;
  }
  return canvas;
}

function inspect(file) {
  const html = readFileSync(file, 'utf8');
  const tokens = tokenizeHtml(html);
  const elements = tokens.filter((token) => !token.closing);
  const above = elements.filter((token) => attributeValue(token.attributes, 'id') === 'gz-ad-above-game');
  const below = elements.filter((token) => attributeValue(token.attributes, 'id') === 'gz-ad-below-canvas');
  const head = elements.find((token) => token.name === 'head');
  const canvas = selectPrimaryCanvas(tokens);
  const anchor = canvas ? promotableAnchor(canvas) : dynamicGameAnchor(tokens);
  const issues = [];

  if (!head?.closeStart) issues.push('missing a closable head element');
  if (!anchor?.closeEnd) issues.push('missing a closable primary canvas or game container');
  if (anchor?.parent && UNSAFE_SIBLING_PARENTS.has(anchor.parent.name)) {
    issues.push(`primary canvas or game container has unsafe sibling parent <${anchor.parent.name}>`);
  }
  if ((above.length || below.length) && (above.length !== 1 || below.length !== 1)) {
    issues.push(`partial or duplicate placeholders (${above.length} above, ${below.length} below)`);
  }
  const styleMarkers = elements.filter((token) => token.name === 'style' && Object.prototype.hasOwnProperty.call(token, 'attributes') && new RegExp(`\\b${PLACEHOLDER_STYLE_MARKER}\\b`, 'i').test(token.attributes));
  if (above.length === 1 && below.length === 1 && !/(?:R347:\s*Static|R360:\s*R347 static) in-game banner placeholders/i.test(html)) {
    issues.push('complete placeholders are missing their reservation CSS marker');
  }
  if (styleMarkers.length > 1) issues.push(`duplicate R360 style markers (${styleMarkers.length})`);

  return {
    file,
    html,
    head,
    anchor,
    above: above.length,
    below: below.length,
    complete: above.length === 1 && below.length === 1,
    issues,
  };
}

function injectReservationIntoHead(html, head) {
  return { offset: startOfIndentedLine(html, head.closeStart), text: `<style ${PLACEHOLDER_STYLE_MARKER}>${PLACEHOLDER_CSS}</style>\n` };
}

function patch(page) {
  const edits = [
    injectReservationIntoHead(page.html, page.head),
    { offset: startOfIndentedLine(page.html, page.anchor.start), text: `\n${ABOVE_PLACEHOLDER}\n` },
    { offset: page.anchor.closeEnd, text: `\n${BELOW_PLACEHOLDER}\n` },
  ].sort((left, right) => right.offset - left.offset);
  let output = page.html;
  for (const edit of edits) output = `${output.slice(0, edit.offset)}${edit.text}${output.slice(edit.offset)}`;
  writeFileSync(page.file, output);
}

function main() {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  if (!write && !check) {
    console.error('Usage: node scripts/add-r360-in-game-ad-placeholders.mjs --check|--write');
    process.exitCode = 2;
    return;
  }

  const pages = pageFiles().map(inspect);
  const complete = pages.filter((page) => page.complete);
  const residual = pages.filter((page) => !page.complete);
  const problems = pages.filter((page) => page.issues.length);

  if (problems.length) {
    for (const page of problems) console.error(`${page.file.slice(ROOT.length + 1)}: ${page.issues.join('; ')}`);
    process.exitCode = 1;
    return;
  }

  if (write) {
    for (const page of residual) patch(page);
    const after = pageFiles().map(inspect);
    const missing = after.filter((page) => !page.complete);
    const afterProblems = after.filter((page) => page.issues.length);
    if (missing.length || afterProblems.length) {
      for (const page of [...missing, ...afterProblems]) console.error(`${page.file.slice(ROOT.length + 1)}: patch verification failed: ${page.issues.join('; ') || 'missing placeholders'}`);
      process.exitCode = 1;
      return;
    }
    console.log(`R360 placeholder patch complete: ${after.length} scoped canvas pages, ${residual.length} patched, ${complete.length} already complete, 0 missing.`);
    return;
  }

  console.log(`R360 placeholder check: ${pages.length} scoped canvas pages, ${complete.length} complete, ${residual.length} missing.`);
  if (residual.length) process.exitCode = 1;
}

main();
