/**
 * SAFE MERGE NODE IMPLEMENTATION:
 * 
 * 1. Inserts a pass-through Set node named "Merge Campaign Data" after the two branches.
 * 2. Connects "Set Image URL & Caption" and "Set Caption Only (No Image)" to "Merge Campaign Data".
 * 3. Connects "Merge Campaign Data" to "Post to Instagram?".
 * 4. Updates all downstream expressions to reference "Merge Campaign Data" safely.
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

// Remove "Merge Campaign Data" node if it already exists to avoid duplicates
w.nodes = w.nodes.filter(n => n.name !== 'Merge Campaign Data');

// Create the pass-through Set node
const mergeNode = {
  parameters: {
    assignments: {
      assignments: [
        {
          id: 'merge-imageUrl',
          name: 'imageUrl',
          value: '={{ $json.imageUrl || "" }}',
          type: 'string'
        },
        {
          id: 'merge-caption',
          name: 'caption',
          value: '={{ $json.caption }}',
          type: 'string'
        },
        {
          id: 'merge-platforms',
          name: 'platforms',
          value: '={{ $json.platforms }}',
          type: 'string'
        },
        {
          id: 'merge-postId',
          name: 'postId',
          value: '={{ $json.postId }}',
          type: 'number'
        },
        {
          id: 'merge-callbackUrl',
          name: 'callbackUrl',
          value: '={{ $json.callbackUrl }}',
          type: 'string'
        },
        {
          id: 'merge-callbackSecret',
          name: 'callbackSecret',
          value: '={{ $json.callbackSecret }}',
          type: 'string'
        }
      ]
    },
    options: {}
  },
  id: 'merge-campaign-data',
  name: 'Merge Campaign Data',
  type: 'n8n-nodes-base.set',
  typeVersion: 3,
  position: [1950, 480]
};

// Add to nodes list
w.nodes.push(mergeNode);

/* ── Update Downstream Expressions to use 'Merge Campaign Data' ────────── */

// 1. Post to Instagram? (IF node)
const ifInst = w.nodes.find(n => n.id === 'if-instagram');
if (ifInst) {
  ifInst.parameters.conditions.string = [
    {
      value1: "={{ $('Merge Campaign Data').item.json.platforms }}",
      operation: 'contains',
      value2: 'Instagram'
    },
    {
      value1: "={{ $('Merge Campaign Data').item.json.imageUrl }}",
      operation: 'isNotEmpty'
    }
  ];
}

// 2. Post to Facebook? (IF node)
const ifFb = w.nodes.find(n => n.id === 'if-facebook');
if (ifFb) {
  ifFb.parameters.conditions.string = [
    {
      value1: "={{ $('Merge Campaign Data').item.json.platforms }}",
      operation: 'contains',
      value2: 'Facebook'
    }
  ];
}

// 3. Facebook — Post Photo (HTTP Request node)
const fb = w.nodes.find(n => n.id === 'facebook-post');
if (fb) {
  fb.parameters.url = '=https://graph.facebook.com/v19.0/{{ $env.FACEBOOK_PAGE_ID }}/feed';
  fb.parameters.bodyParameters.parameters = [
    {
      name: 'message',
      value: "={{ $('Merge Campaign Data').item.json.caption }}"
    },
    {
      name: 'link',
      value: "={{ $('Merge Campaign Data').item.json.imageUrl || '' }}"
    },
    {
      name: 'access_token',
      value: '={{ $env.FACEBOOK_PAGE_ACCESS_TOKEN }}'
    }
  ];
}

// 4. Spring — Callback POSTED (HTTP Request node)
// Change host.docker.internal to 172.17.0.1 or keep dynamic callbackUrl
const cbOk = w.nodes.find(n => n.id === 'callback-success');
if (cbOk) {
  // Replace host.docker.internal:8080 with 172.17.0.1:8080 in callbackUrl to bypass DNS/loopback issues
  cbOk.parameters.url = "={{ $('Merge Campaign Data').item.json.callbackUrl.replace('host.docker.internal', '172.17.0.1') }}";
  cbOk.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Merge Campaign Data').item.json.callbackSecret }}"
    }
  ];
  cbOk.parameters.bodyParameters.parameters = [
    { name: 'status', value: 'POSTED' },
    {
      name: 'generatedImageUrl',
      value: "={{ $('Merge Campaign Data').item.json.imageUrl || '' }}"
    }
  ];
}

// 5. Spring — Callback FAILED (HTTP Request node)
const cbFail = w.nodes.find(n => n.id === 'callback-failed');
if (cbFail) {
  cbFail.parameters.url = "={{ $('Webhook').item.json.body.callbackUrl.replace('host.docker.internal', '172.17.0.1') }}";
  cbFail.parameters.headerParameters.parameters = [
    { name: 'Content-Type', value: 'application/json' },
    {
      name: 'X-Callback-Secret',
      value: "={{ $('Webhook').item.json.body.callbackSecret }}"
    }
  ];
}

/* ── Update Connections Map ────────── */

// Remove direct connections from Set nodes to Post to Instagram?
delete w.connections['Set Image URL & Caption'];
delete w.connections['Set Caption Only (No Image)'];

// Add new connections:
// Set Image URL & Caption -> Merge Campaign Data
w.connections['Set Image URL & Caption'] = {
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

// Set Caption Only (No Image) -> Merge Campaign Data
w.connections['Set Caption Only (No Image)'] = {
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

// Merge Campaign Data -> Post to Instagram?
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
console.log('Safe merge node and connections added successfully!');
