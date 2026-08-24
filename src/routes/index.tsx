import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#fff0f0', border: '2px solid red' }}>
      {`ta tudo no seu json, o que eu fiz foi coletar todos os cod reverso js pra modificar o stats client side

❤️

Clique para reagir

✅

Clique para reagir

🙏

Clique para reagir

Adicionar reação

Responder

Encaminhar

Mais

[18:32]segunda-feira, 3 de agosto de 2026 18:32

teu api check valida depois da info modificada`}
    </div>
  ),
})
