import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cartographieService } from '@/services/cartographieService';
import type { ContribuableLocalite, ZoneRisque } from '@/types/cartographie.types';
import { Loader } from '@/components/common/Loader';
import { formaterMontant } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routesConfig';

// ── Régions Madagascar avec coordonnées SVG (viewBox 0 0 320 640) ─────────────
const REGIONS_MADAGASCAR = [
  { id: 'DIANA',              nom: 'Diana',              x: 115, y: 10,  w: 85,  h: 58  },
  { id: 'SAVA',               nom: 'SAVA',               x: 196, y: 28,  w: 62,  h: 72  },
  { id: 'SOFIA',              nom: 'Sofia',              x: 68,  y: 68,  w: 82,  h: 68  },
  { id: 'BOENY',              nom: 'Boeny (Mahajanga)',  x: 32,  y: 128, w: 82,  h: 68  },
  { id: 'BETSIBOKA',          nom: 'Betsiboka',          x: 110, y: 132, w: 72,  h: 62  },
  { id: 'ALAOTRA_MANGORO',    nom: 'Alaotra-Mangoro',   x: 178, y: 118, w: 80,  h: 88  },
  { id: 'ITASY',              nom: 'Itasy',              x: 88,  y: 198, w: 65,  h: 58  },
  { id: 'ANALAMANGA',         nom: 'Analamanga (Tana)',  x: 148, y: 192, w: 82,  h: 78  },
  { id: 'ATSINANANA',         nom: 'Atsinanana (Tmv)',   x: 226, y: 202, w: 60,  h: 88  },
  { id: 'VAKINANKARATRA',     nom: 'Vakinankaratra',     x: 98,  y: 252, w: 82,  h: 68  },
  { id: 'AMORON_I_MANIA',     nom: "Amoron'i Mania",    x: 132, y: 308, w: 72,  h: 58  },
  { id: 'MATSIATRA_AMBONY',   nom: 'Matsiatra Ambony',  x: 100, y: 348, w: 82,  h: 68  },
  { id: 'FITOVINANY',         nom: 'Fitovinany',         x: 182, y: 298, w: 70,  h: 80  },
  { id: 'MENABE',             nom: 'Menabe (Morondava)', x: 62,  y: 318, w: 82,  h: 88  },
  { id: 'ATSIMO_ANDREFANA',   nom: 'Atsimo-Andrefana',  x: 48,  y: 408, w: 108, h: 90  },
  { id: 'ATSIMO_ATSINANANA',  nom: 'Atsimo-Atsinanana', x: 172, y: 388, w: 72,  h: 78  },
  { id: 'ANOSY',              nom: 'Anosy (Fort-Dph)',   x: 152, y: 458, w: 82,  h: 68  },
  { id: 'ANDROY',             nom: 'Androy (Ambovombe)', x: 118, y: 518, w: 94,  h: 58  },
  { id: 'MELAKY',             nom: 'Melaky',             x: 18,  y: 220, w: 68,  h: 90  },
];

// Mapping commune → région (simplifié)
const COMMUNE_REGION: Record<string, string> = {
  'Antananarivo': 'ANALAMANGA', 'Tana': 'ANALAMANGA', 'Antananarivo I': 'ANALAMANGA',
  'Toamasina': 'ATSINANANA', 'Tamatave': 'ATSINANANA',
  'Mahajanga': 'BOENY', 'Majunga': 'BOENY',
  'Fianarantsoa': 'MATSIATRA_AMBONY',
  'Toliara': 'ATSIMO_ANDREFANA', 'Tuléar': 'ATSIMO_ANDREFANA',
  'Antsiranana': 'DIANA', 'Diego-Suarez': 'DIANA',
  'Antsirabe': 'VAKINANKARATRA',
  'Morondava': 'MENABE',
  'Ambovombe': 'ANDROY',
  'Fort-Dauphin': 'ANOSY', 'Tôlanaro': 'ANOSY',
  'Sambava': 'SAVA', 'Antalaha': 'SAVA',
  'Ambatondrazaka': 'ALAOTRA_MANGORO',
  'Moramanga': 'ALAOTRA_MANGORO',
  'Manakara': 'FITOVINANY',
  'Farafangana': 'ATSIMO_ATSINANANA',
  'Ambositra': 'AMORON_I_MANIA',
  'Miarinarivo': 'ITASY',
  'Maintirano': 'MELAKY',
  'Port-Bergé': 'SOFIA', 'Antsohihy': 'SOFIA',
  'Bealanana': 'SOFIA',
  'Tsaratanana': 'BETSIBOKA',
};

function trouverRegion(commune: string): string | null {
  const direct = COMMUNE_REGION[commune];
  if (direct) return direct;
  const lower = commune.toLowerCase();
  for (const [key, region] of Object.entries(COMMUNE_REGION)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return region;
  }
  return null;
}

