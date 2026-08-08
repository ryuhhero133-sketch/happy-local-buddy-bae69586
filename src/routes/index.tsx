// ENVIE O SQL
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
    title: 'IdleMon Admin | V44 Sync Authority',
    meta: [
      { name: 'description', content: 'Painel de Controle e Diagnóstico de Autoridade Server-Side' },
      { property: 'og:title', content: 'IdleMon Admin | V44 Sync Authority' },
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
      // TESTE REAL: Nível 46 -> 47 para o usuário "Stinguer" (5bc35452-d64b-4895-83b1-c804dc3e30bb)
      // Ajustado para bater com o schema z.object de admin-bridge.functions.ts
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
          <p className="text-slate-400">Versão V44 - Edge Function Migration & Validation</p>
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
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start border-slate-700 hover:bg-slate-800"
                  onClick={() => window.open('https://supabase.com/dashboard/project/kgrspvqhpgiuxvkcxgcp/functions', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Ver no Painel Supabase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert className="bg-blue-950/30 border-blue-900">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-300 font-bold uppercase">Teste de Integração Obrigatório</AlertTitle>
          <AlertDescription className="text-blue-200/70">
            Para validar a V44, você DEVE confirmar que a Edge Function foi implantada com sucesso no Supabase.
            O teste abaixo tentará atualizar o usuário <strong>Stinguer</strong> do nível 46 para o 47 via Edge Function.
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
            <div className="p-4 bg-red-950/30 border border-red-900 rounded-lg w-full">
              <p className="text-red-400 text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> FALHA NO BACKEND
              </p>
              <p className="text-red-300/80 text-xs mt-1 font-mono break-all">{errorMessage}</p>
              <div className="mt-3 text-[10px] text-red-200/60 leading-relaxed">
                <strong>DIAGNÓSTICO:</strong> A Edge Function 'admin-update-player' não foi encontrada no seu projeto Supabase. Certifique-se de realizar o deploy da função no painel do Supabase.  ME MANDE O SQL RESOLVENDFO<br/>
                <strong>CORREÇÃO:</strong> Execute no terminal: <code>supabase functions deploy admin-update-player --project-ref kgrspvqhpgiuxvkcxgcp</code>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-xs text-slate-600 pt-8">
          IdleMon Authority System &copy; 2024 | Secure Admin Protocol
        </footer>
      </div>
    </div>
  );
}
