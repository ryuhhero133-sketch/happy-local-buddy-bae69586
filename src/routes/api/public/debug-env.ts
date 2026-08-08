import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/debug-env')({
  server: {
    handlers: {
      GET: async () => {
        const adminKey = process.env['ADMIN_SB_KEY'];
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
        const url = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
        
        return new Response(JSON.stringify({
          runtime: typeof (globalThis as any).EdgeRuntime !== 'undefined' ? 'Edge' : 'Node/Bun',
          ADMIN_SB_KEY: adminKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
          SUPABASE_SERVICE_ROLE_KEY: serviceKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
          SUPABASE_URL: url ? 'CONFIGURED' : 'NOT_CONFIGURED',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
})
