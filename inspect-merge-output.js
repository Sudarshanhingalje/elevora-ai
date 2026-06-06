const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'elevora_app',
    password: 'Sudu@1308',
    database: 'elevora_ai'
  });

  const [rows] = await conn.execute('SELECT data FROM execution_data WHERE executionId = 13');
  if (rows.length === 0) {
    console.log('No data found for execution 11');
    await conn.end();
    return;
  }

  const rawData = JSON.parse(rows[0].data);
  
  // Find "Merge Campaign Data" run data
  // resultData -> runData -> "Merge Campaign Data" -> run -> data -> main -> [output]
  const root = rawData[0];
  const resultData = rawData[root.resultData];
  const runData = rawData[resultData.runData];
  
  const node = runData['Merge Campaign Data'];
  const runs = rawData[node];
  const run = rawData[runs];
  
  console.log('Merge Campaign Data run object:', Object.keys(run));
  if (run.data) {
    const dataObj = rawData[run.data];
    if (dataObj.main) {
      const mainBranches = rawData[dataObj.main];
      const items = rawData[mainBranches[0]]; // list of output items
      const item = rawData[items[0]]; // first item
      console.log('Merge Campaign Data output item keys:', Object.keys(item));
      if (item.json) {
        const json = rawData[item.json];
        console.log('json keys:', Object.keys(json));
        for (const k in json) {
          console.log(`  ${k}: "${rawData[json[k]]}"`);
        }
      }
    }
  }

  await conn.end();
}

main().catch(console.error);
