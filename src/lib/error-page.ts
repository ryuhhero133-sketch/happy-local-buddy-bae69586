export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Servidor em Manutenção</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { 
        font: 15px/1.5 system-ui, -apple-system, sans-serif; 
        background: radial-gradient(ellipse at top, #3a0a0f 0%, #1a0306 60%, #000 100%);
        color: #fecaca; 
        display: grid; 
        place-items: center; 
        min-height: 100vh; 
        margin: 0; 
        padding: 1.5rem; 
      }
      .card { 
        max-width: 28rem; 
        width: 100%; 
        text-align: center; 
        padding: 2rem; 
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid #7f1d1d;
        border-radius: 10px;
        backdrop-filter: blur(8px);
      }
      h1 { 
        font-size: 1.5rem; 
        margin: 0 0 1rem; 
        color: #fef2f2;
        text-shadow: 2px 2px 0 #7f1d1d;
      }
      p { 
        color: #fca5a5; 
        margin: 0 0 1.5rem; 
      }
      .actions { 
        display: flex; 
        gap: 0.5rem; 
        justify-content: center; 
        flex-wrap: wrap; 
      }
      button { 
        padding: 0.75rem 1.5rem; 
        border-radius: 0.375rem; 
        font-weight: bold;
        cursor: pointer; 
        border: 2px solid #450a0a;
        background: linear-gradient(180deg, #dc2626, #7f1d1d);
        color: #fff5f5;
        transition: transform 0.1s;
      }
      button:active {
        transform: scale(0.95);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>SISTEMA EM MANUTENÇÃO</h1>
      <p>Estamos realizando melhorias no servidor. Por favor, tente novamente em alguns instantes ou recarregue a página.</p>
      <div class="actions">
        <button onclick="location.reload()">RECARREGAR</button>
      </div>
    </div>
  </body>
</html>`;
}
