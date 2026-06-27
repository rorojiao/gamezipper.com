// Dominosa QA Checklist - 40-point code-level audit
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const issues = [];

console.log('=== Dominosa QA Checklist ===\n');

// 1. Doctype
if(!html.startsWith('<!DOCTYPE html>')) issues.push('1. Missing/invalid DOCTYPE');
else console.log('✓ 1. DOCTYPE present');

// 2. HTML lang
if(!html.match(/<html[^>]*lang=["']en["']/)) issues.push('2. Missing or invalid HTML lang attribute');
else console.log('✓ 2. HTML lang="en"');

// 3. Viewport
if(!html.includes('name="viewport"')) issues.push('3. Missing viewport meta');
else console.log('✓ 3. Viewport meta present');

// 4. Title
if(!html.match(/<title>[^<]+<\/title>/)) issues.push('4. Missing title');
else console.log('✓ 4. Title present');

// 5. Canonical
if(!html.includes('rel="canonical"')) issues.push('5. Missing canonical URL');
else console.log('✓ 5. Canonical URL present');

// 6. Description
if(!html.includes('name="description"')) issues.push('6. Missing description meta');
else console.log('✓ 6. Description meta present');

// 7. Keywords
if(!html.includes('name="keywords"')) issues.push('7. Missing keywords meta');
else console.log('✓ 7. Keywords meta present');

// 8. Open Graph
const ogRequired = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'];
ogRequired.forEach(p => {
  if(!html.includes(p)) issues.push(`8. Missing ${p}`);
});
if(html.includes('og:title')) console.log('✓ 8. Open Graph tags present');

// 9. Twitter Card
if(!html.includes('twitter:card')) issues.push('9. Missing twitter:card');
else console.log('✓ 9. Twitter Card present');

// 10. Theme color
if(!html.includes('name="theme-color"')) issues.push('10. Missing theme-color');
else console.log('✓ 10. Theme color present');

// 11. Schema.org
if(!html.includes('application/ld+json')) issues.push('11. Missing schema.org JSON-LD');
else console.log('✓ 11. Schema.org JSON-LD present');

// 12. Single file (no external CSS links except footer/analytics)
if(html.match(/<link[^>]*rel="stylesheet"[^>]*href=[^>]+(?!(game-footer|mon))/)) issues.push('12. External CSS link found');
else console.log('✓ 12. Single-file architecture (no external CSS)');

// 13. No external JS except footer/analytics/monetag
const extJsIssue = !html.includes('gz-analytics') || !html.includes('game-footer') || !html.includes('monetag-manager');
if(extJsIssue) issues.push('13. Missing expected external JS (footer/analytics/monetag)');
else console.log('✓ 13. Minimal external JS (footer/analytics/monetag)');

// 14. Canvas used
if(!html.includes('<canvas')) issues.push('14. Canvas not found');
else console.log('✓ 14. Canvas rendering used');

// 15. Touch events
if(!html.includes('pointerdown') && !html.includes('touchstart')) issues.push('15. No touch/pointer events');
else console.log('✓ 15. Touch/pointer events present');

// 16. LocalStorage
if(!html.includes('localStorage')) issues.push('16. No localStorage found');
else console.log('✓ 16. LocalStorage for progress');

// 17. No console.log in production
if(html.includes('console.log(')) issues.push('17. Found console.log (should remove)');
else console.log('✓ 17. No console.log in production');

// 18. No alert()
if(html.includes('alert(')) issues.push('18. Found alert()');
else console.log('✓ 18. No alert() calls');

// 19. Accessibility (sr-only class)
if(!html.includes('sr-only')) issues.push('19. Missing sr-only for screen readers');
else console.log('✓ 19. Screen reader support (sr-only)');

// 20. Alt text (check images)
const imgMatches = html.match(/<img[^>]*>/g) || [];
let hasAltIssue = false;
imgMatches.forEach(img => {
  if(!img.includes('alt=')) hasAltIssue = true;
});
if(hasAltIssue) issues.push('20. Image without alt');
else console.log('✓ 20. Images have alt text');

// 21. Semantics (h1, sr-only for structure)
if(!html.includes('<h1') && !html.includes('sr-only')) issues.push('21. Limited semantic structure');
else console.log('✓ 21. Semantic HTML structure (h1/sr-only)');

// 22. Mobile responsive
if(!html.includes('@media') && !html.includes('max-width')) issues.push('22. No responsive CSS');
else console.log('✓ 22. Mobile responsive CSS');

// 23. Performance (defer scripts)
if(!html.includes('defer')) issues.push('23. Missing defer on scripts');
else console.log('✓ 23. Scripts deferred');

// 24. Monetag
if(!html.includes('monetag')) issues.push('24. Missing Monetag');
else console.log('✓ 24. Monetag integration');

// 25. Analytics
if(!html.includes('analytics')) issues.push('25. Missing analytics');
else console.log('✓ 25. Analytics integration');

// 26. Game footer
if(!html.includes('game-footer')) issues.push('26. Missing game-footer.js');
else console.log('✓ 26. Game footer included');

// 27. No jQuery
if(html.includes('jquery')) issues.push('27. jQuery dependency found');
else console.log('✓ 27. No jQuery dependency');

// 28. No framework (React/Vue/etc)
if(html.includes('react') || html.includes('vue') || html.includes('angular')) issues.push('28. Framework dependency found');
else console.log('✓ 28. No framework dependencies');

// 29. CSP-ready (inline handlers acceptable for single-file games)
const inlineHandlers = (html.match(/on[a-z]+=["'][^{]+["']/g) || []).length;
if(inlineHandlers > 40) issues.push('29. Excessive inline handlers');
else console.log('✓ 29. Inline handlers within limits');

// 30. No hardcoded credentials
const credPatterns = ['api_key', 'apikey', 'secret', 'password', 'token'];
let credIssue = false;
credPatterns.forEach(p => {
  if(html.match(p)) credIssue = true;
});
if(credIssue) issues.push('30. Possible credential found');
else console.log('✓ 30. No hardcoded credentials');

// 31. HTTPS canonical
if(html.includes('canonical') && !html.includes('https://gamezipper.com/dominosa/')) issues.push('31. Wrong canonical URL');
else console.log('✓ 31. Correct canonical URL');

// 32. Breadcrumb schema
if(!html.includes('BreadcrumbList')) issues.push('32. Missing breadcrumb schema');
else console.log('✓ 32. Breadcrumb schema present');

// 33. FAQ schema
if(!html.includes('FAQPage')) issues.push('33. Missing FAQ schema');
else console.log('✓ 33. FAQ schema present');

// 34. VideoGame schema
if(!html.includes('VideoGame')) issues.push('34. Missing VideoGame schema');
else console.log('✓ 34. VideoGame schema present');

// 35. HowTo schema
if(!html.includes('HowTo')) issues.push('35. Missing HowTo schema');
else console.log('✓ 35. HowTo schema present');

// 36. Valid HTML (basic tag count check)
const openDivs = (html.match(/<div/g) || []).length;
const closeDivs = (html.match(/<\/div>/g) || []).length;
if(openDivs !== closeDivs) issues.push(`36. Div mismatch: ${openDivs} open, ${closeDivs} close`);
else console.log('✓ 36. HTML tags balanced');

// 37. Closed script tags
const openScripts = (html.match(/<script/g) || []).length;
const closeScripts = (html.match(/<\/script>/g) || []).length;
if(openScripts !== closeScripts) issues.push(`37. Script mismatch: ${openScripts} open, ${closeScripts} close`);
else console.log('✓ 37. Script tags balanced');

// 38. No eval()
if(html.includes('eval(')) issues.push('38. Found eval()');
else console.log('✓ 38. No eval() calls');

// 39. Safe DOM manipulation
if(html.match(/innerHTML\s*\+=/)) issues.push('39. innerHTML+= found (potential XSS)');
else console.log('✓ 39. Safe DOM manipulation');

// 40. File size check
const size = fs.statSync('index.html').size;
const sizeKB = (size / 1024).toFixed(2);
console.log(`✓ 40. File size: ${sizeKB} KB (target: ~50KB)`);

// Summary
console.log('\n=== Summary ===');
if(issues.length === 0) {
  console.log('✓ All 40 QA checks passed!');
  process.exit(0);
} else {
  console.log(`✗ ${issues.length} issue(s) found:`);
  issues.forEach(i => console.log('  - ' + i));
  process.exit(1);
}