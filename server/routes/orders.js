import { Router } from 'express';
import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all orders
router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let sql = 'SELECT * FROM orders';
  const params = [];
  
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  
  // Attach items to each order
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id)
  }));
  
  res.json(result);
});

// GET single order
router.get('/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

// GET order by order_number (for client tracking)
router.get('/track/:orderNumber', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

// POST create order
router.post('/', (req, res) => {
  const db = getDb();
  const { client_name, client_phone, event_type, event_date, event_time, delivery_address, comment, items } = req.body;
  
  if (!client_name || !client_phone || !items || !items.length) {
    return res.status(400).json({ error: 'client_name, client_phone, and items are required' });
  }
  
  // Generate unique order number
  const orderNumber = 'PAP-' + Date.now().toString(36).toUpperCase() + '-' + uuidv4().slice(0, 4).toUpperCase();
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, client_name, client_phone, event_type, event_date, event_time, delivery_address, comment, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    const result = insertOrder.run(
      orderNumber, client_name, client_phone, 
      event_type || '', event_date || '', event_time || '',
      delivery_address || '', comment || '', total
    );
    
    const orderId = result.lastInsertRowid;
    
    for (const item of items) {
      insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price);
    }
    
    return orderId;
  });
  
  try {
    const orderId = transaction();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update order status
router.put('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  const validStatuses = ['new', 'confirmed', 'cooking', 'delivering', 'done', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.id);
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

// GET order stats (for admin dashboard)
router.get('/stats/summary', (req, res) => {
  const db = getDb();
  
  const today = new Date().toISOString().split('T')[0];
  
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get();
  const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?").get(today);
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'").get(today);
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'").get();
  
  res.json({
    total_orders: totalOrders.count,
    new_orders: newOrders.count,
    today_orders: todayOrders.count,
    today_revenue: todayRevenue.total,
    total_revenue: totalRevenue.total
  });
});

export default router;
