export default function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Carregando">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
    </div>
  );
}
