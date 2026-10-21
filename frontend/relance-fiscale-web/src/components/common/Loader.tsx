export function Loader({ pleinEcran = false }: { pleinEcran?: boolean }) {
  return (
    <div className={pleinEcran ? 'flex h-screen items-center justify-center' : 'flex items-center justify-center py-10'}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-fiscal-bordeaux border-t-transparent" />
    </div>
  );
}