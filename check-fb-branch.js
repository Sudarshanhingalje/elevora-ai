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
    console.log('No data found for execution 11');
    await conn.end();
    return;
  }

  const rawData = JSON.parse(rows[0].data);
  const visited = new Set();
  
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
    if (typeof val === 'string' && !isNaN(val)) {
      const idx = parseInt(val, 10);
      if (idx >= 0 && idx < rawData.length) {
        if (visited.has(idx)) {
          return `[Circular Index ${idx}]`;
        }
        visited.add(idx);
        const res = resolve(rawData[idx]);
        visited.delete(idx);
        return res;
      }
    }
    return val;
  }

  const root = rawData[0];
  const resultData = rawData[root.resultData];
  const runData = rawData[resultData.runData];
  
  const node = runData['Set Caption Only (No Image)'];
  const runs = rawData[node];
  const run = rawData[runs];
  
  console.log('--- Resolved Run Data for Set Caption ---');
  console.log(JSON.stringify(resolve(run), null, 2));

  await conn.end();
}

main().catch(console.error);
