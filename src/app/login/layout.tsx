export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 min-h-screen flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
