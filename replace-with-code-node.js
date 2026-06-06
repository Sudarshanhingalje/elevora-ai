/**
 * REPLACE SET NODES WITH A SINGLE CODE NODE:
 *
 * Deletes:
 *   - "Set Image URL & Caption"
 *   - "Set Caption Only (No Image)"
 *   - "Merge Campaign Data" (Set node)
 *
 * Inserts:
 *   - "Merge Campaign Data" (Code node) which runs pure JS to merge branches safely.
 *
 * Rewires connections.
 */
const fs = require('fs');
const raw = fs.readFileSync('n8n-workflows/elevora_campaign_publisher.json', 'utf8');
const arr = JSON.parse(raw);
const w = Array.isArray(arr) ? arr[0] : arr;

// Lock ID
w.id = 'D24qIuye3CQNnOdx';

// Clean up settings
delete w.settings.errorWorkflow;

// Filter out old Set nodes
w.nodes = w.nodes.filter(n => 
  n.name !== 'Set Image URL & Caption' &&
  n.name !== 'Set Caption Only (No Image)' &&
  n.name !== 'Merge Campaign Data'
);

// Create the new Code node
const codeNode = {
  parameters: {
    jsCode: `
let imageUrl = "";
try {
  // Check if Set Filename was executed
  const filename = $('Set Filename').item.json.filename;
  imageUrl = \`\${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/\${process.env.MINIO_BUCKET || 'elevora-assets'}/campaign-images/\${filename}\`;
} catch (e) {
  imageUrl = "";
}

const webhook = $('Webhook').item.json.body;
return {
  imageUrl: imageUrl,
  caption: webhook.content + '\\n\\n' + (webhook.hashtags || ''),
  platforms: webhook.platforms,
  postId: Number(webhook.postId),
  callbackUrl: webhook.callbackUrl,
  callbackSecret: webhook.callbackSecret
};
`
  },
  id: 'merge-campaign-data-code',
  name: 'Merge Campaign Data',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1950, 480]
};

// Add Code node to nodes list
w.nodes.push(codeNode);

/* ── Rewire Connections Map ────────────────────────────────────────────── */

// Remove old connections
delete w.connections['Set Image URL & Caption'];
delete w.connections['Set Caption Only (No Image)'];
delete w.connections['Merge Campaign Data'];

// Update MinIO -> Merge Campaign Data
w.connections['MinIO — Upload Image'] = {
  main: [
    [
      {
        node: 'Merge Campaign Data',
        type: 'main',
        index: 0
      }
    ]
  ]
};

// Update Has Image Prompt? -> Merge Campaign Data (on the False branch)
w.connections['Has Image Prompt?'] = {
  main: [
    [
      {
        node: 'ComfyUI — Queue Prompt',
        type: 'main',
        index: 0
      }
    ],
    [
      {
        node: 'Merge Campaign Data',
        type: 'main',
        index: 0
      }
    ]
  ]
};

// Update Merge Campaign Data -> Post to Instagram?
w.connections['Merge Campaign Data'] = {
  main: [
    [
      {
        node: 'Post to Instagram?',
        type: 'main',
        index: 0
      }
    ]
  ]
};

// Write back
const out = JSON.stringify([w], null, 2);
fs.writeFileSync('n8n-workflows/elevora_campaign_publisher.json', out);
console.log('Workflow updated: replaced Set nodes with a single Code node!');
