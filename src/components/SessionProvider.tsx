"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = "admin" | "manager" | "tech" | "road" | "parts" | "unassigned";

function isUserRole(role: string | null): role is UserRole {
  if (role === null) return false;
  const validRoles: UserRole[] = ["admin", "manager", "tech", "road", "parts", "unassigned"];
  return (validRoles as string[]).includes(role.toLowerCase());
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const fetchUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const { data, error } = await supabase
      .from('techs')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`No tech profile found for user ${userId}. Defaulting to 'unassigned'.`);
        return 'unassigned';
      }
      console.error("Error fetching user role:", error.message);
      return 'unassigned';
    }

    if (data && isUserRole(data.role)) {
      return data.role.toLowerCase() as UserRole;
    }
    
    console.warn(`Invalid or no role found for user ${userId}, setting to 'unassigned'.`);
    return 'unassigned';
  } catch (error) {
    console.error("Exception fetching user role:", error);
    return 'unassigned';
  }
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const getSessionAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error during initial session load:", error);
        setSession(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setIsLoading(true);
      setSession(newSession);
      if (newSession) {
        const role = await fetchUserRole(newSession.user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, userRole }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};