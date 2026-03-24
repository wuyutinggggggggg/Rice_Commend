import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify database connection (use existing tables)
async function initDatabase() {
  try {
    await pool.execute('SELECT 1');
    console.log('Database connection OK');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.product_id as id, p.product_name as name, p.brand,
             COALESCE(p.unit_price, p.price) as price,
             p.weight_kg as weight,
             p.variety_id as varietyId, p.origin_id as originId,
             p.product_image_url as packagingImage,
             p.param_image_url as paramImageUrl,
             cm.method_id as cookingMethodId,
             cm.method_name as methodName,
             cm.description as cookingDesc,
             cm.water_ratio as cookingRatio,
             v.variety_name as varietyName,
             v.description as varietyDesc,
             o.province, o.soil_type as soilType
      FROM rice_products p
      LEFT JOIN rice_varieties v ON p.variety_id = v.variety_id
      LEFT JOIN origins o ON p.origin_id = o.origin_id
      LEFT JOIN (
        SELECT r1.product_id, r1.method_id
        FROM rice_cooking_mapping r1
        WHERE r1.recommendation_score = (
          SELECT MAX(r2.recommendation_score)
          FROM rice_cooking_mapping r2
          WHERE r2.product_id = r1.product_id
        )
      ) best_cm ON best_cm.product_id = p.product_id
      LEFT JOIN cooking_methods cm ON best_cm.method_id = cm.method_id
    `);

    // Get taste mappings for each product
    for (let product of rows) {
      const [tastes] = await pool.execute(`
        SELECT tm.product_id as riceId, tm.taste_id as tasteId, tm.score,
               tp.taste_name as indicatorName, tp.description as tasteDesc
        FROM rice_taste_mapping tm
        JOIN taste_profiles tp ON tm.taste_id = tp.taste_id
        WHERE tm.product_id = ?
      `, [product.id]);
      product.tastes = tastes;

      const [cookings] = await pool.execute(`
        SELECT rcm.product_id as riceId, rcm.method_id as cookingId,
               rcm.recommendation_score as score,
               cmm.method_name as methodName,
               cmm.description as cookingDesc
        FROM rice_cooking_mapping rcm
        JOIN cooking_methods cmm ON rcm.method_id = cmm.method_id
        WHERE rcm.product_id = ?
      `, [product.id]);
      product.cookings = cookings;
    }

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    const paramImageUrl = product.paramImageUrl ?? (product.images && product.images.length > 1 ? product.images[1] : null);
    const productId = Number(product.id);
    const varietyId = Number(product.varietyId);
    const originId = Number(product.originId);

    if (Number.isFinite(productId)) {
      await pool.execute(`
        UPDATE rice_products
        SET product_name = ?, brand = ?, price = ?, unit_price = ?, weight_kg = ?,
            variety_id = ?, origin_id = ?, product_image_url = ?, param_image_url = ?
        WHERE product_id = ?
      `, [product.name, product.brand, product.price, product.price, product.weight,
          Number.isFinite(varietyId) ? varietyId : null,
          Number.isFinite(originId) ? originId : null,
          product.packagingImage, paramImageUrl, productId]);
    } else {
      const [result] = await pool.execute(`
        INSERT INTO rice_products (product_name, brand, price, unit_price, weight_kg, variety_id, origin_id,
                                   product_image_url, param_image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [product.name, product.brand, product.price, product.price, product.weight,
          Number.isFinite(varietyId) ? varietyId : null,
          Number.isFinite(originId) ? originId : null,
          product.packagingImage, paramImageUrl]);
      product.id = result.insertId;
    }

    // Insert taste mappings
    await pool.execute(`DELETE FROM rice_taste_mapping WHERE product_id = ?`, [product.id]);
    if (product.tastes) {
      for (let taste of product.tastes) {
        await pool.execute(`
          INSERT INTO rice_taste_mapping (product_id, taste_id, score)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE score=VALUES(score)
        `, [product.id, taste.tasteId, taste.score]);
      }
    }

    // Insert cooking mappings
    await pool.execute(`DELETE FROM rice_cooking_mapping WHERE product_id = ?`, [product.id]);
    if (product.cookings) {
      for (let cooking of product.cookings) {
        await pool.execute(`
          INSERT INTO rice_cooking_mapping (product_id, method_id, recommendation_score)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE recommendation_score=VALUES(recommendation_score)
        `, [product.id, cooking.cookingId, cooking.score]);
      }
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    const normalized = rows.map(row => ({
      ...row,
      favorites: typeof row.favorites === 'string' ? row.favorites : JSON.stringify(row.favorites || [])
    }));
    res.json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    await pool.execute(`
      INSERT INTO users (id, username, password, ip, role, status, lastActive, requestCount, favorites)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password=VALUES(password), ip=VALUES(ip), role=VALUES(role), status=VALUES(status),
        lastActive=VALUES(lastActive), requestCount=VALUES(requestCount), favorites=VALUES(favorites)
    `, [user.id, user.username, user.password, user.ip, user.role, user.status,
        user.lastActive, user.requestCount, JSON.stringify(user.favorites)]);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
