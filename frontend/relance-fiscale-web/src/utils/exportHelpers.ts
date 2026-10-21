/** Déclenche le téléchargement d'un Blob reçu du backend (export Excel/PDF). */
export function declencherTelechargement(blob: Blob, nomFichier: string): void {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.setAttribute('download', nomFichier);
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}