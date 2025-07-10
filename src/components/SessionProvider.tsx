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

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserRole = async (userId: string) => {
      if (!isMounted) return;
      
      try {
        const { data: techDataArray, error: techError } = await supabase
          .from('techs')
          .select('role')
          .eq('id', userId)
          .limit(1);

        if (techError) {
          console.error("Error fetching user role:", techError);
          setUserRole('unassigned');
          return;
        }

        if (techDataArray && techDataArray.length > 0) {
          const role = techDataArray[0].role;
          if (isUserRole(role)) {
            setUserRole(role.toLowerCase() as UserRole);
          } else {
            setUserRole('unassigned');
            console.warn(`Invalid role: ${role}`);
          }
        } else {
          setUserRole('unassigned');
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setUserRole('unassigned');
      }
    };

    const setAuthData = async (session: Session | null) => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setSession(session);
      
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) setAuthData(session);
    });

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setAuthData(session);
    });

    return () => {
      isMounted = false;
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