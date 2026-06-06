const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Fix 1: errorWorkflow must point to THIS workflow's own ID so the internal Error Trigger fires
w.id = 'D24qIuye3CQNnOdx';
w.settings.errorWorkflow = 'D24qIuye3CQNnOdx';

// Fix 2: Facebook — use /feed endpoint (works for text-only AND image-with-link)
//         Remove the broken "url" body param; use "message" + optional "link" instead.
const fb = w.nodes.find(n => n.id === 'facebook-post');
if (fb) {
  fb.name = 'Facebook — Post Feed';
  fb.parameters.url = '=https://graph.facebook.com/v19.0/{{ $env.FACEBOOK_PAGE_ID }}/feed';
  fb.parameters.bodyParameters.parameters = [
    {
      name: 'message',
      value: "={{ ($('Set Image URL & Caption').item?.json?.caption ?? '') || ($('Set Caption Only (No Image)').item?.json?.caption ?? '') }}"
    },
    {
      name: 'link',
      value: "={{ ($('Set Image URL & Caption').item?.json?.imageUrl ?? '') || '' }}"
    },
    {
      name: 'access_token',
      value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}'
    }
  ];
}

// Fix 3: Instagram — only post when imageUrl is NOT empty (Instagram requires an image)
const ig = w.nodes.find(n => n.id === 'if-instagram');
if (ig && ig.parameters && ig.parameters.conditions && ig.parameters.conditions.string) {
  const alreadyHasImageCheck = ig.parameters.conditions.string.some(c => c.value1 && c.value1.includes('imageUrl'));
  if (!alreadyHasImageCheck) {
    ig.parameters.conditions.string.push({
      value1: '={{ $json.imageUrl }}',
      operation: 'isNotEmpty'
    });
  }
}

// Fix 4: Set webhook responseMode to 'onReceived' to respond immediately to Spring Boot
const wh = w.nodes.find(n => n.id === 'webhook-trigger');
if (wh && wh.parameters) {
  wh.parameters.responseMode = 'onReceived';
}

// Write back (keep as array so n8n import works)
const out = Array.isArray(arr) ? JSON.stringify(arr, null, 2) : '[' + JSON.stringify(w, null, 2) + ']';
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Workflow fixed successfully!');
console.log('- errorWorkflow set to D24qIuye3CQNnOdx');
console.log('- Facebook node now uses /feed endpoint');
console.log('- Instagram now only fires when imageUrl is present');
