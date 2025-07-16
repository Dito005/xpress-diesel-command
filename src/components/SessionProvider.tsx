import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define a session type. Adjust as needed for your app.
interface Session {
  user?: {
    id: string;
    email?: string;
    // Add more user fields as needed
  };
}

const SessionContext = createContext<{ session: Session | null }>({ session: null });

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Replace this with your real session logic (e.g., from Supabase auth)
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Example: load session from localStorage or API
    // setSession({ user: { id: 'demo-user-id', email: 'demo@example.com' } });
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
