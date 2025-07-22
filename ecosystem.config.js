// File: ecosystem.config.js
// Tempatkan file ini di direktori root proyek Anda

module.exports = {
  apps: [
    {
      name: 'polotradex', // Nama proses di PM2
      script: 'dist/server.js', // File entry point setelah di-build
      instances: 1, // Jalankan 1 instance
      autorestart: true, // Restart otomatis jika crash
      watch: false, // Jangan gunakan watch dari PM2, biarkan GitHub Actions yang handle
      max_memory_restart: '1G', // Restart jika memori melebihi 1GB
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        // PM2 akan otomatis memuat variabel dari .env,
        // jadi tidak perlu didefinisikan ulang di sini.
      },
    },
  ],
};
