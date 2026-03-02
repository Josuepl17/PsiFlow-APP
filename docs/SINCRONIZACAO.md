# Documentação Técnica: Sincronização de Dados - PsiFlow-APP

Este documento detalha como o PsiFlow-APP mantém os dados locais (SQLite) em sincronia com o servidor Laravel (MySQL).

## 1. Arquitetura "Offline-First"

O aplicativo foi projetado para funcionar mesmo sem internet. Os dados são lidos sempre do **SQLite local** para garantir rapidez, e sincronizados com o servidor em momentos estratégicos.

## 2. Processo de Sincronização (`sincronizar`)

A função de sincronia (`services/sync.ts`) realiza os seguintes passos:

1.  **Throttle**: Evita múltiplas requisições seguidas (padrão de 5 segundos) se não for um "force sync".
2.  **Sincronização Incremental (`since`)**: O app envia o timestamp da última sincronia bem-sucedida para o servidor. O servidor então retorna apenas os registros criados ou alterados após esse momento.
3.  **Uso do Server Time**: O app utiliza o horário fornecido pelo servidor no retorno da API para marcar a próxima sincronia. Isso evita problemas causados por relógios desajustados nos celulares dos usuários.
4.  **Batch Processing (Transações)**: O salvamento dos dados no SQLite utiliza transações (`withTransactionAsync`). Isso permite gravar centenas de registros em milissegundos, em vez de um por um.
5.  **Notificar UI**: Ao finalizar, dispara o evento global `"sync-finished"`.

## 3. Quando a Sincronização Ocorre (Gatilhos)

A busca de novos dados no servidor acontece nestes momentos:

- **Ao Abrir o App (Sincronia Global)**: O sistema verifica atualizações automaticamente toda vez que o app é iniciado ou quando o usuário acaba de fazer login (via `useAutoSync`).
- **Manualmente**: Quando você clica no botão de sincronizar ou "puxa" a lista para baixo (Swipe to Refresh).

## 4. Como a Tela se Atualiza (Mecanismo Reativo)

Para que você veja os dados novos sem precisar sair e voltar da tela, usamos um sistema de eventos:

1. A sincronização termina e salva os dados no banco local (SQLite).
2. O app dispara um aviso interno: `"sync-finished"`.
3. A tela de agendamentos "ouve" esse aviso e recarrega a lista automaticamente na sua frente.

A função `upsertAgendamentos` no banco de dados local tem um papel crítico:

- Ela garante que dados importantes gerados no celular (como o status de que um lembrete de notificação já foi mostrado) não sejam apagados por uma resposta do servidor que ainda esteja desatualizada.
- Utiliza blocos de transação para máxima performance de escrita.

## 5. Tabela de Sincronização

O app utiliza a tabela `sincronizacao` para persistir os carimbos de tempo por módulo:

- `modulo`: Nome da área (ex: 'agendamentos', 'pacientes').
- `ultima_sync`: O timestamp recebido do servidor.

## 6. Arquivos Relevantes

- `services/sync.ts`: Fluxo principal da sincronização.
- `services/database.ts`: Funções de leitura e escrita no SQLite.
- `hooks/useAutoSync.ts`: Gatilho de abertura do aplicativo.
- `app/(app)/agendamentos/index.tsx`: Reatividade da UI pós-sincronia.
