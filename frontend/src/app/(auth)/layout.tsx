import { MessageSquare } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">Messenger</span>
      </div>
      <div className="bg-card border rounded-2xl shadow-xl p-8 w-full max-w-sm">
        {children}
      </div>
      <p className="text-xs text-muted-foreground mt-8">
        Real-time messenger · Built with Next.js, Socket.io, WebRTC
      </p>
    </div>
  );
}