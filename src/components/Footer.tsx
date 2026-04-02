export default function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 font-mono text-sm text-syntax-comment">
        <p>{"/* \u00A9 2026 Aftar Fadilah */"}</p>
        <p>{"// Built with Next.js & Claude Code"}</p>
      </div>
    </footer>
  );
}
