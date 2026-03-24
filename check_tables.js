import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('检查origins表结构:');
  const [origins] = await conn.execute('DESCRIBE origins');
  origins.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  console.log('\n检查cooking_methods表结构:');
  const [cooking] = await conn.execute('DESCRIBE cooking_methods');
  cooking.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  console.log('\n检查taste_profiles表结构:');
  const [tasteProfiles] = await conn.execute('DESCRIBE taste_profiles');
  tasteProfiles.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  console.log('\n检查rice_products表结构:');
  const [products] = await conn.execute('DESCRIBE rice_products');
  products.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  console.log('\n检查rice_taste_mapping表结构:');
  const [tasteMapping] = await conn.execute('DESCRIBE rice_taste_mapping');
  tasteMapping.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  console.log('\n检查rice_cooking_mapping表结构:');
  const [cookingMapping] = await conn.execute('DESCRIBE rice_cooking_mapping');
  cookingMapping.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));

  await conn.end();
}

checkTables();