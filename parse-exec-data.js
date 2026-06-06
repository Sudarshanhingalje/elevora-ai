const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'elevora_app',
    password: 'Sudu@1308',
    database: 'elevora_ai'
  });

  const [rows] = await conn.execute('SELECT data FROM execution_data WHERE executionId = 11');
  if (rows.length === 0) {
    console.log('No data found for execution 9');
    await conn.end();
    return;
  }

  const rawData = JSON.parse(rows[0].data);
  
  // Let's resolve the flatted n8n execution data structure
  // In flatted format, rawData[0] is the root object.
  // Properties of objects are represented by indexes in the array.
  
  function resolve(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return val.map(resolve);
      }
      const res = {};
      for (const k in val) {
        res[k] = resolve(rawData[val[k]]);
      }
      return res;
    }
    // If it's a string index or number
    if (typeof val === 'string' && !isNaN(val)) {
      const idx = parseInt(val, 10);
      if (idx >= 0 && idx < rawData.length) {
        return resolve(rawData[idx]);
      }
    }
    return val;
  }

  // Let's find all node execution results
  const root = rawData[0];
  console.log('Root keys:', Object.keys(root));
  
  // In flatted structure:
  // resultData -> runData -> nodeName -> list of execution runs
  // Let's find runData:
  const resultDataIdx = root.resultData;
  const resultData = rawData[resultDataIdx];
  const runDataIdx = resultData.runData;
  const runData = rawData[runDataIdx];
  
  console.log('Executed Nodes:');
  for (const nodeName in runData) {
    const runsIdx = runData[nodeName];
    const runs = rawData[runsIdx];
    console.log(`\n--- Node: ${nodeName} ---`);
    
    // Each run represents a run index
    const runList = Array.isArray(runs) ? runs : [runs];
    for (let rIdx = 0; rIdx < runList.length; rIdx++) {
      const run = rawData[runList[rIdx]];
      if (!run) continue;
      
      const errorIdx = run.error;
      const error = errorIdx ? rawData[errorIdx] : null;
      if (error) {
        console.log(`  Run ${rIdx} Error:`, error.message || error);
        if (error.stack) console.log(`  Stack:`, error.stack);
      } else {
        console.log(`  Run ${rIdx} Success`);
      }
    }
  }

  await conn.end();
}

main().catch(console.error);
