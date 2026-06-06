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
  
  // Find all elements that look like a URL or reference port 80
  console.log('Searching raw data strings for URLs or hosts...');
  rawData.forEach((val, idx) => {
    if (typeof val === 'string') {
      if (val.includes('http') || val.includes('172.17') || val.includes('::1') || val.includes('localhost')) {
        console.log(`[Index ${idx}] -> "${val}"`);
      }
    }
  });

  await conn.end();
}

main().catch(console.error);
