import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RecouvrementLineChartProps {
  donnees: { mois: string; montant: number }[];
}

/** Évolution mensuelle du montant recouvré (règle 9). */
export function RecouvrementLineChart({ donnees }: RecouvrementLineChartProps) {
  if (donnees.length === 0) {
    return <p className="text-sm text-gray-400">Pas encore de données de recouvrement</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={donnees}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} Ar`} />
        <Line type="monotone" dataKey="montant" name="Montant recouvré" stroke="#7a1e1e" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}