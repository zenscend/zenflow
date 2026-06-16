export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
      <div className="mt-6 flex flex-col items-center gap-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
          Powered by
        </p>
        <a
          href="https://zenscend.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          zenscend.co
        </a>
      </div>
    </div>
  )
}
