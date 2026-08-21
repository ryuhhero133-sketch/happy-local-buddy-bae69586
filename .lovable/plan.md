# Plano: Modo Noturno no Painel do Treinador

Implementar a funcionalidade de alternar entre o modo claro (normal) e escuro (noturno) especificamente para o painel de status do treinador, atendendo à solicitação do usuário para melhor visibilidade.

## Alterações

### Frontend
- **Adição de Estado**: Criar o estado `trainerTheme` (com valores "light" ou "dark") no componente `Idle` em `src/routes/idle.tsx`.
- **Persistência**: Salvar a preferência do tema no `localStorage` para que a escolha seja mantida após recarregar a página.
- **Interface de Alternância**: Adicionar um botão discreto (ícone de Lua/Sol) no cabeçalho do painel "STATUS DO TREINADOR" para trocar o tema.
- **Estilização Dinâmica**:
  - Ajustar o background do painel principal (hoje gradiente escuro fixo).
  - Ajustar as cores de texto e bordas dos cards de estatísticas (`Account Stats Panel` e `RPG Stats Dashboard`).
  - Garantir que no "Modo Normal" (Claro) a visibilidade seja otimizada com contrastes adequados.

## Detalhes Técnicos
- O tema afetará apenas o container do painel de equipamentos e status.
- Uso de `rgba` dinâmico baseado no estado `trainerTheme`.
- Ícones da Lucide (`Moon`, `Sun`) para o botão de toggle.
