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
      console.log("SessionProvider: Inside fetchUserRole for userId:", userId);
      if (!isMounted) {
        console.log("SessionProvider: fetchUserRole unmounted, returning.");
        return;
      }
      
      try {
        const { data: techDataArray, error: techError } = await supabase
          .from('techs')
          .select('role')
          .eq('id', userId)
          .limit(1);

        if (techError) {
          console.error("SessionProvider: Error fetching user role from 'techs' table:", techError);
          if (isMounted) setUserRole('unassigned');
          return;
        }

        if (isMounted) {
          if (techDataArray && techDataArray.length > 0) {
            const role = techDataArray[0].role;
            if (isUserRole(role)) {
              setUserRole(role.toLowerCase() as UserRole);
              console.log("SessionProvider: User role set to:", role.toLowerCase());
            } else {
              setUserRole('unassigned');
              console.warn(`SessionProvider: Invalid role received: ${role}. Setting to 'unassigned'.`);
            }
          } else {
            setUserRole('unassigned');
            console.log("SessionProvider: No tech profile found, user role set to 'unassigned'.");
          }
        }
      } catch (error) {
        console.error("SessionProvider: Error in fetchUserRole (catch block):", error);
        if (isMounted) setUserRole('unassigned');
      }
    };

    const initializeSession = async () => {
      console.log("SessionProvider: Initializing session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("SessionProvider: Error getting session:", error);
          throw error;
        }

        if (isMounted) {
          setSession(session);
          console.log("SessionProvider: Session obtained:", session ? "present" : "null");
          if (session) {
            console.log("SessionProvider: Fetching user role for user ID:", session.user.id);
            await fetchUserRole(session.user.id);
            console.log("SessionProvider: User role fetched.");
          } else {
            setUserRole(null);
            console.log("SessionProvider: No session, user role set to null.");
          }
        }
      } catch (error) {
        console.error("SessionProvider: Failed to initialize session (catch block):", error);
        if (isMounted) {
          setSession(null);
          setUserRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log("SessionProvider: Loading finished. IsLoading set to false.");
        }
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("SessionProvider: Auth state changed. Event:", _event, "New session:", newSession ? "present" : "null");
      if (isMounted) {
        setSession(newSession);
        if (newSession) {
          await fetchUserRole(newSession.user.id);
        } else {
          setUserRole(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      console.log("SessionProvider: Component unmounted, subscription unsubscribed.");
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