/**
 * COMPREHENSIVE FIX:
 * 1. Revert Facebook node name back to "Facebook — Post Photo" (to match existing connections)
 *    BUT keep the URL as /feed (the actual fix for text-only posts)
 * 2. Remove invalid `onError` top-level property that breaks n8n node parsing
 * 3. Fix the Spring Callback POSTED URL/header expressions (short-circuit pattern)
 * 4. Remove errorWorkflow from settings so Error Trigger never fires externally
 * 5. Lock workflow ID to D24qIuye3CQNnOdx
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Lock ID
w.id = 'D24qIuye3CQNnOdx';

// Remove errorWorkflow so Error Trigger never fires in a broken context
delete w.settings.errorWorkflow;

// Fix every node: remove any stray properties we may have added
w.nodes.forEach(n => {
  delete n.onError;
  delete n.continueOnFail;
});

/* ── Fix Facebook node ─────────────────────────────────────────────────── */
const fb = w.nodes.find(n => n.id === 'facebook-post');
if (fb) {
  // KEEP the original name so connections still work
  fb.name = 'Facebook \u2014 Post Photo';
  // Change URL from /photos to /feed — works for both text-only and image-link
  fb.parameters.url = '=https://graph.facebook.com/v19.0/{{ $env.FACEBOOK_PAGE_ID }}/feed';
  // Safe body params using short-circuit: $json.caption is set by BOTH Set nodes
  // so it's truthy on the no-image path → short-circuits before touching Set Image URL node
  fb.parameters.bodyParameters.parameters = [
    {
      name: 'message',
      value: "={{ $json.caption || $('Set Image URL \u0026 Caption').item.json.caption }}"
    },
    {
      name: 'link',
      value: "={{ $json.imageUrl || '' }}"
    },
    {
      name: 'access_token',
      value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}'
    }
  ];
}

/* ── Fix Spring Callback POSTED ────────────────────────────────────────── */
const cbOk = w.nodes.find(n => n.id === 'callback-success');
if (cbOk) {
  // "Post to Facebook?" node is ALWAYS in chain and carries callbackUrl on no-Instagram paths
  // When Instagram was also posted, fall back to Set Image URL & Caption
  cbOk.parameters.url =
    "={{ $('Post to Facebook\u003f').item.json.callbackUrl || $('Set Image URL \u0026 Caption').item.json.callbackUrl }}";
  cbOk.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Post to Facebook\u003f').item.json.callbackSecret || $('Set Image URL \u0026 Caption').item.json.callbackSecret }}"
    }
  ];
  cbOk.parameters.bodyParameters.parameters = [
    { name: 'status', value: 'POSTED' },
    {
      name: 'generatedImageUrl',
      value: "={{ $('Post to Facebook\u003f').item.json.imageUrl || '' }}"
    }
  ];
}

/* ── Verify no broken node names in connections ────────────────────────── */
const nodeNames = new Set(w.nodes.map(n => n.name));
const conns = w.connections;
Object.entries(conns).forEach(([from, outputs]) => {
  if (!nodeNames.has(from) && from !== 'main') {
    console.warn(`WARNING: connection source "${from}" not found in nodes!`);
  }
  (outputs.main || []).forEach(targets => {
    (targets || []).forEach(t => {
      if (!nodeNames.has(t.node)) {
        console.warn(`WARNING: connection target "${t.node}" not found in nodes!`);
      }
    });
  });
});

// Write back
const out = JSON.stringify(Array.isArray(arr) ? arr : [w], null, 2);
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Done! All fixes applied:');
console.log('  node name kept as "Facebook — Post Photo" (connection-safe)');
console.log('  URL changed to /feed');
console.log('  expressions use safe short-circuit pattern');
console.log('  errorWorkflow removed from settings');
console.log('  stray onError/continueOnFail props removed');
