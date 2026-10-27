import type { StatistiquesGlobales } from '@/types/dashboard.types';
import { formaterMontant } from '@/utils/formatDate';

interface KpiCardsProps {
  stats: StatistiquesGlobales;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const taux = Number(stats.tauxRecouvrement) || 0;
  const objectifAtteint = taux >= 85;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

      {/* 1. Débiteurs Actifs */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Débiteurs Actifs
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-base shadow-2xs">
            👥
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {stats.nombreTotalDebiteurs}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Contribuables en relance</span>
          </div>
        </div>
      </div>

      {/* 2. Montant Total Impayé */}
      <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
            Total Impayé Dû
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 text-base shadow-2xs">
            ⚠️
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-red-700 font-mono tracking-tight">
            {formaterMontant(stats.montantTotalImpaye)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600/90 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>Créances en souffrance</span>
          </div>
        </div>
      </div>

      {/* 3. Montant Recouvré */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Montant Recouvré
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-base shadow-2xs">
            💰
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formaterMontant(stats.montantRecupere)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span>✅ Encaissé au Trésor Public</span>
          </div>
        </div>
      </div>

      {/* 4. Taux de Recouvrement */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Taux de Recouvrement
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-base shadow-2xs">
            📈
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-tight">
              {taux.toFixed(1)}%
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                objectifAtteint ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {objectifAtteint ? 'Cible atteinte' : 'Objectif 85%'}
            </span>
          </div>
          {/* Mini barre de progression */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                taux >= 85 ? 'bg-emerald-500' : taux >= 50 ? 'bg-blue-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, taux))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Relances Envoyées */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Relances Envoyées
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-base shadow-2xs">
            📨
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono tracking-tight">
            {stats.nombreRelancesEnvoyees}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700/90 font-medium">
            <span>Courrier Électronique Officiel</span>
          </div>
        </div>
      </div>

    </div>
  );
}