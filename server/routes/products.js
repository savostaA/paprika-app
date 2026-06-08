import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET all products (with optional category filter)
router.get('/', (req, res) => {
  const db = getDb();
  const { category_id, search, active_only } = req.query;
  
  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  const conditions = [];
  const params = [];
  
  if (active_only !== 'false') {
    conditions.push('p.is_active = 1');
  }
  if (category_id) {
    conditions.push('p.category_id = ?');
    params.push(category_id);
  }
  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY p.category_id, p.created_at DESC';
  
  const products = db.prepare(sql).all(...params);
  
  // Parse ingredients JSON
  const parsed = products.map(p => ({
    ...p,
    ingredients: p.ingredients ? JSON.parse(p.ingredients) : []
  }));
  
  res.json(parsed);
});

// GET single product
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  product.ingredients = product.ingredients ? JSON.parse(product.ingredients) : [];
  res.json(product);
});

// POST create product
router.post('/', (req, res) => {
  const db = getDb();
  const { category_id, name, description, ingredients, weight, price, image_url, calories } = req.body;
  
  if (!name || !category_id || !price) {
    return res.status(400).json({ error: 'name, category_id, and price are required' });
  }
  
  const ingredientsJson = Array.isArray(ingredients) ? JSON.stringify(ingredients) : ingredients || '[]';
  
  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, ingredients, weight, price, image_url, calories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, name, description || '', ingredientsJson, weight || '', price, image_url || '', calories || '');
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  product.ingredients = product.ingredients ? JSON.parse(product.ingredients) : [];
  res.status(201).json(product);
});

// PUT update product
router.put('/:id', (req, res) => {
  const db = getDb();
  const { category_id, name, description, ingredients, weight, price, image_url, is_active, calories } = req.body;
  
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  
  const ingredientsJson = ingredients !== undefined 
    ? (Array.isArray(ingredients) ? JSON.stringify(ingredients) : ingredients)
    : existing.ingredients;
  
  db.prepare(`
    UPDATE products SET 
      category_id = COALESCE(?, category_id),
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      ingredients = COALESCE(?, ingredients),
      weight = COALESCE(?, weight),
      price = COALESCE(?, price),
      image_url = COALESCE(?, image_url),
      is_active = COALESCE(?, is_active),
      calories = COALESCE(?, calories),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    category_id, name, description, ingredientsJson, 
    weight, price, image_url, is_active, calories,
    req.params.id
  );
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  product.ingredients = product.ingredients ? JSON.parse(product.ingredients) : [];
  res.json(product);
});

// DELETE product
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

export default router;
