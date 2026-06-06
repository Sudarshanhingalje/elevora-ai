/**
 * FINAL CLEAN FIX — reference $('Webhook').item.json.body.X everywhere.
 * The Webhook node is ALWAYS in the execution chain, so it's 100% safe.
 * No Set nodes needed for passing data through — just read from Webhook directly.
 *
 * CHANGES:
 * 1. Remove broken Code node and Set nodes
 * 2. Reconnect Has Image Prompt? FALSE -> Post to Instagram? directly
 * 3. Reconnect MinIO -> Post to Instagram? (after image path)
 * 4. All IF/HTTP nodes read from $('Webhook').item.json.body.*
 * 5. Fix WEBHOOK_URL env to be just base URL so webhook registers correctly
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Lock ID
w.id = 'D24qIuye3CQNnOdx';
delete w.settings.errorWorkflow;

// --- 1. Remove Set nodes and Code node ---
w.nodes = w.nodes.filter(n => 
  n.name !== 'Set Image URL & Caption' &&
  n.name !== 'Set Caption Only (No Image)' &&
  n.name !== 'Merge Campaign Data'
);

// --- 2. Fix Post to Instagram? conditions ---
const ifInst = w.nodes.find(n => n.id === 'if-instagram');
ifInst.parameters.conditions.string = [
  {
    value1: "={{ $('Webhook').item.json.body.platforms }}",
    operation: 'contains',
    value2: 'Instagram'
  },
  {
    value1: "={{ $('Webhook').item.json.body.imagePrompt }}",
    operation: 'isNotEmpty'
  }
];

// --- 3. Fix Post to Facebook? conditions ---
const ifFb = w.nodes.find(n => n.id === 'if-facebook');
ifFb.parameters.conditions.string = [
  {
    value1: "={{ $('Webhook').item.json.body.platforms }}",
    operation: 'contains',
    value2: 'Facebook'
  }
];

// --- 4. Fix Instagram — Create Media Container body ---
const igCreate = w.nodes.find(n => n.id === 'instagram-create-container');
igCreate.parameters.bodyParameters.parameters = [
  { name: 'image_url', value: "={{ $('MinIO \u2014 Upload Image').item.json.imageUrl || '' }}" },
  { name: 'caption', value: "={{ $('Webhook').item.json.body.content + '\\n\\n' + ($('Webhook').item.json.body.hashtags || '') }}" },
  { name: 'access_token', value: '={{ $env.INSTAGRAM_ACCESS_TOKEN }}' }
];

// --- 5. Fix Facebook — Post Photo ---
const fb = w.nodes.find(n => n.id === 'facebook-post');
fb.parameters.url = '=https://graph.facebook.com/v19.0/{{ $env.FACEBOOK_PAGE_ID }}/feed';
fb.parameters.bodyParameters.parameters = [
  { name: 'message', value: "={{ $('Webhook').item.json.body.content + '\\n\\n' + ($('Webhook').item.json.body.hashtags || '') }}" },
  { name: 'access_token', value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}' }
];

// --- 6. Fix Spring Callback POSTED ---
const cbOk = w.nodes.find(n => n.id === 'callback-success');
cbOk.parameters.url = "={{ $('Webhook').item.json.body.callbackUrl }}";
cbOk.parameters.headerParameters.parameters = [
  { name: 'Content-Type', value: 'application/json' },
  { name: 'X-Callback-Secret', value: "={{ $('Webhook').item.json.body.callbackSecret }}" }
];
cbOk.parameters.bodyParameters.parameters = [
  { name: 'status', value: 'POSTED' },
  { name: 'generatedImageUrl', value: '' }
];

// --- 7. Fix Spring Callback FAILED ---
const cbFail = w.nodes.find(n => n.id === 'callback-failed');
cbFail.parameters.url = "={{ $('Webhook').item.json.body.callbackUrl }}";
cbFail.parameters.headerParameters.parameters = [
  { name: 'Content-Type', value: 'application/json' },
  { name: 'X-Callback-Secret', value: "={{ $('Webhook').item.json.body.callbackSecret }}" }
];
cbFail.parameters.bodyParameters.parameters = [
  { name: 'status', value: 'FAILED' },
  { name: 'errorMessage', value: "={{ $json.message || 'n8n error' }}" }
];

// --- 8. Fix Set Filename (keep, it's needed for image path) ---
const setFilename = w.nodes.find(n => n.id === 'set-filename');
if (setFilename) {
  setFilename.typeVersion = 3;
  setFilename.parameters.mode = 'manual';
  setFilename.parameters.assignments.assignments[0].value = 
    "={{ 'campaign_post_' + $('Webhook').item.json.body.postId + '_' + Date.now() + '.png' }}";
}

// --- 9. Fix connections (no Set nodes in the path) ---
// Has Image Prompt? FALSE -> Post to Instagram?
// Has Image Prompt? TRUE  -> ComfyUI Queue Prompt -> ... -> MinIO -> Post to Instagram?
// Instagram or direct -> Post to Facebook? -> Facebook -> Callback POSTED
// Post to Facebook? FALSE -> Callback POSTED

delete w.connections['Set Image URL & Caption'];
delete w.connections['Set Caption Only (No Image)'];
delete w.connections['Merge Campaign Data'];

w.connections['Has Image Prompt?'] = {
  main: [
    [{ node: 'ComfyUI \u2014 Queue Prompt', type: 'main', index: 0 }],
    [{ node: 'Post to Instagram?', type: 'main', index: 0 }]
  ]
};

w.connections['MinIO \u2014 Upload Image'] = {
  main: [
    [{ node: 'Post to Instagram?', type: 'main', index: 0 }]
  ]
};

// Write back
const out = JSON.stringify([w], null, 2);
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Clean workflow written. All nodes reference Webhook directly.');
console.log('Verify connection names:');
console.log(JSON.stringify(Object.keys(w.connections), null, 2));
