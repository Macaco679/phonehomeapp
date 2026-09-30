import Image from "next/image";
import Link from "next/link";

// Moldura das telas de entrada (login, cadastro): topo da marca + folha branca, como em apps.
export function AuthScreen({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-blue-600 to-blue-700">
      <div className="mx-auto w-full max-w-md px-6 pb-7 pt-[max(2rem,env(safe-area-inset-top))] text-white">
        <Link href="/" className="inline-flex rounded-2xl bg-white px-3.5 py-2 shadow-lg shadow-blue-900/20">
          <Image src="/logo.png" alt="Phone Home" width={140} height={34} priority className="h-7 w-auto" />
        </Link>
        <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-[15px] text-blue-100">{subtitulo}</p>}
      </div>
      <div className="safe-bottom mx-auto w-full max-w-md flex-1 rounded-t-[2rem] bg-white px-6 pb-10 pt-7 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] md:my-8 md:flex-none md:rounded-[2rem]">
        {children}
      </div>
    </div>
  );
}