// ── Couleur selon niveau de risque ───────────────────────────────────────────
function couleurZone(niveauRisque: string | null, opacite = 0.75): string {
  if (!niveauRisque) return '#e5e7eb';
  switch (niveauRisque) {
    case 'ELEVE':  return `rgba(239,68,68,${opacite})`;
    case 'MOYEN':  return `rgba(245,158,11,${opacite})`;
    case 'FAIBLE': return `rgba(34,197,94,${opacite})`;
    default: return '#e5e7eb';
  }
}

// ── Badges ────────────────────────────────────────────────────────────────────
function badgeNiveau(niveau: string) {
  switch (niveau) {
    case 'ELEVE':  return 'bg-red-100 text-red-800 border border-red-200';
    case 'MOYEN':  return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:       return 'bg-green-100 text-green-700 border border-green-200';
  }
}
function emojiNiveau(niveau: string) {
  switch (niveau) { case 'ELEVE': return '🔴'; case 'MOYEN': return '🟡'; default: return '🟢'; }
}

// ── Page Cartographie ─────────────────────────────────────────────────────────
export function CartographiePage() {
  const [zones, setZones] = useState<ZoneRisque[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [zoneSelectionnee, setZoneSelectionnee] = useState<ZoneRisque | null>(null);
  const [contribuablesZone, setContribuablesZone] = useState<ContribuableLocalite[]>([]);
  const [chargementContribuables, setChargementContribuables] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; zone: ZoneRisque } | null>(null);
  const [rechercheTableau, setRechercheTableau] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const data = await cartographieService.getZonesRisque();
      setZones(data);
    } catch {
      setErreur('Erreur lors du chargement des données cartographiques.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { void charger(); }, [charger]);

  // Agréger les données de zones par région SVG
  const donneesParRegion = new Map<string, ZoneRisque>();
  for (const zone of zones) {
    const regionId = trouverRegion(zone.commune);
    if (regionId) {
      const existing = donneesParRegion.get(regionId);
      if (!existing || zone.montantImpaye > existing.montantImpaye) {
        donneesParRegion.set(regionId, zone);
      }
    }
  }

  async function selectionnerZone(zone: ZoneRisque) {
    setZoneSelectionnee(zone);
    setChargementContribuables(true);
    try {
      const contrib = await cartographieService.getContribuablesParCommune(zone.commune);
      setContribuablesZone(contrib);
    } finally {
      setChargementContribuables(false);
    }
  }

  function selectionnerRegionSVG(regionId: string) {
    const zoneData = donneesParRegion.get(regionId);
    if (zoneData) void selectionnerZone(zoneData);
  }

  const zonesFiltrees = zones.filter(z =>
    rechercheTableau === '' ||
    z.commune.toLowerCase().includes(rechercheTableau.toLowerCase())
  );

  // KPIs globaux
  const totalZones = zones.length;
  const zonesElevees = zones.filter(z => z.niveauRisque === 'ELEVE').length;
  const montantTotal = zones.reduce((acc, z) => acc + z.montantImpaye, 0);

  if (chargement) return <Loader />;
  if (erreur) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">⚠️ {erreur}</p>
        <button onClick={() => void charger()} className="mt-3 text-sm underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">

      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🗺️</span> Cartographie Fiscale — Tableau de Bord Territorial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualisation géographique des créances fiscales impayées par commune et région de Madagascar.
          </p>
        </div>
        <button onClick={() => void charger()}
          className="self-start sm:self-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          🔄 Actualiser
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1">🗺️ Zones Actives</div>
          <div className="text-3xl font-extrabold text-blue-700">{totalZones}</div>
          <div className="text-sm text-blue-600 mt-1">communes avec créances</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">🔴 Zones à Risque Élevé</div>
          <div className="text-3xl font-extrabold text-red-700">{zonesElevees}</div>
          <div className="text-sm text-red-600 mt-1">zones critiques (&gt; 10 M Ar)</div>
        </div>
        <div className="rounded-xl border border-fiscal-bordeaux bg-gradient-to-br from-fiscal-bordeaux/5 to-fiscal-bordeaux/10 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-fiscal-bordeaux mb-1">💰 Montant Total Impayé</div>
          <div className="text-2xl font-extrabold text-fiscal-bordeaux">{formaterMontant(montantTotal)}</div>
          <div className="text-sm text-fiscal-bordeaux/70 mt-1">toutes communes confondues</div>
        </div>
      </div>

      {/* ── Corps principal : carte + panneau ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Carte SVG Madagascar */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-2">Carte des impayés par région</h2>

          <div className="relative" onMouseLeave={() => setTooltip(null)}>
            <svg
              viewBox="0 0 320 600"
              className="w-full max-h-[560px] border border-gray-100 rounded-lg bg-blue-50/30"
              aria-label="Carte de Madagascar - Répartition des impayés fiscaux"
            >
              {/* Fond mer */}
              <rect width="320" height="600" fill="#dbeafe" rx="8" />

              {/* Régions */}
              {REGIONS_MADAGASCAR.map(region => {
                const zoneData = donneesParRegion.get(region.id);
                const estSelectionnee = zoneSelectionnee?.commune === zoneData?.commune;
                const couleur = zoneData ? couleurZone(zoneData.niveauRisque, 0.72) : '#e5e7eb';

                return (
                  <g key={region.id}>
                    <rect
                      x={region.x} y={region.y} width={region.w} height={region.h}
                      rx="4" ry="4"
                      fill={couleur}
                      stroke={estSelectionnee ? '#7a1e1e' : '#ffffff'}
                      strokeWidth={estSelectionnee ? 2.5 : 1}
                      className={zoneData ? 'cursor-pointer' : 'cursor-default'}
                      onClick={() => zoneData && selectionnerRegionSVG(region.id)}
                      onMouseEnter={e => {
                        if (zoneData) {
                          const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                          const parentRect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
                          setTooltip({
                            x: rect.left - (parentRect?.left ?? 0) + rect.width / 2,
                            y: rect.top - (parentRect?.top ?? 0),
                            zone: zoneData,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Nom de la région */}
                    <text
                      x={region.x + region.w / 2}
                      y={region.y + region.h / 2 - 4}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="7" fontWeight={estSelectionnee ? 'bold' : 'normal'}
                      fill={zoneData ? '#1f2937' : '#9ca3af'}
                      className="pointer-events-none select-none"
                    >
                      {region.nom.length > 14 ? region.nom.substring(0, 13) + '…' : region.nom}
                    </text>
                    {/* Montant impayé si données disponibles */}
                    {zoneData && (
                      <text
                        x={region.x + region.w / 2}
                        y={region.y + region.h / 2 + 8}
                        textAnchor="middle"
                        fontSize="6"
                        fill="#374151"
                        className="pointer-events-none select-none"
                      >
                        {(zoneData.montantImpaye / 1_000_000).toFixed(1)} M Ar
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Tooltip SVG interne */}
              {tooltip && (
                <g>
                  <rect
                    x={Math.min(tooltip.x - 60, 200)}
                    y={Math.max(tooltip.y - 62, 4)}
                    width="130" height="56"
                    rx="4" fill="#1f2937" fillOpacity="0.9"
                  />
                  <text x={Math.min(tooltip.x - 60, 200) + 6} y={Math.max(tooltip.y - 62, 4) + 13}
                    fontSize="7.5" fontWeight="bold" fill="white" className="pointer-events-none">
                    {tooltip.zone.commune}
                  </text>
                  <text x={Math.min(tooltip.x - 60, 200) + 6} y={Math.max(tooltip.y - 62, 4) + 26}
                    fontSize="6.5" fill="#fbbf24" className="pointer-events-none">
                    Impayé: {(tooltip.zone.montantImpaye / 1_000_000).toFixed(2)} M Ar
                  </text>
                  <text x={Math.min(tooltip.x - 60, 200) + 6} y={Math.max(tooltip.y - 62, 4) + 38}
                    fontSize="6.5" fill="#d1d5db" className="pointer-events-none">
                    {tooltip.zone.nbContribuables} contribuable(s) | {tooltip.zone.tauxRecouvrement}% rcvr
                  </text>
                  <text x={Math.min(tooltip.x - 60, 200) + 6} y={Math.max(tooltip.y - 62, 4) + 50}
                    fontSize="6.5" fill="#d1d5db" className="pointer-events-none">
                    {tooltip.zone.nbDettesEnRetard} dettes en retard
                  </text>
                </g>
              )}
            </svg>

            {/* Légende */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded" style={{ backgroundColor: couleurZone('ELEVE') }} />
                <span>Risque Élevé (&gt;10 M Ar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded" style={{ backgroundColor: couleurZone('MOYEN') }} />
                <span>Risque Moyen (2–10 M Ar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded" style={{ backgroundColor: couleurZone('FAIBLE') }} />
                <span>Risque Faible (&lt;2 M Ar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded bg-gray-200" />
                <span>Aucune donnée</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau de détails */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          {zoneSelectionnee ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{zoneSelectionnee.commune}</h2>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold mt-1 ${badgeNiveau(zoneSelectionnee.niveauRisque)}`}>
                    {emojiNiveau(zoneSelectionnee.niveauRisque)} Risque {zoneSelectionnee.niveauRisque}
                  </span>
                </div>
                <button onClick={() => setZoneSelectionnee(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
              </div>

              {/* Stats zone */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
                  <div className="text-xs text-red-500 font-semibold">Montant impayé</div>
                  <div className="text-sm font-extrabold text-red-700 mt-0.5">{formaterMontant(zoneSelectionnee.montantImpaye)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-500 font-semibold">Contribuables</div>
                  <div className="text-sm font-extrabold text-gray-800 mt-0.5">{zoneSelectionnee.nbContribuables}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-500 font-semibold">Dettes en retard</div>
                  <div className="text-sm font-extrabold text-amber-700 mt-0.5">{zoneSelectionnee.nbDettesEnRetard}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-500 font-semibold">Taux recouvrement</div>
                  <div className="text-sm font-extrabold text-green-700 mt-0.5">{zoneSelectionnee.tauxRecouvrement}%</div>
                </div>
              </div>

              {/* Barre recouvrement */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progression du recouvrement</span>
                  <span className="font-semibold">{zoneSelectionnee.tauxRecouvrement}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${zoneSelectionnee.tauxRecouvrement >= 75 ? 'bg-green-500' : zoneSelectionnee.tauxRecouvrement >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${zoneSelectionnee.tauxRecouvrement}%` }}
                  />
                </div>
              </div>

              {/* Contribuables de la zone */}
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contribuables</h3>
              {chargementContribuables ? (
                <div className="py-6 text-center text-sm text-gray-400">Chargement...</div>
              ) : contribuablesZone.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun contribuable trouvé pour cette commune.</p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 max-h-60">
                  {contribuablesZone.map(c => (
                    <div key={c.detteId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-gray-800 truncate max-w-[130px]">{c.nom}</div>
                        <div className="font-mono text-gray-400 text-[10px]">{c.nif} · {c.impot}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-700">{formaterMontant(c.soldeRestant)}</div>
                        <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${badgeNiveau(c.niveauRisque === 'RISQUE_ELEVE' ? 'ELEVE' : c.niveauRisque === 'RISQUE_MOYEN' ? 'MOYEN' : 'FAIBLE')}`}>
                          {c.niveauRisque.replace('RISQUE_', '')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to={ROUTES.RELANCES}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-fiscal-bordeaux px-4 py-2.5 text-sm font-semibold text-white hover:bg-fiscal-bordeauxFonce transition-colors"
              >
                📨 Relancer les contribuables de cette zone
              </Link>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-400 py-8">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="text-sm font-medium">Cliquez sur une région de la carte</p>
              <p className="text-xs mt-1">ou sélectionnez une commune dans le tableau ci-dessous</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tableau classement des zones ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            📊 Classement des zones fiscales ({zonesFiltrees.length})
          </h2>
          <input
            type="text"
            placeholder="Rechercher une commune…"
            value={rechercheTableau}
            onChange={e => setRechercheTableau(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs w-52 focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                <th className="px-4 py-3 text-center font-semibold w-10">Rang</th>
                <th className="px-4 py-3 text-left font-semibold">Commune / Région</th>
                <th className="px-3 py-3 text-right font-semibold">Montant Impayé</th>
                <th className="px-3 py-3 text-center font-semibold">Nb Contrib.</th>
                <th className="px-3 py-3 text-center font-semibold">Dettes Retard</th>
                <th className="px-3 py-3 text-center font-semibold">Taux Rcvrt</th>
                <th className="px-3 py-3 text-center font-semibold">Risque</th>
                <th className="px-3 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zonesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">Aucune zone trouvée.</td>
                </tr>
              ) : zonesFiltrees.map((z, idx) => (
                <tr
                  key={z.commune}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${zoneSelectionnee?.commune === z.commune ? 'bg-fiscal-bordeaux/5' : ''}`}
                  onClick={() => void selectionnerZone(z)}
                >
                  <td className="px-4 py-3 text-center font-bold text-gray-400">#{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{z.commune}</td>
                  <td className="px-3 py-3 text-right font-semibold text-red-700">{formaterMontant(z.montantImpaye)}</td>
                  <td className="px-3 py-3 text-center text-gray-700">{z.nbContribuables}</td>
                  <td className="px-3 py-3 text-center text-amber-700 font-medium">{z.nbDettesEnRetard}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${z.tauxRecouvrement >= 75 ? 'bg-green-500' : z.tauxRecouvrement >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${z.tauxRecouvrement}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono">{z.tauxRecouvrement}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeNiveau(z.niveauRisque)}`}>
                      {emojiNiveau(z.niveauRisque)} {z.niveauRisque}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={e => { e.stopPropagation(); void selectionnerZone(z); }}
                      className="rounded-md bg-fiscal-bordeaux/10 px-2 py-1 text-[10px] font-medium text-fiscal-bordeaux hover:bg-fiscal-bordeaux hover:text-white transition-colors"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
