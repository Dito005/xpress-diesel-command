import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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
  command: 'create_job' | 'generate_invoice' | 'clock_in_tech';
  params: Record<string, any>;
  confirmationMessage: string;
}

export const AIHelper = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "ai", content: "Hi! I'm your AI assistant. How can I help you manage the shop today? Try asking me to 'create a job' or 'generate an invoice for job 123'." }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<AIAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { id: Date.now(), type: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { prompt: inputMessage, history: messages },
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
    let success = false;
    let successMessage = "";

    try {
      if (actionToConfirm.command === 'create_job') {
        const { error } = await supabase.from('jobs').insert([
          { 
            customer_info: { name: actionToConfirm.params.customerName },
            description: actionToConfirm.params.description,
            status: 'pending',
            truck_vin: actionToConfirm.params.truckVin, // Added truck_vin
            job_type: actionToConfirm.params.jobType, // Added job_type
            customer_name: actionToConfirm.params.customerName, // Added customer_name
            customer_email: actionToConfirm.params.customerEmail, // Added customer_email
            customer_phone: actionToConfirm.params.customerPhone, // Added customer_phone
            notes: actionToConfirm.params.notes, // Added notes
          }
        ]);
        if (error) throw error;
        success = true;
        successMessage = `Job for ${actionToConfirm.params.customerName} has been created.`;
      } else if (actionToConfirm.command === 'clock_in_tech') {
        const { techId, jobId } = actionToConfirm.params;
        if (!techId) throw new Error("Technician ID is required to clock in.");

        // Check if tech is already clocked in for a shift or job
        const { data: existingLogs, error: existingLogsError } = await supabase
          .from('time_logs')
          .select('*')
          .eq('tech_id', techId)
          .is('clock_out', null);

        if (existingLogsError) throw existingLogsError;

        // Clock out any existing active logs for this tech
        for (const log of existingLogs) {
          await supabase.from('time_logs').update({ clock_out: new Date().toISOString() }).eq('id', log.id);
        }

        // Clock in for the new shift/job
        const { error } = await supabase.from('time_logs').insert([
          { 
            tech_id: techId, 
            job_id: jobId || null, 
            clock_in: new Date().toISOString(),
            type: jobId ? 'job' : 'shift', // Differentiate between job and general shift
            notes: jobId ? `Clocked in for job ${jobId}` : 'General shift clock-in',
          }
        ]);
        if (error) throw error;
        success = true;
        const techName = (await supabase.from('techs').select('name').eq('id', techId).single()).data?.name || 'Technician';
        successMessage = `${techName} has been clocked in ${jobId ? `for job ${jobId}` : 'for their shift'}.`;
      }
      // Add other command handlers here...

      if (success) {
        toast({ title: "Action Successful", description: successMessage });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setActionToConfirm(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" /> AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              {message.type === 'ai' && <Bot className="h-6 w-6 text-gray-500 flex-shrink-0" />}
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                <p className="text-sm">{message.content}</p>
                {message.action && !isLoading && (
                  <Button size="sm" className="mt-2" onClick={() => setActionToConfirm(message.action!)}>
                    Confirm Action
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && !actionToConfirm && (
            <div className="flex justify-start items-center gap-2">
               <Bot className="h-6 w-6 text-gray-500 flex-shrink-0" />
               <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me to create a job, generate an invoice, or clock in a tech..."
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
      </Card>

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
            <AlertDialogAction onClick={handleConfirmAction}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};