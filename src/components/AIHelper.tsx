import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "./SessionProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  action?: AIAction;
}

interface AIAction {
  command: 'create_job_by_ai' | 'generate_invoice' | 'clock_in_tech';
  params: Record<string, any>;
  confirmationMessage: string;
}

export const AIHelper = () => {
  const { toast } = useToast();
  const { session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "ai", content: "Hi! I'm your AI assistant. How can I help you manage the shop today? Try asking me to 'create a job'." }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<AIAction | null>(null);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem('ai_session_id');
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('ai_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session?.user?.id) return;

    const userMessage: Message = { id: Date.now(), type: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          prompt: currentInput, 
          history: messages,
          sessionId: sessionId,
          userId: session.user.id,
        },
      });

      if (error) throw error;

      const aiResponse: { text: string; action?: AIAction } = data;
      const aiMessage: Message = { id: Date.now() + 1, type: "ai", content: aiResponse.text, action: aiResponse.action };
      
      setMessages(prev => [...prev, aiMessage]);

      if (aiResponse.action) {
        setActionToConfirm(aiResponse.action);
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Error", description: error.message });
      const errorMessage: Message = { id: Date.now() + 1, type: "ai", content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;

    setIsLoading(true);
    let successMessage = "";

    try {
      if (actionToConfirm.command === 'create_job_by_ai') {
        const { data: newJobId, error } = await supabase.rpc('create_job_by_ai', actionToConfirm.params);
        
        if (error) throw error;

        await supabase.from('ai_action_logs').insert({
          user_id: session?.user?.id,
          action_type: 'create_job_by_ai',
          details: { ...actionToConfirm.params, new_job_id: newJobId },
          status: 'success',
        });

        successMessage = `Job for ${actionToConfirm.params._customer_name} has been created successfully (ID: ${newJobId.slice(0,8)}).`;
      }
      // Add other command handlers here...

      toast({ title: "Action Successful", description: successMessage });
      setMessages(prev => [...prev, { id: Date.now(), type: 'ai', content: successMessage }]);

    } catch (error: any) {
      await supabase.from('ai_action_logs').insert({
        user_id: session?.user?.id,
        action_type: actionToConfirm.command,
        details: actionToConfirm.params,
        status: 'failed',
        error_message: error.message,
      });
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setActionToConfirm(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-end gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === 'ai' && <Bot className="h-6 w-6 text-gray-500 flex-shrink-0" />}
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.action && !isLoading && (
                <Button size="sm" className="mt-2" onClick={() => setActionToConfirm(message.action!)}>
                  Confirm Action
                </Button>
              )}
            </div>
            {message.type === 'user' && <User className="h-6 w-6 text-gray-500 flex-shrink-0" />}
          </div>
        ))}
        {isLoading && !actionToConfirm && (
          <div className="flex justify-start items-center gap-2">
             <Bot className="h-6 w-6 text-gray-500 flex-shrink-0" />
             <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me to create a job, check a status..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!actionToConfirm} onOpenChange={() => setActionToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm AI Action</AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm?.confirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};