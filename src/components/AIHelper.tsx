import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, MessageCircle, Send, Lightbulb, Calculator, TrendingUp } from "lucide-react";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
}

// This simulates fetching data that the AI would use for context.
const getAppContext = () => ({
  jobs: { active: 3, pending: 5 },
  invoices: { overdue: 2, total: 15 },
  technicians: { clockedIn: 4, efficiency: "88%" },
});

const generateAIResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  const context = getAppContext();

  if (lowerMessage.includes("assign") && lowerMessage.includes("job")) {
    return "To assign a job, go to the 'AI Mission' tab, select a job, and the AI Job Analyzer will recommend the best technician based on skills, availability, and training needs.";
  }
  if (lowerMessage.includes("invoice") || lowerMessage.includes("billing")) {
    return `There are currently ${context.invoices.overdue} overdue invoices. You can create a new invoice from the 'Invoicing' tab. I can also help suggest descriptions for common services.`;
  }
  if (lowerMessage.includes("tech") || lowerMessage.includes("mechanic") || lowerMessage.includes("productivity")) {
    return `There are ${context.technicians.clockedIn} technicians currently clocked in. The team's average efficiency is ${context.technicians.efficiency}. You can view detailed time logs for each tech in the 'Techs' tab.`;
  }
  if (lowerMessage.includes("profit") || lowerMessage.includes("revenue")) {
    return "You can view detailed financial reports, including revenue, costs, and profit margins, in the 'Reports' tab. The main dashboard also shows live profit metrics.";
  }
  if (lowerMessage.includes("parts")) {
    return "Use the 'Parts Lookup' tool to find parts from nearby suppliers. It provides pricing, availability, and distance to help you make the best choice.";
  }
  
  return "I can help with job assignments, invoicing, technician productivity, and parts lookups. How can I assist you?";
};

export const AIHelper = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "ai", content: "Hi! I'm your AI assistant. How can I help you manage the shop today?", timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (message: string = inputMessage) => {
    if (!message.trim()) return;

    const userMessage: Message = { id: Date.now(), type: "user", content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise(res => setTimeout(res, 1000));

    const aiResponseContent = generateAIResponse(message);
    const aiMessage: Message = { id: Date.now() + 1, type: "ai", content: aiResponseContent, timestamp: new Date() };
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const suggestions = [
    { title: "Assign a job", prompt: "How do I assign a job to a technician?", icon: Lightbulb },
    { title: "Check on invoices", prompt: "Are there any overdue invoices?", icon: Calculator },
    { title: "View tech productivity", prompt: "Show me technician productivity.", icon: TrendingUp },
  ];

  return (
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
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex gap-2 mb-2">
          {suggestions.map(s => (
            <Button key={s.title} variant="outline" size="sm" onClick={() => handleSendMessage(s.prompt)}>
              <s.icon className="h-4 w-4 mr-2" /> {s.title}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about jobs, invoices, or technicians..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};