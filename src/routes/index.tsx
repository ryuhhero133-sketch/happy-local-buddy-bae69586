import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      estao invadindo o chat do jogo... pórfavor proteja o chat do jogo e coloqe uma msg tem dev sim aqui .. e coloquye algo pra eles n subestimar nos AGORA PROJETE NOSSO JOGO
    </div>
  ),
})