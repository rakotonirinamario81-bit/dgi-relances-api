export type Periodicite = 'MENSUELLE' | 'BIMESTRIELLE' | 'TRIMESTRIELLE' | 'ANNUELLE' | 'UNIQUE';

export interface Impot {
  id: number;
  code: string;
  libelle: string;
  taux?: number;
  periodicite: Periodicite;
  actif: boolean;
}

export interface ImpotDTO {
  code: string;
  libelle: string;
  taux?: number;
  periodicite: Periodicite;
}