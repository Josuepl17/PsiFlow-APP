import * as SQLite from "expo-sqlite";

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

    -- Controle de sincronização
    CREATE TABLE IF NOT EXISTS sync_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tabela      TEXT NOT NULL UNIQUE,
      ultima_sync TEXT
    );

    -- Inicializar sync_log se vazio
    INSERT OR IGNORE INTO sync_log (tabela, ultima_sync) VALUES ('agendamentos', NULL);
    INSERT OR IGNORE INTO sync_log (tabela, ultima_sync) VALUES ('pacientes', NULL);
    INSERT OR IGNORE INTO sync_log (tabela, ultima_sync) VALUES ('users', NULL);
  `);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: Record<string, any>): Promise<void> {
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

export async function upsertPacientes(
  pacientes: Record<string, any>[],
): Promise<void> {
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
        p.cpf,
        p.telefone,
        p.data_nascimento,
        p.genero,
        p.endereco,
        p.bairro,
        p.cidade,
        p.nome_responsavel,
        p.telefone_responsavel,
        p.status,
        p.created_at,
        p.updated_at,
      ],
    );
  }
  await updateSyncLog("pacientes");
}

export async function getPacientes(): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM pacientes WHERE status = ? ORDER BY nome ASC",
    ["ativo"],
  )) as Record<string, any>[];
}

export async function getTodosPacientes(): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM pacientes ORDER BY nome ASC",
  )) as Record<string, any>[];
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export async function upsertAgendamentos(
  agendamentos: Record<string, any>[],
): Promise<void> {
  const database = await getDb();
  for (const a of agendamentos) {
    await database.runAsync(
      `INSERT OR REPLACE INTO agendamentos (
        id, clinica_id, paciente_id, psicologo_id, recorrente_id,
        data, hora_inicial, hora_final, tipo, recorrente_ate_date,
        nome_paciente, nome_psicologo, status, lembrete_enviado,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.clinica_id,
        a.paciente_id,
        a.psicologo_id,
        a.recorrente_id,
        a.data,
        a.hora_inicial,
        a.hora_final,
        a.tipo,
        a.recorrente_ate_date,
        a.nome_paciente,
        a.nome_psicologo,
        a.status,
        a.lembrete_enviado ? 1 : 0,
        a.observacao,
        a.created_at,
        a.updated_at,
      ],
    );
  }
  await updateSyncLog("agendamentos");
}

/** Todos os agendamentos (para pesquisa no app) */
export async function getTodosAgendamentos(): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos ORDER BY data ASC, hora_inicial ASC",
  )) as Record<string, any>[];
}

/** Agendamentos de uma data específica */
export async function getAgendamentosPorData(
  data: string,
): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos WHERE data = ? ORDER BY hora_inicial ASC",
    [data],
  )) as Record<string, any>[];
}

/** Agendamentos por paciente */
export async function getAgendamentosPorPaciente(
  pacienteId: number,
): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    "SELECT * FROM agendamentos WHERE paciente_id = ? ORDER BY data ASC, hora_inicial ASC",
    [pacienteId],
  )) as Record<string, any>[];
}

/** Agendamentos futuros (para notificações) */
export async function getAgendamentosFuturos(
  agora: string,
): Promise<Record<string, any>[]> {
  const database = await getDb();
  return (await database.getAllAsync(
    `SELECT * FROM agendamentos
     WHERE (data > ? OR (data = ? AND hora_inicial >= ?))
       AND status NOT IN ('Cancelado Pelo Paciente','Cancelado Pela Clinica','Concluido','Falta')
     ORDER BY data ASC, hora_inicial ASC`,
    [
      agora.split("T")[0],
      agora.split("T")[0],
      agora.split("T")[1]?.substring(0, 5) ?? "00:00",
    ],
  )) as Record<string, any>[];
}

// ─── Sync Log ─────────────────────────────────────────────────────────────────

export async function updateSyncLog(tabela: string): Promise<void> {
  const database = await getDb();
  const agora = new Date().toISOString();
  await database.runAsync(
    "INSERT OR REPLACE INTO sync_log (tabela, ultima_sync) VALUES (?, ?)",
    [tabela, agora],
  );
}

export async function getSyncLog(): Promise<Record<string, string>> {
  const database = await getDb();
  const rows = (await database.getAllAsync("SELECT * FROM sync_log")) as Array<{
    tabela: string;
    ultima_sync: string;
  }>;
  const map: Record<string, string> = {};
  rows.forEach((r) => {
    map[r.tabela] = r.ultima_sync;
  });
  return map;
}

/** Limpa todos os dados locais (logout) */
export async function clearDatabase(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    DELETE FROM agendamentos;
    DELETE FROM pacientes;
    DELETE FROM users;
    UPDATE sync_log SET ultima_sync = NULL;
  `);
}
