// Ré-export explicite : App.tsx importe la logique depuis context/, ce fichier
// documente l'emplacement attendu par la structure de dossiers du projet.
export { AuthProvider, useAuthContext } from '@/context/AuthContext';