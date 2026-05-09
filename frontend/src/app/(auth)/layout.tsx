export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <div className="bg-card border rounded-lg shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}