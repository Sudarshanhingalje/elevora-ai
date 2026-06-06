/**
 * SAFE EXPRESSIONS FIX:
 *
 * Use "Post to Instagram?" as the single source of truth for campaign data.
 * Since both "Set Image URL & Caption" and "Set Caption Only (No Image)"
 * connect to "Post to Instagram?", this node is ALWAYS executed in every path.
 *
 * Downstream nodes can safely reference it without throwing "Referenced node is unexecuted".
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Lock ID
w.id = 'D24qIuye3CQNnOdx';

// Clean up settings
delete w.settings.errorWorkflow;
w.nodes.forEach(n => {
  delete n.onError;
  delete n.continueOnFail;
});

/* ── 1. Post to Facebook? (IF node) ────────────────────────────────────── */
const ifFb = w.nodes.find(n => n.id === 'if-facebook');
if (ifFb) {
  ifFb.parameters.conditions.string[0].value1 =
    "={{ $('Post to Instagram?').item.json.platforms }}";
}

/* ── 2. Facebook — Post Photo (HTTP Request node) ───────────────────────── */
const fb = w.nodes.find(n => n.id === 'facebook-post');
if (fb) {
  fb.parameters.url = '=https://graph.facebook.com/v19.0/{{ $env.FACEBOOK_PAGE_ID }}/feed';
  fb.parameters.bodyParameters.parameters = [
    {
      name: 'message',
      value: "={{ $('Post to Instagram?').item.json.caption }}"
    },
    {
      name: 'link',
      value: "={{ $('Post to Instagram?').item.json.imageUrl || '' }}"
    },
    {
      name: 'access_token',
      value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}'
    }
  ];
}

/* ── 3. Spring — Callback POSTED (HTTP Request node) ────────────────────── */
const cbOk = w.nodes.find(n => n.id === 'callback-success');
if (cbOk) {
  cbOk.parameters.url = "={{ $('Post to Instagram?').item.json.callbackUrl }}";
  cbOk.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Post to Instagram?').item.json.callbackSecret }}"
    }
  ];
  cbOk.parameters.bodyParameters.parameters = [
    { name: 'status', value: 'POSTED' },
    {
      name: 'generatedImageUrl',
      value: "={{ $('Post to Instagram?').item.json.imageUrl || '' }}"
    }
  ];
}

/* ── 4. Spring — Callback FAILED (HTTP Request node) ────────────────────── */
// The error trigger is separate, but we want the callback failed to be robust.
// Webhook node is always executed.
const cbFail = w.nodes.find(n => n.id === 'callback-failed');
if (cbFail) {
  cbFail.parameters.url = "={{ $('Webhook').item.json.body.callbackUrl }}";
  cbFail.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Webhook').item.json.body.callbackSecret }}"
    }
  ];
  cbFail.parameters.bodyParameters.parameters = [
    { name: 'status', value: 'FAILED' },
    {
      name: 'errorMessage',
      value: "={{ $json.error?.message || $json.message || 'n8n workflow error' }}"
    }
  ];
}

// Write back
const out = JSON.stringify(Array.isArray(arr) ? arr : [w], null, 2);
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Safe expression fix applied successfully!');
