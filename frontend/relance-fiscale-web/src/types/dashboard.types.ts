export interface StatistiquesGlobales {
  nombreTotalDebiteurs: number;
  montantTotalImpaye: number;
  montantRecupere: number;
  tauxRecouvrement: number;
  nombreRelancesEnvoyees: number;
}

export interface PerformanceAgent {
  agentId: number;
  nomAgent: string;
  nombreRelances: number;
  tauxReussite: number;
}

export interface DashboardStats {
  statistiquesGlobales: StatistiquesGlobales;
  classementAgents: PerformanceAgent[];
}