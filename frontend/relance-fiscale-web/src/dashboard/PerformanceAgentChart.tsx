import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { PerformanceAgent } from '@/types/dashboard.types';

const COULEURS = ['#7a1e1e', '#c9a227', '#2563eb', '#059669', '#d97706'];

export function PerformanceAgentChart({ classement }: { classement: PerformanceAgent[] }) {
  if (classement.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-center text-gray-400">
        <span className="text-3xl mb-1">📊</span>
        <p className="text-xs">Aucune relance enregistrée par agent pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={classement}
          margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="nomAgent"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value} relance(s)`, 'Volume traité']}
            labelFormatter={(label) => `👤 ${label}`}
          />
          <Bar dataKey="nombreRelances" name="Relances envoyées" maxBarSize={44} radius={[6, 6, 0, 0]}>
            {classement.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COULEURS[index % COULEURS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mini résumé des agents */}
      <div className="divide-y divide-gray-100 border-t border-gray-100 pt-1 text-xs">
        {classement.slice(0, 3).map((agent, i) => (
          <div key={agent.agentId} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                #{i + 1}
              </span>
              <span className="font-medium text-gray-800">{agent.nomAgent}</span>
            </div>
            <span className="font-mono font-bold text-fiscal-bordeaux">
              {agent.nombreRelances} relance{agent.nombreRelances > 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}