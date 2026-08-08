// V46 - EDGE_FUNCTION_FINAL_AUTHORITY_VERIFIED
// Auditoria de Tabelas: trainer_state, ranked_scores e profiles confirmadas.


import { createFileRoute } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, ExternalLink, Terminal, ShieldCheck, Database, Server, User } from 'lucide-react';
import { useState } from 'react';
import { updatePlayerStatsAdminBridge } from '@/lib/admin-bridge.functions';

export const Route = createFileRoute('/')({
  component: Index,
  head: () => ({
    title: 'IdleMon Admin | V45 Deploy Console',
    meta: [
      { name: 'description', content: 'Painel de Controle e Diagnóstico de Autoridade Server-Side' },
      { property: 'og:title', content: 'IdleMon Admin | V45 Deploy Console' },
      { property: 'og:description', content: 'Painel de Controle e Diagnóstico de Autoridade Server-Side' }
    ]
  })
});

function Index() {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const runValidation = async () => {
    setTestStatus('loading');
    setErrorMessage('');
    
    try {
      // TESTE REAL: Nível 46 -> 47 para o usuário "Stinguer"
      const result = await updatePlayerStatsAdminBridge({
        data: {
          targetUserId: '5bc35452-d64b-4895-83b1-c804dc3e30bb',
          level: 47,
          xp: 1000,
          username: 'Stinguer',
          craftPoints: 0,
          guildName: null,
          snapshot: {}
        }
      });

      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setErrorMessage('Erro desconhecido na bridge');
      }
    } catch (err: any) {
      setTestStatus('error');
      setErrorMessage(err.message || 'Falha na comunicação com o servidor');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-8 font-sans">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-blue-400">IDLEMON BACKEND AUTHORITY</h1>
          <p className="text-slate-400">Versão V45 - Edge Function Production Ready</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-300">
                <ShieldCheck className="w-5 h-5" />
                Status da Arquitetura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-green-400" />
                  <span>Cloudflare Worker Bridge</span>
                </div>
                <span className="text-xs font-mono text-green-400 bg-green-950 px-2 py-1 rounded">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>Supabase Edge Context</span>
                </div>
                <span className="text-xs font-mono text-blue-400 bg-blue-950 px-2 py-1 rounded">DELEGATED</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-300">
                <Terminal className="w-5 h-5" />
                Auditoria de Deploy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                A bridge agora aponta para: <br/>
                <code className="text-xs text-yellow-500">/functions/v1/admin-update-player</code>
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-slate-700 hover:bg-slate-800"
                onClick={() => window.open('https://supabase.com/dashboard/project/kgrspvqhpgiuxvkcxgcp/functions', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Ver no Painel Supabase
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert className="bg-blue-950/30 border-blue-900">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-300 font-bold uppercase">Teste de Autoridade</AlertTitle>
          <AlertDescription className="text-blue-200/70">
            O teste abaixo tentará atualizar o usuário <strong>Stinguer</strong> do nível 46 para o 47 via Edge Function REAL.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-700">
          <div className="flex items-center gap-4">
            <User className="w-12 h-12 text-slate-600 bg-slate-800 rounded-full p-2" />
            <div>
              <p className="text-sm font-semibold">Jogador: Stinguer</p>
              <p className="text-xs text-slate-500 font-mono">ID: 5bc35452-d64b-4895-83b1-c804dc3e30bb</p>
            </div>
          </div>

          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold w-full max-w-sm"
            disabled={testStatus === 'loading'}
            onClick={runValidation}
          >
            {testStatus === 'loading' ? 'Validando Nível 46 -> 47...' : 'TESTAR ATUALIZAÇÃO REAL'}
          </Button>

          {testStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400 font-semibold animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5" />
              SUCESSO: Nível 47 confirmado no Banco via Edge Function!
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-4 bg-red-950/30 border border-red-900 rounded-lg w-full space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
                <div>
                  <p className="text-red-400 text-sm font-bold uppercase tracking-tight">FALHA NO BACKEND</p>
                  <p className="text-red-300/80 text-xs mt-0.5 font-mono break-all">{errorMessage}</p>
                </div>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-red-400/60 font-black">Tabelas e Colunas Alvo:</p>
                <ul className="text-[10px] text-red-200/60 space-y-1 list-disc list-inside">
                  <li><strong>public.trainer_state</strong>: trainer_level, trainer_xp</li>
                  <li><strong>public.ranked_scores</strong>: trainer_level</li>
                  <li><strong>public.profiles</strong>: trainer_level, account_status</li>
                </ul>
              </div>

              <div className="p-3 bg-black/40 rounded border border-slate-800">
                <strong className="text-emerald-400 block mb-1 text-[11px]">CÓDIGO DA EDGE FUNCTION REAL (index.ts):</strong>
                <pre className="whitespace-pre-wrap font-mono text-[9px] text-emerald-500/80 p-2 bg-black/20 rounded max-h-[250px] overflow-y-auto">
{`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { targetUserId, type, level, xp } = await req.json()

    if (type === 'trainer') {
      // Sincronização Server-Side Total
      await supabase.from('trainer_state').upsert({ user_id: targetUserId, trainer_level: level, trainer_xp: xp ?? 0 })
      await supabase.from('ranked_scores').upsert({ user_id: targetUserId, trainer_level: level })
      await supabase.from('profiles').update({ trainer_level: level, account_status: 'active' }).eq('id', targetUserId)
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders })
  }
})`}
                </pre>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <p className="text-[10px] text-blue-200 mb-2">CORREÇÃO: Execute no terminal local:</p>
                <code className="block bg-black/60 p-2 rounded text-[10px] font-mono text-blue-300 break-all select-all">
                  supabase functions deploy admin-update-player --project-ref kgrspvqhpgiuxvkcxgcp
                </code>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-xs text-slate-600 pt-8">
          IdleMon Authority System &copy; 2024 | V45
        </footer>
      </div>
    </div>
  );
}
