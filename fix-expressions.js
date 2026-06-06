/**
 * Fixes cross-branch expression errors in the n8n workflow:
 *
 * ROOT CAUSE:
 *   $('Set Image URL & Caption').item in nodes AFTER the no-image path throws
 *   ExpressionError because that node wasn't in the execution chain.
 *
 * FIX:
 *   Use short-circuit || so the cross-branch reference is only evaluated when
 *   $json.field is falsy (i.e. only when that branch WAS executed).
 *
 *   - Facebook message/link: $json.caption || $('Set Image URL & Caption').item.json.caption
 *     (on no-image path $json.caption IS defined → short-circuits, never touches Set Image URL node)
 *
 *   - Spring Callback POSTED url/secret:
 *       $('Post to Facebook?').item.json.callbackUrl
 *       || $('Set Image URL & Caption').item.json.callbackUrl
 *     ("Post to Facebook?" is always in chain and carries callbackUrl on no-image paths)
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Ensure ID stays locked
w.id = 'D24qIuye3CQNnOdx';

/* ── Fix 1: Facebook — Post Feed ───────────────────────────────────────── */
const fb = w.nodes.find(n => n.id === 'facebook-post');
if (fb) {
  fb.parameters.bodyParameters.parameters = [
    {
      name: 'message',
      // $json.caption is set by BOTH Set nodes; short-circuits before touching Set Image URL node
      value: "={{ $json.caption || $('Set Image URL & Caption').item.json.caption }}"
    },
    {
      name: 'link',
      value: "={{ $json.imageUrl || $('Set Image URL & Caption').item?.json?.imageUrl || '' }}"
    },
    {
      name: 'access_token',
      value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}'
    }
  ];
}

/* ── Fix 2: Spring — Callback POSTED ───────────────────────────────────── */
const cbOk = w.nodes.find(n => n.id === 'callback-success');
if (cbOk) {
  // After Facebook posts, $json is Facebook API response (no callbackUrl).
  // "Post to Facebook?" node output carries callbackUrl on all non-Instagram paths.
  // When Instagram was also posted, fall back to Set Image URL & Caption.
  cbOk.parameters.url =
    "={{ $('Post to Facebook?').item.json.callbackUrl || $('Set Image URL & Caption').item.json.callbackUrl }}";
  cbOk.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Post to Facebook?').item.json.callbackSecret || $('Set Image URL & Caption').item.json.callbackSecret }}"
    }
  ];
  cbOk.parameters.bodyParameters.parameters = [
    { name: 'status', value: 'POSTED' },
    {
      name: 'generatedImageUrl',
      value: "={{ $('Post to Facebook?').item.json.imageUrl || $('Set Image URL & Caption').item?.json?.imageUrl || '' }}"
    }
  ];
}

/* ── Fix 3: Remove errorWorkflow (Error Trigger has no access to callbackUrl) ── */
// Instead we'll handle errors via continueOnFail on the Facebook node
delete w.settings.errorWorkflow;

// Set continueOnFail on Facebook node so errors route back through the normal flow
if (fb) {
  fb.onError = 'continueRegularOutput';
}

// Write back
const out = Array.isArray(arr) ? JSON.stringify(arr, null, 2) : '[' + JSON.stringify(w, null, 2) + ']';
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Expression fix applied!');
console.log('  - Facebook: uses $json.caption with safe fallback');
console.log('  - Callback POSTED: uses Post to Facebook? node data for callbackUrl');
console.log('  - errorWorkflow removed (Error Trigger had no access to callbackUrl)');
