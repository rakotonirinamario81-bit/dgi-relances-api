export function estNifValide(nif: string): boolean {
  return /^[A-Za-z0-9]{7,15}$/.test(nif.trim());
}

export function estTelephoneValide(telephone: string): boolean {
  return /^(\+261|0)3[2-9](\s?\d{2}){3}$/.test(telephone.trim());
}

export function estEmailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}