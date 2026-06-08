import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET all categories
router.get('/', (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    'SELECT * FROM categories ORDER BY sort_order ASC'
  ).all();
  res.json(categories);
});

// GET single category
router.get('/:id', (req, res) => {
  const db = getDb();
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

// POST create category
router.post('/', (req, res) => {
  const db = getDb();
  const { name, slug, icon, sort_order } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
  
  try {
    const result = db.prepare(
      'INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)'
    ).run(name, slug, icon || '🍽️', sort_order || 0);
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT update category
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, slug, icon, sort_order } = req.body;
  
  db.prepare(
    'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order) WHERE id = ?'
  ).run(name, slug, icon, sort_order, req.params.id);
  
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

// DELETE category
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ success: true });
});

export default router;
