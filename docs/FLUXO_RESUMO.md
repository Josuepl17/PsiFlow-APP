# Resumo de Funcionamento: Sincronização e Notificações

Este documento explica de forma simples o que o aplicativo faz em cada situação.

---

### 1. Abrir o App pela Primeira Vez (Login)

Quando você entra no app pela primeira vez (ou faz login):

1.  **Sincronização Total**: O app baixa todos os seus agendamentos e pacientes do servidor.
2.  **Gravação Local**: Todos os dados são salvos no banco de dados do seu celular (SQLite).
3.  **Marcar Horário**: O app guarda o horário exato que essa sincronia aconteceu.
4.  **Agendar Alertas**: O app limpa qualquer alerta antigo e agenda notificações para as próximas 60 sessões.

---

### 2. Abrir o App Novamente (Estava fechado)

Quando você fecha o app por completo e abre ele de novo:

1.  **Sincronização Incremental**: O app pergunta ao servidor: "O que mudou desde a minha última visita?".
2.  **Baixar Novidades**: Ele baixa apenas o que foi criado ou alterado recentemente.
3.  **Atualizar Banco**: Ele grava essas mudanças no banco de dados do celular.
4.  **Refrescar Janela**: O app recalcula as notificações para garantir que as 60 sessões mais próximas estejam agendadas.

---

### 3. Clicar no Botão de Sincronizar (Manual)

Quando você está com o app aberto e clica no botão de sincronia (ou puxa a lista para baixo):

1.  **Busca Imediata**: O app força uma busca por novidades no servidor naquele momento.
2.  **Atualização de Dados**: Se houver algo novo, ele atualiza a sua lista na tela imediatamente.
3.  **Atualizar Alertas**: Ele garante que os lembretes do celular estejam sincronizados com os novos horários.

---

### 4. Por que fazemos assim?

- **Velocidade**: O app lê os dados do seu celular, por isso ele abre rápido.
- **Bateria e Dados**: Sincronizar apenas "o que mudou" economiza sua internet e bateria.
- **Organização**: Manter apenas as próximas 60 sessões agendadas evita que o celular fique lento ou bloqueie os alertas.
