# Plano de Correção e Melhoria do Continente 4

O objetivo deste plano é garantir que os 3 mapas do Continente 4 (Parte A, B e C) estejam com as imagens corretas fornecidas pelo usuário e que todos sejam acessíveis diretamente através do Mapa Mundi após a inserção do PIN (333).

## Alterações Técnicas

### 1. Atualização de Assets
- Atualizar `src/assets/continent-4-map-v6.png.asset.json` com o link da imagem `mnmnmn.png`.
- Atualizar `src/assets/continent-4-map-v7.png.asset.json` com o link da imagem `mnmn.png`.
- Garantir que `src/assets/continent-4-map-part-c.png.asset.json` esteja com o link correto de `sdfggdf.png` (já verificado).

### 2. Interface do Mapa Mundi (src/routes/idle.tsx)
- Adicionar a Parte C (`continente_4_c`) à lista de pins do Continente 4 no Mapa Mundi.
- Modificar a lógica de clique nos pins do Continente 4 para permitir o acesso direto a qualquer uma das partes (A, B ou C) após a validação do PIN.

### 3. Sistema de Portais (src/routes/idle.tsx)
- Verificar e ajustar as coordenadas dos portais entre as partes para garantir fluidez no movimento manual.

## Detalhes para o Usuário
- As imagens das Partes A e B foram atualizadas conforme os novos anexos.
- O Mapa Mundi agora mostra a Parte C, permitindo viajar direto para lá.
- O PIN 333 continua sendo necessário para abrir os mapas secretos.
