/**
 * Interface que representa um Agendamento no sistema (espelho do SQLite/Laravel)
 */
export interface Agendamento {
  id: number;
  clinica_id?: number;
  paciente_id?: number;
  psicologo_id?: number;
  recorrente_id?: number;
  data: string; // Formato YYYY-MM-DD
  hora_inicial: string; // Formato HH:MM:SS
  hora_final?: string; // Formato HH:MM:SS
  tipo?: string;
  recorrente_ate_date?: string;
  nome_paciente: string;
  nome_psicologo?: string;
  status: string;
  lembrete_enviado: number; // 0 ou 1
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface que representa um Paciente no sistema
 */
export interface Paciente {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  genero?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  nome_responsavel?: string;
  telefone_responsavel?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface que representa o Usuário logado
 */
export interface User {
  id: number;
  clinica_id: number | null;
  nome: string | null;
  foto: string | null;
  estado: string | null;
  email: string | null;
  cpf: string | null;
  cargo: string | null;
  crp: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  genero: string | null;
  status: string;
  primeiro_acesso: string;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Resultado de uma operação de Sincronização
 */
export interface SyncResult {
  sucesso: boolean;
  semInternet?: boolean;
  erro?: string;
  agendamentos?: number;
  pacientes?: number;
  horario?: string;
}
/**
 * Estatísticas para o Dashboard (Mês Atual)
 */
export interface DashboardStats {
  concluidos: number;
  cancelados: number;
  agendados: number;
  total: number;
}

/**
 * Interface que representa um Arquivo de Paciente (metadados do servidor)
 */
export interface ArquivoPaciente {
  id: number;
  paciente_id: number;
  psicologo_id: number;
  clinica_id: number;
  evolucao_id: number | null;
  nome: string; // nome do arquivo no storage (ex: uuid.pdf)
  nome_original: string; // nome original do arquivo (ex: laudo.pdf)
  path: string; // caminho no storage (ex: arquivos/pacientes/uuid.pdf)
  size: number | null;
  created_at: string | null;
  updated_at: string | null;
}
