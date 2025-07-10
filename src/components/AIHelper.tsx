import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from '@/components/SessionProvider';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  action?: any;
}

export const AIHelper = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(Date.now().toString());
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const { toast } = useToast();
  const { session } = useSession();

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session?.user?.id) return;

    const userMessage: Message = { 
      id: Date.now(), 
      type: "user", 
      content: inputMessage 
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          prompt: inputMessage,
          history: messages,
          sessionId,
          userId: session.user.id
        },
      });

      if (error) throw error;

      const aiMessage: Message = { 
        id: Date.now() + 1, 
        type: "ai", 
        content: data.text,
        action: data.action 
      };
      
      setMessages(prev => [...prev, aiMessage]);

      if (data.action) {
        setActionToConfirm(data.action);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "AI Error",
        description: error.message,
      });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: "ai",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of the component
};