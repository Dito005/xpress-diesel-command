import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, MessageCircle, Lightbulb, AlertTriangle, CheckCircle, Send, Mic, Calculator, TrendingUp, Database } from "lucide-react";

export const AIHelper = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Hi! I'm your AI assistant. I can help you with diagnostics, recommend solutions, provide accurate pricing, and analyze your business performance. What can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    {
      id: 1,
      title: "Diagnostic Help",
      description: "Get AI-powered diagnostic suggestions",
      icon: Lightbulb,
      color: "text-yellow-600",
      prompt: "Help me diagnose an engine issue with irregular idle"
    },
    {
      id: 2,
      title: "Pricing & Quotes",
      description: "Get accurate pricing from cost database",
      icon: Calculator,
      color: "text-green-600",
      prompt: "What should I quote for brake pad replacement?"
    },
    {
      id: 3,
      title: "Business Analytics",
      description: "Analyze shop performance & profitability",
      icon: TrendingUp,
      color: "text-blue-600",
      prompt: "Show me current profit margins and efficiency"
    }
  ];

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: generateAIResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("quote")) {
      return "Based on our cost database: Oil Change Service $89.99 (0.5 hrs), Brake Pad Replacement $450 (2.5 hrs), Transmission Service $650 (3.0 hrs). These include parts markup and labor at $85/hr. Need a detailed breakdown?";
    } else if (lowerMessage.includes("profit") || lowerMessage.includes("margin")) {
      return "Current metrics: 32.5% average parts markup, 87% labor efficiency, 74.3% profit margin. Top categories: Engine (40%), Brake (25%), Transmission (20%). Consider focusing on higher-margin electrical work.";
    } else {
      return "I can help with diagnostics, pricing, business analytics, and technical guidance. I have access to your cost database and performance metrics. What specific area would you like assistance with?";
    }
  };

  const handleSuggestionClick = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          AI Helper
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Business-Aware AI
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Assistant Chat
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user" 
                      ? "bg-blue-600 text-white ml-4" 
                      : "bg-gray-100 text-gray-900 mr-4"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`text-xs mt-1 ${
                      message.type === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-lg p-3 mr-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about diagnostics, pricing, or business analytics..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <suggestion.icon className={`h-5 w-5 ${suggestion.color} mt-0.5`} />
                    <div>
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-gray-600">{suggestion.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Daily Revenue:</span>
                <span className="font-medium">$12,450</span>
              </div>
              <div className="flex justify-between">
                <span>Net Profit:</span>
                <span className="font-medium text-green-600">$9,250</span>
              </div>
              <div className="flex justify-between">
                <span>Tech Efficiency:</span>
                <span className="font-medium">87%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};