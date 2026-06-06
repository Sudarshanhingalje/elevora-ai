/**
 * SET NODE MODE FIX:
 *
 * n8n Set Node version 3 requires "mode": "manual" to actually evaluate and
 * output its assignments. Otherwise, it defaults to pass-through and ignores them.
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Lock ID
w.id = 'D24qIuye3CQNnOdx';

// Loop through all nodes and ensure mode is set to manual for Set nodes
w.nodes.forEach(n => {
  if (n.type === 'n8n-nodes-base.set' && n.typeVersion === 3) {
    n.parameters = n.parameters || {};
    n.parameters.mode = 'manual';
    console.log(`Set mode='manual' on node: "${n.name}"`);
  }
});

// Write back
const out = JSON.stringify([w], null, 2);
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Set node modes updated successfully!');
