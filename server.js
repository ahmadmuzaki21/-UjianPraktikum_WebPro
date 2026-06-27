require('dotenv').config();
const express = require('express');
const path = require('path');
const apiApp = require('./api/index'); // Mengimpor serverless function

const app = express();
const PORT = process.env.PORT || 3000;

// Menyajikan file statis (Frontend) dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Memasang (mount) rute API di bawah path '/' 
// Karena di dalam api/index.js sudah didefinisikan sebagai '/api/...'
app.use('/', apiApp);

app.listen(PORT, () => {
    console.log(`Server berjalan lokal di http://localhost:${PORT}`);
});
