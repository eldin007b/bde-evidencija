import React from "react";

export default function AppLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header removed as requested */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
