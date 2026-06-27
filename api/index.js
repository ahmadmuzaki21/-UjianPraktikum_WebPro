const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

// Konfigurasi VAPID untuk Push Notifications
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_VAPID_KEY_HERE';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_VAPID_KEY_HERE';

try {
  webpush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);
} catch (e) {
  console.warn("Kunci VAPID belum dikonfigurasi dengan benar.");
}

// In-memory store untuk subscription push notif (Untuk produksi skala besar, simpan ini di Database)
let subscriptions = [];

// CRUD Routes untuk Tugas (Tasks)

// CREATE
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Judul tugas diperlukan' });
        }
        const newTask = await db.createTask(title, description);
        
        // Kirim push notification ke semua subscriber
        const payload = JSON.stringify({ 
            title: 'Tugas Baru Ditambahkan!', 
            body: `Tugas: ${title}` 
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error("Push Error", err));
        });
        
        res.status(201).json(newTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal membuat tugas' });
    }
});

// READ
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await db.getTasks();
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil data tugas' });
    }
});

// UPDATE
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, is_completed } = req.body;
        const updatedTask = await db.updateTask(id, title, description, is_completed);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memperbarui tugas' });
    }
});

// DELETE
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.deleteTask(id);
        res.json({ message: 'Tugas berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menghapus tugas' });
    }
});

// Rute Subscription Push Notification
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
});

// Rute Inisialisasi Database (Hanya dijalankan sekali di awal)
app.get('/api/init-db', async (req, res) => {
    try {
        await db.initDB();
        res.send("Tabel Database berhasil diinisialisasi!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Gagal inisialisasi: " + error.message);
    }
});

module.exports = app;
