import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CampagneEfficaciteChartProps {
  donnees: { nomCampagne: string; envoyees: number; echecs: number }[];
}

/** Compare le volume envoyé/échoué entre campagnes (règle 4/9). */
export function CampagneEfficaciteChart({ donnees }: CampagneEfficaciteChartProps) {
  if (donnees.length === 0) {
    return <p className="text-sm text-gray-400">Aucune campagne à comparer pour le moment</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={donnees}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nomCampagne" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="envoyees" name="Envoyées" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="echecs" name="Échecs" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}