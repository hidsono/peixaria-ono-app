const { Client } = require('pg');
const connectionString = "postgresql://postgres.vfkazzsypmapcsjtdvyz:HideoOno2026@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Expense' AND column_name = 'quantity'
    `);
    
    if (res.rows.length === 0) {
      console.log('Adding quantity column to Expense table...');
      await client.query('ALTER TABLE "Expense" ADD COLUMN "quantity" DOUBLE PRECISION');
      console.log('Column added successfully');
    } else {
      console.log('Column quantity already exists');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
