import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      O JOGO FICA TELA BRANCA AO TENTAR ENTRAR POR FAVOR DCORRIGIR PROBLEMA.
    </div>
  ),
})

