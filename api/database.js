const { Pool } = require('pg');

// Gunakan koneksi string dari environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Diperlukan untuk sebagian besar cloud database seperti Supabase/Neon
  }
});

async function initDB() {
    const query = `
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

async function getTasks() {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
}

async function createTask(title, description) {
    const result = await pool.query(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
        [title, description]
    );
    return result.rows[0];
}

async function updateTask(id, title, description, is_completed) {
    const result = await pool.query(
        'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), is_completed = COALESCE($3, is_completed) WHERE id = $4 RETURNING *',
        [title, description, is_completed, id]
    );
    return result.rows[0];
}

async function deleteTask(id) {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

module.exports = {
    initDB,
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
