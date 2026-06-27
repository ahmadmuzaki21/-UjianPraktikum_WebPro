const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("=========================================");
console.log("Simpan kunci ini untuk digunakan di backend dan frontend:");
console.log("=========================================\n");

console.log("PUBLIC_KEY:", vapidKeys.publicKey);
console.log("\nPRIVATE_KEY:", vapidKeys.privateKey);

console.log("\n=========================================");
console.log("1. Tambahkan kedua key di atas ke Environment Variables Vercel (VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY)");
console.log("2. Copy PUBLIC_KEY ke dalam file public/app.js pada baris: const PUBLIC_VAPID_KEY = '...';");
