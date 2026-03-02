# Documentação Técnica: Notificações Locais - PsiFlow-APP

Esta documentação explica o funcionamento do sistema de notificações de lembrete de sessões.

## 1. Visão Geral

O sistema de notificações agendadas tem como objetivo alertar o psicólogo sobre as próximas sessões. Ele utiliza o pacote `expo-notifications` e funciona de forma híbrida: agendando alertas futuros e disparando alertas imediatos.

## 2. Fluxo de Agendamento

O agendamento ocorre em dois momentos principais:

1.  **No Login**: Assim que o usuário entra no app.
2.  **Na Sincronização**: Toda vez que o app sincroniza dados com o servidor (seja automático ou manual).

### 2.1. Lógica de "1 Hora Antes"

Para cada agendamento futuro retornado pelo banco de dados:

- O app calcula o horário de "1 hora antes" da sessão.
- **Se o horário de 1h antes ainda não passou**: O app agenda uma notificação para aquele momento exato.
- **Se falta menos de 1 hora para a sessão**: O app dispara uma notificação **imediata** ("Sessão em breve") se ela ainda não tiver sido enviada.

### 2.2 Janela Deslizante (Sliding Window)

Para não sobrecarregar o sistema e evitar o limite de 500 alarmes do Android/iOS, o app mantém agendados apenas os **próximos 60 compromissos**.

### 2.3 Atualização da Janela

Após qualquer sincronização (seja ela manual, automática ou no login), o app atualiza a janela cronológica de notificações:

- O sistema busca os **próximos 60 agendamentos** futuros diretamente no banco de dados local (SQLite).
- Isso garante que as notificações sejam sempre as sessões mais próximas no tempo, ignorando modificações em agendamentos muito distantes que não caberiam na janela atual.
- Notificações usam o ID do agendamento (`ag_{id}`) como identificador fixo. Isso significa que se uma consulta mudar de horário, o novo agendamento substitui o antigo automaticamente pelo ID, sem duplicar.

## 3. Prevenção de Erros e Limite de 500

O Android e iOS bloqueiam agendamentos após 500 alarmes. Para evitar isso:

1. **Limpeza Inicial**: Na primeira abertura do dia, o app limpa todas as notificações antigas registradas no sistema.
2. **Limite Fixo**: Nunca agendamos mais do que as próximas 60 sessões futuras por vez.

Para evitar que o usuário receba a mesma notificação repetidas vezes (em cada sincronia), usamos o campo `lembrete_enviado`:

- **SQLite Local**: Marcamos `lembrete_enviado = 1` no banco de dados do celular assim que o alerta é disparado.
- **MySQL Remoto**: O app envia uma requisição para a API (`POST /mobile/agendamentos/{id}/lembrete`) para que o servidor também saiba que o lembrete já foi entregue.
- **Proteção de Sincronia**: Na função `upsertAgendamentos`, o código verifica se o campo local já é `1`. Se for, ele preserva esse valor mesmo que o servidor ainda envie `0`, impedindo que a notificação soe novamente.

## 4. Fuso Horário e Precisão

A extração da data utiliza o fuso horário local do dispositivo (`getFullYear`, `getMonth`, etc.), garantindo que os agendamentos do final do dia não sejam ignorados pelo fuso UTC.

## 5. Arquivos Relevantes

- `hooks/useNotifications.ts`: Lógica central de agendamento e disparo.
- `services/database.ts`: Persistência do status do lembrete.
- `services/api.ts`: Comunicação com o servidor para atualizar o status remoto.
