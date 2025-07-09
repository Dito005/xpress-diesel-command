import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, TrendingUp, AlertTriangle, ChevronRight, Lightbulb } from "lucide-react";
import { AdminAIInsights } from "@/components/AdminAIInsights";

export const AIInsightsCompact = () => {
  const [isOpen, setIsOpen] = useState(false);

  const quickStats = [
    { label: "Active Alerts", value: "3", color: "text-red-600" },
    { label: "Opportunities", value: "2", color: "text-green-600" },
    { label: "Efficiency", value: "92%", color: "text-blue-600" }
  ];

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <Bot className="h-5 w-5" />
            AI Insights
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-auto">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                View Details
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-blue-600" />
                  AI Insights Dashboard
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <AdminAIInsights />
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live monitoring</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};