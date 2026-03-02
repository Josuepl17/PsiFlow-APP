import * as SQLite from "expo-sqlite";
import { Agendamento, DashboardStats, Paciente } from "../types";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("psiflow.db");
  }
  return db;
}

/**
 * Inicializa todas as tabelas espelhando exatamente o schema do Laravel.
 */
export async function initDatabase(): Promise<void> {
  const database = await getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Tabela users (espelho exato da tabela Laravel)
    CREATE TABLE IF NOT EXISTS users (
      id                INTEGER PRIMARY KEY,
      clinica_id        INTEGER,
      nome              TEXT,
      foto              TEXT,
      estado            TEXT,
      email             TEXT UNIQUE,
      cpf               TEXT UNIQUE,
      cargo             TEXT,
      crp               TEXT UNIQUE,
      telefone          TEXT,
      endereco          TEXT,
      bairro            TEXT,
      cidade            TEXT,
      genero            TEXT,
      status            TEXT DEFAULT 'ativo',
      primeiro_acesso   TEXT DEFAULT 'N',
      remember_token    TEXT,
      created_at        TEXT,
      updated_at        TEXT
    );

    -- Tabela pacientes (espelho exato da tabela Laravel)
    CREATE TABLE IF NOT EXISTS pacientes (
      id                    INTEGER PRIMARY KEY,
      nome                  TEXT NOT NULL,
      cpf                   TEXT UNIQUE,
      telefone              TEXT,
      data_nascimento       TEXT,
      genero                TEXT,
      endereco              TEXT,
      bairro                TEXT,
      cidade                TEXT,
      nome_responsavel      TEXT,
      telefone_responsavel  TEXT,
      status                TEXT DEFAULT 'ativo',
      created_at            TEXT,
      updated_at            TEXT
    );

    -- Tabela agendamentos (espelho exato da tabela Laravel)
    CREATE TABLE IF NOT EXISTS agendamentos (
      id                    INTEGER PRIMARY KEY,
      clinica_id            INTEGER,
      paciente_id           INTEGER,
      psicologo_id          INTEGER,
      recorrente_id         INTEGER,
      data                  TEXT NOT NULL,
      hora_inicial          TEXT NOT NULL,
      hora_final            TEXT,
      tipo                  TEXT DEFAULT 'unico',
      recorrente_ate_date   TEXT,
      nome_paciente         TEXT,
      nome_psicologo        TEXT,
      status                TEXT DEFAULT 'Agendado',
      lembrete_enviado      INTEGER DEFAULT 0,
      observacao            TEXT,
      created_at            TEXT,
      updated_at            TEXT
    );

    -- Controle de sincronização incremental (solicitado pelo usuário)
    CREATE TABLE IF NOT EXISTS sincronizacao (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tabela      TEXT NOT NULL UNIQUE,
      ultima_sync TEXT -- Formato: YYYY-MM-DD HH:MM:SS
    );

    -- Inicializar sincronizacao se vazio
    INSERT OR IGNORE INTO sincronizacao (tabela, ultima_sync) VALUES ('agendamentos', NULL);
    INSERT OR IGNORE INTO sincronizacao (tabela, ultima_sync) VALUES ('pacientes', NULL);
  `);
}

// ─── Sincronização Incremental (Auxiliares) ───────────────────────────────────

/**
 * Formata um objeto Date para o padrão SQL: YYYY-MM-DD HH:MM:SS
 */
function formatarDataSQL(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

/**
 * Atualiza o momento exato da sincronização para uma tabela.
 * Aceita um timestamp opcional (ex: vindo do servidor).
 */
export async function updateSincronizacao(
  tabela: string,
  timestamp?: string,
): Promise<void> {
  const database = await getDb();
  const agora = timestamp || formatarDataSQL(new Date());
  await database.runAsync(
    "INSERT OR REPLACE INTO sincronizacao (tabela, ultima_sync) VALUES (?, ?)",
    [tabela, agora],
  );
}

/**
 * Retorna os registros de sincronização incremental.
 */
export async function getSincronizacao(): Promise<
  Record<string, string | null>
> {
  const database = await getDb();
  const rows = (await database.getAllAsync(
    "SELECT * FROM sincronizacao",
  )) as Array<{
    tabela: string;
    ultima_sync: string;
  }>;
  const map: Record<string, string | null> = {};
  rows.forEach((r) => {
    map[r.tabela] = r.ultima_sync;
  });
  return map;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: any): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO users (
      id, clinica_id, nome, foto, estado, email, cpf, cargo, crp,
      telefone, endereco, bairro, cidade, genero, status,
      primeiro_acesso, remember_token, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.clinica_id,
      user.nome,
      user.foto,
      user.estado,
      user.email,
      user.cpf,
      user.cargo,
      user.crp,
      user.telefone,
      user.endereco,
      user.bairro,
      user.cidade,
      user.genero,
      user.status,
      user.primeiro_acesso,
      user.remember_token,
      user.created_at,
      user.updated_at,
    ],
  );
}

export async function getUser(id: number): Promise<Record<string, any> | null> {
  const database = await getDb();
  return (await database.getFirstAsync("SELECT * FROM users WHERE id = ?", [
    id,
  ])) as Record<string, any> | null;
}

// ─── Pacientes ───────────────────────────────────────────────────────────────

export async function upsertPacientes(pacientes: Paciente[]): Promise<void> {
  const database = await getDb();
  for (const p of pacientes) {
    await database.runAsync(
      `INSERT OR REPLACE INTO pacientes (
        id, nome, cpf, telefone, data_nascimento, genero,
        endereco, bairro, cidade, nome_responsavel, telefone_responsavel,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.nome,
        p.cpf ?? null,
        p.telefone ?? null,
        p.data_nascimento ?? null,
        p.genero ?? null,
        p.endereco ?? null,
        p.bairro ?? null,
        p.cidade ?? null,
        p.nome_responsavel ?? null,
        p.telefone_responsavel ?? null,
        p.status,
        p.created_at ?? null,
        p.updated_at ?? null,
      ],
    );
  }
}

