# Estrutura do Banco de Dados Local (SQLite)

Este documento detalha as tabelas e colunas utilizadas no banco de dados local do PsiFlow-APP. O banco é inicializado automaticamente no primeiro acesso.

---

## 1. Tabela: `users`

Armazena as informações do psicólogo logado. É um espelho da tabela do servidor Laravel.

| Coluna            | Tipo    | Descrição                          |
| :---------------- | :------ | :--------------------------------- |
| `id`              | INTEGER | ID único (Primary Key)             |
| `clinica_id`      | INTEGER | ID da clínica vinculada            |
| `nome`            | TEXT    | Nome completo do usuário           |
| `foto`            | TEXT    | URL ou caminho da foto de perfil   |
| `estado`          | TEXT    | Estado (UF)                        |
| `email`           | TEXT    | E-mail (Unique)                    |
| `cpf`             | TEXT    | CPF (Unique)                       |
| `cargo`           | TEXT    | Cargo ocupado                      |
| `crp`             | TEXT    | Registro Profissional (Unique)     |
| `telefone`        | TEXT    | Telefone de contato                |
| `endereco`        | TEXT    | Endereço completo                  |
| `bairro`          | TEXT    | Bairro                             |
| `cidade`          | TEXT    | Cidade                             |
| `genero`          | TEXT    | Gênero                             |
| `status`          | TEXT    | Status da conta (Default: 'ativo') |
| `primeiro_acesso` | TEXT    | Flag de primeiro acesso ('S'/'N')  |
| `remember_token`  | TEXT    | Token de sessão                    |
| `created_at`      | TEXT    | Data de criação                    |
| `updated_at`      | TEXT    | Data de atualização                |

---

## 2. Tabela: `pacientes`

Armazena os dados dos pacientes atendidos.

| Coluna                 | Tipo    | Descrição                       |
| :--------------------- | :------ | :------------------------------ |
| `id`                   | INTEGER | ID único (Primary Key)          |
| `nome`                 | TEXT    | Nome completo do paciente       |
| `cpf`                  | TEXT    | CPF (Unique)                    |
| `telefone`             | TEXT    | Telefone de contato             |
| `data_nascimento`      | TEXT    | Data de nascimento              |
| `genero`               | TEXT    | Gênero                          |
| `endereco`             | TEXT    | Endereço                        |
| `bairro`               | TEXT    | Bairro                          |
| `cidade`               | TEXT    | Cidade                          |
| `nome_responsavel`     | TEXT    | Nome do responsável (se houver) |
| `telefone_responsavel` | TEXT    | Telefone do responsável         |
| `status`               | TEXT    | Status (Default: 'ativo')       |
| `created_at`           | TEXT    | Data de criação                 |
| `updated_at`           | TEXT    | Data de atualização             |

---

## 3. Tabela: `agendamentos`

Tabela principal que armazena as sessões e compromissos.

| Coluna                | Tipo    | Descrição                                 |
| :-------------------- | :------ | :---------------------------------------- |
| `id`                  | INTEGER | ID único (Primary Key)                    |
| `clinica_id`          | INTEGER | ID da clínica                             |
| `paciente_id`         | INTEGER | ID do paciente                            |
| `psicologo_id`        | INTEGER | ID do psicólogo                           |
| `recorrente_id`       | INTEGER | ID do grupo de sessões recorrentes        |
| `data`                | TEXT    | Data da sessão (YYYY-MM-DD)               |
| `hora_inicial`        | TEXT    | Horário de início (HH:MM:SS)              |
| `hora_final`          | TEXT    | Horário de término                        |
| `tipo`                | TEXT    | Tipo ('unico' ou 'recorrente')            |
| `recorrente_ate_date` | TEXT    | Data limite da recorrência                |
| `nome_paciente`       | TEXT    | Nome do paciente (Cache para performance) |
| `nome_psicologo`      | TEXT    | Nome do psicólogo                         |
| `status`              | TEXT    | Status (Agendado, Concluido, Falta, etc)  |
| `lembrete_enviado`    | INTEGER | Controle de notificação (0: Não, 1: Sim)  |
| `observacao`          | TEXT    | Notas e observações da sessão             |
| `created_at`          | TEXT    | Data de criação                           |
| `updated_at`          | TEXT    | Data de atualização                       |

---

## 4. Tabela de Controle: `sincronizacao`

Controla o momento da última sincronização incremental por tabela baseada no horário do servidor.

| Coluna        | Tipo    | Descrição                                   |
| :------------ | :------ | :------------------------------------------ |
| `id`          | INTEGER | Primary Key Auto-increment                  |
| `tabela`      | TEXT    | Nome da tabela (Unique)                     |
| `ultima_sync` | TEXT    | Timestamp da última sincronia (Server Time) |
