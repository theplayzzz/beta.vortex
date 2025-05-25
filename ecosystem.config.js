module.exports = {
  apps: [
    {
      name: 'vortex-app',
      script: 'pnpm',
      args: 'dev',
      cwd: '/root/Vortex/precedent',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 5,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/vortex-app.log',
      out_file: './logs/vortex-app-out.log',
      error_file: './logs/vortex-app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}; 