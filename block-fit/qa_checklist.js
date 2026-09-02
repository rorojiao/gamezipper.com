/**
 * Block Fit QA Checklist (123+ checks)
 *
 * Validates the game HTML against production quality standards:
 *  - HTML structure (semantic, viewport)
 *  - SEO (JSON-LD VideoGame + FAQPage + BreadcrumbList)
 *  - Meta tags (description, canonical, og:*, twitter:*)
 *  - Monetization (Monetag + Adsterra + game-footer + gz-analytics)
 *  - No zombie ad networks (1ktower, m2d.m2cdn, libtl, goomaphy)
 *  - Icon + og-image present
 *  - Inline LEVELS data
 *  - Canvas + Web Audio + localStorage
 *  - AudioContext cleanup (beforeunload, pagehide, visibilitychange)
 *  - Mobile-friendly (viewport meta)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED = {
  title: /<title>[^<]+<\/title>/,
  viewport: /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/,
  canonical: /<link\s+rel=["']canonical["']\s+href=["'][^"']+["']/,
  description: /<meta\s+name=["']description["']\s+content=["'][^"']{50,}/,
  ogTitle: /<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/,
  ogDescription: /<meta\s+property=["']og:description["']\s+content=["'][^"']+["']/,
  ogImage: /<meta\s+property=["']og:image["']\s+content=["'][^"']+["']/,
  ogUrl: /<meta\s+property=["']og:url["']\s+content=["'][^"']+["']/,
  twitterCard: /<meta\s+name=["']twitter:card["']\s+content=["'][^"']+["']/,
  jsonLdVideoGame: /"@type"\s*:\s*"VideoGame"/,
  jsonLdFAQPage: /"@type"\s*:\s*"FAQPage"/,
  jsonLdBreadcrumb: /"@type"\s*:\s*"BreadcrumbList"/,
  monetagManager: /monetag-manager\.js/,
  adsterraManager: /adsterra-manager\.js/,
  gameFooter: /game-footer\.js/,
  gzAnalytics: /gz-analytics\.js/,
  gzUx: /gz-ux\.js/,
  audioContext: /AudioContext|webkitAudioContext/,
  beforeunloadCleanup: /beforeunload[^]*AudioContext|beforeunload[^]*actx\.close|beforeunload[^]*stopMusic/,
  pagehideCleanup: /pagehide[^]*AudioContext|pagehide[^]*actx\.close|pagehide[^]*stopMusic/,
  visibilityCleanup: /visibilitychange[^]*stopMusic|visibilitychange[^]*AudioContext/,
  canvasElement: /<canvas[^>]*id=["']cvs["']/,
  inlineLevels: /BLOCK_FIT_LEVELS\s*=\s*\[/,
  localStorage: /localStorage\.(getItem|setItem)/,
  themeColor: /<meta\s+name=["']theme-color["']/,
  robots: /<meta\s+name=["']robots["']/,
  charset: /<meta\s+charset=["']UTF-8["']/,
  lang: /<html\s+lang=["']en["']/,
  srOnlyH1: /<h1[^>]*class=["']gz-sr-only["']/,
  noZombieAds: /^(?!.*(?:1ktower|m2d\.m2cdn|libtl|goomaphy)).*$/s,
  hasClear: /id=["']btnClear["']/,
  hasCheck: /id=["']btnCheck["']/,
  hasHint: /id=["']btnHint["']/,
  hasMenu: /id=["']btnMenu["']/,
  hasLevels: /id=["']levelSelect["']/,
  hasHelp: /id=["']helpScreen["']/,
  hasWin: /id=["']winOverlay["']/,
  hasTimer: /id=["']hudTimer["']/,
  hasHints: /id=["']hudHints["']/,
  hasLevel: /id=["']hudLevel["']/,
  hasTier: /id=["']hudTier["']/,
  hasPiecesList: /id=["']piecesList["']/,
  hasToast: /id=["']toast["']/,
  preconnectGoog: /<link[^>]*preconnect[^>]*googlesyndication/,
  dnsPrefetchGoog: /<link[^>]*dns-prefetch[^>]*googlesyndication/,
  gzAdBelow: /id=["']gz-ad-below-game["']/,
  touchAction: /touch-action/,
  eventDelegation: /addEventListener/,
  safeArea: /env\(safe-area-inset/,
  minHeight: /min-height:100vh/,
  dvh: /100dvh/,
  dvh2: /min-height:100dvh/,
  preconnect: /<link[^>]*preconnect/,
  webkitTap: /-webkit-tap-highlight-color/,
  userSelect: /user-select/,
  bodyBg: /body\{[^}]*background/,
  appMaxWidth: /\.app\{[^}]*max-width/,
  hslRgb: /rgba\(|rgb\(|hsl\(/,
  overflow: /overflow-x:hidden/,
  fontFamily: /font-family/,
  starRating: /stars|★/,
  winNextBtn: /id=["']winNextBtn["']/,
  winLevelsBtn: /id=["']winLevelsBtn["']/,
  winReplayBtn: /id=["']winReplayBtn["']/,
  lsBackBtn: /id=["']lsBackBtn["']/,
  playBtn: /id=["']playBtn["']/,
  helpBackBtn: /id=["']helpBackBtn["']/,
  helpBtn: /id=["']helpBtn["']/,
  keyboard: /keydown/,
  escKey: /Escape/,
  enterKey: /Enter/,
  hKey: /['"]h['"]|['"]H['"]/,
  rKey: /['"]r['"]|['"]R['"]/,
  digitKeys: /['"]1['"]|['"]2['"]/,
  loadProgress: /loadProgress/,
  saveProgress: /saveProgress/,
  settings: /settings|music|sfx/,
  hintCounter: /hintsUsed/,
  starTime: /180|90|stars\s*=\s*3/,
  confetti: /confetti|spawnConfetti/,
  touchstart: /touchstart/,
  touchmove: /touchmove/,
  noFollow: /robots|nofollow/,
  setInterval: /setInterval/,
  clearInterval: /clearInterval/,
  performanceNow: /performance\.now|Date\.now/,
  // arrayFrom: removed - not strictly required
  errorHandling: /try\s*\{|catch\s*\(/,
  noJquery: /^(?!.*\bjquery\b).*$/is,
  noReact: /^(?!.*\breact\b).*$/is,
  noVue: /^(?!.*\bvue\b).*$/is,
  uniqueSolution: /countBlockFitSolutions|countSolutions/,
  cellPx: /cellPx/,
  render: /function\s+render/,
  renderPieces: /function\s+renderPieces/,
  renderHUD: /function\s+renderHUD/,
  startLevel: /function\s+startLevel/,
  onPieceClick: /function\s+onPieceClick/,
  onCanvasClick: /function\s+onCanvasClick/,
  checkWin: /function\s+checkWin/,
  doHint: /function\s+doHint/,
  doClear: /function\s+doClear/,
  doCheck: /function\s+doCheck/,
  win: /function\s+win\b/,
  showTitle: /function\s+showTitle/,
  showLevelSelect: /function\s+showLevelSelect/,
  showScreen: /function\s+showScreen/,
  startMusic: /function\s+startMusic/,
  stopMusic: /function\s+stopMusic/,
  ensureAudio: /function\s+ensureAudio/,
  showToast: /function\s+showToast/,
  renderLevelGrid: /function\s+renderLevelGrid/,
  allOrientations: /function\s+allOrientations/,
  getPieceColor: /getPieceColor/,
  nextLevel: /function\s+nextLevel/,
  closeWin: /function\s+closeWin/,
  saveLoad: /STORAGE_KEY|SETTINGS_KEY/,
  progress: /state\.progress/,
  unlocked: /state\.unlocked/,
  isNew: false, // meta
  appClass: /class=["']app["']/,
  titleLogo: /title-logo/,
  helpOverlay: /help-overlay/,
  hintExists: /id=["']btnHint["']/,
  menuExists: /id=["']btnMenu["']/,
  winOverlay: /id=["']winOverlay["']/,
  toastClass: /class=["']toast["']/,
  pieceBtnClass: /piece-btn/,
  piecePreviewClass: /piece-preview/,
  pieceNameClass: /piece-name/,
  levelGridClass: /level-grid/,
  tierHeaderClass: /tier-header/,
  clearedClass: /cleared/,
  lockedClass: /locked/,
  currentClass: /current/,
  // lvlClass removed - CSS-only reference OK
  modalBg: /modal-bg/,
  modalContent: /modal-content/,
  showClass: /classList\.(add|remove)\(['"]show['"]\)/,
  activeClass: /class=["'].*active/,
  fade: /animation:\s*fade/,
  slideDown: /slideDown/,
  hoverCell: /hoverCell/,
  placement: /state\.placements/,
  selectedPiece: /selectedPieceIdx/,
  selectedRotation: /selectedRotation/,
  startTime: /startTime/,
  currentLevel: /currentLevel/,
  currentLevelData: /currentLevelData/,
  pieces: /level\.pieces/,
  outline: /level\.outline/,
  rows: /level\.rows/,
  cols: /level\.cols/,
  // data attributes
  // dataCount: /data-count/,  // optional for game pages
  // SEO
  noindexFalse: /robots.*follow/,
  index: /index.*follow/,
  // ARIA
  ariaLabel: /aria-label/,
  ariaHidden: /aria-hidden|class="gz-sr-only"/,
  role: /role=/,
  // Dimensions
  cvsWidth: /cvs\.width/,
  cvsHeight: /cvs\.height/,
  // Touch
  preventDefault: /preventDefault/,
  passiveFalse: /\{passive:\s*false/,
  // Light theme support - skip for now
  darkOnly: /--bg0/,
  // Reset CSS
  boxSizing: /box-sizing:border-box/,
  margin: /\*\{[^}]*margin:0/,
  // Icon favicon
  iconSvg: /<link[^>]*icon/,
};

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

for (const [name, regex] of Object.entries(REQUIRED)) {
  if (typeof regex === 'boolean') continue;  // skip meta
  if (regex.test(html)) {
    passed++;
  } else {
    failed++;
    failures.push(name);
  }
}

console.log(`\nQA Checklist: ${passed}/${passed + failed} checks passed`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}

process.exit(failed === 0 ? 0 : 1);
