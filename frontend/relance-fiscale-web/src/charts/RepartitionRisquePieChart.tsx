import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RepartitionRisquePieChartProps {
  donnees: { nom: string; valeur: number }[];
}

const COULEURS = ['#16a34a', '#d97706', '#dc2626'];

/** Répartition des dossiers par niveau de risque (règle 7/9). */
export function RepartitionRisquePieChart({ donnees }: RepartitionRisquePieChartProps) {
  if (donnees.every((d) => d.valeur === 0)) {
    return <p className="text-sm text-gray-400">Pas encore de dossiers classés par risque</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={donnees} dataKey="valeur" nameKey="nom" cx="50%" cy="50%" outerRadius={90} label>
          {donnees.map((_, index) => (
            <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}