export async function getPacientes(): Promise<Paciente[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM pacientes WHERE status = ? ORDER BY nome ASC",
    ["ativo"],
  )) as Paciente[];
}

export async function getTodosPacientes(): Promise<Paciente[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM pacientes ORDER BY nome ASC",
  )) as Paciente[];
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export async function upsertAgendamentos(
  agendamentos: Agendamento[],
): Promise<void> {
  const database = await getDb();
  for (const a of agendamentos) {
    // Verificar se já existe e se o lembrete já foi enviado localmente
    const existing = await database.getFirstAsync<{ lembrete_enviado: number }>(
      "SELECT lembrete_enviado FROM agendamentos WHERE id = ?",
      [a.id],
    );

    // Preservar o 1 caso o local ou o do servidor seja 1
    const lembreteEnviado =
      existing?.lembrete_enviado === 1 || a.lembrete_enviado ? 1 : 0;

    await database.runAsync(
      `INSERT OR REPLACE INTO agendamentos (
        id, clinica_id, paciente_id, psicologo_id, recorrente_id,
        data, hora_inicial, hora_final, tipo, recorrente_ate_date,
        nome_paciente, nome_psicologo, status, lembrete_enviado,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.clinica_id ?? null,
        a.paciente_id ?? null,
        a.psicologo_id ?? null,
        a.recorrente_id ?? null,
        a.data,
        a.hora_inicial,
        a.hora_final ?? null,
        a.tipo ?? null,
        a.recorrente_ate_date ?? null,
        a.nome_paciente,
        a.nome_psicologo ?? null,
        a.status,
        lembreteEnviado,
        a.observacao ?? null,
        a.created_at ?? null,
        a.updated_at ?? null,
      ],
    );
  }
}

/** Todos os agendamentos (para pesquisa no app) */
export async function getTodosAgendamentos(): Promise<Agendamento[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos ORDER BY data ASC, hora_inicial ASC",
  )) as Agendamento[];
}

/** Agendamentos de uma data específica */
export async function getAgendamentosPorData(
  data: string,
): Promise<Agendamento[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos WHERE data = ? ORDER BY hora_inicial ASC",
    [data],
  )) as Agendamento[];
}

/** Agendamentos por paciente */
export async function getAgendamentosPorPaciente(
  pacienteId: number,
): Promise<Agendamento[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos WHERE paciente_id = ? ORDER BY data ASC, hora_inicial ASC",
    [pacienteId],
  )) as Agendamento[];
}

/** Agendamentos futuros (para notificações) */
export async function getAgendamentosFuturos(
  data: string,
  hora: string,
  limit: number = 50,
): Promise<Agendamento[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    `SELECT * FROM agendamentos
     WHERE (data > ? OR (data = ? AND hora_inicial >= ?))
       AND status NOT IN ('Cancelado Pela Clinica','Cancelado Pelo Paciente','Concluido','Falta')
     ORDER BY data ASC, hora_inicial ASC
     LIMIT ?`,
    [data, data, hora, limit],
  )) as Agendamento[];
}

/** Marca um agendamento como lembrete enviado (localmente) */
export async function marcarLembreteEnviado(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "UPDATE agendamentos SET lembrete_enviado = 1 WHERE id = ?",
    [id],
  );
}

/**
 * Obtém as estatísticas de atendimentos para um mês específico.
 * @param mesAno Formato "YYYY-MM"
 */
export async function getEstatisticasMensais(
  mesAno: string,
): Promise<DashboardStats> {
  const database = await getDb();
  const pattern = `${mesAno}-%`;

  // 1. Concluídos
  const resConcluidos = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM agendamentos WHERE data LIKE ? AND status = 'Concluido'",
    [pattern],
  );

  // 2. Cancelados (Conforme solicitado pelo usuário)
  const resCancelados = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM agendamentos 
     WHERE data LIKE ? 
     AND status IN ('Cancelado Pela Clinica', 'Cancelado Pelo Paciente', 'Falta')`,
    [pattern],
  );

  // 3. Agendados (Qualquer um que não seja Cancelado ou Concluido)
  const resAgendados = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM agendamentos 
     WHERE data LIKE ? 
     AND status NOT IN ('Concluido', 'Cancelado Pela Clinica', 'Cancelado Pelo Paciente', 'Falta')`,
    [pattern],
  );

  const concluidos = resConcluidos?.count || 0;
  const cancelados = resCancelados?.count || 0;
  const agendados = resAgendados?.count || 0;

  return {
    concluidos,
    cancelados,
    agendados,
    total: concluidos + cancelados + agendados,
  };
}

// ─── Fim do Banco de Dados ───────────────────────────────────────────────────

/** Limpa todos os dados locais (logout) */
export async function clearDatabase(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    DELETE FROM agendamentos;
    DELETE FROM pacientes;
    DELETE FROM users;
    UPDATE sincronizacao SET ultima_sync = NULL;
  `);
}
