import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';
import { nanoid } from 'nanoid';

const SESSION_ID_KEY = 'quran_app_session_id';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    sessionId = nanoid();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

export function useUserSession() {
  const [sessionId] = useState(() => getOrCreateSessionId());

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user/session', sessionId],
    queryFn: async () => {
      const response = await fetch('/api/user/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user session');
      }
      
      return response.json();
    },
    staleTime: Infinity, // User session doesn't change
    gcTime: Infinity,
  });

  return {
    user,
    userId: user?.id,
    isLoading,
    sessionId,
  };
}
