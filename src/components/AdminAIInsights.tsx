import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Users, Wrench, Lightbulb, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const AdminAIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState([
    { label: "Jobs Today", value: "0", trend: "+0", icon: Wrench },
    { label: "Revenue", value: "$0", trend: "+0%", icon: DollarSign },
    { label: "Efficiency", value: "0%", trend: "+0%", icon: TrendingUp },
    { label: "Customer Sat", value: "0/5", trend: "+0", icon: CheckCircle }
  ]);

  useEffect(() => {
    const fetchInsightsAndMetrics = async () => {
      setIsLoading(true);

      // Fetch jobs for "Jobs Today"
      const today = new Date().toISOString().split('T')[0];
      const { data: jobsToday, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .gte('created_at', `${today}T00:00:00.000Z`);
      const numJobsToday = jobsToday?.length || 0;

      // Fetch invoices for "Revenue"
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total')
        .gte('created_at', `${today}T00:00:00.000Z`);
      const totalRevenueToday = invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;

      // Fetch techs for "Efficiency"
      const { data: techs, error: techsError } = await supabase
        .from('techs')
        .select('efficiency');
      let avgEfficiency = 0;
      if (techsError) {
        console.error("Error fetching techs for Admin AI Insights:", techsError);
      } else if (techs && techs.length > 0) {
        const totalEfficiency = techs.reduce((sum, tech) => sum + (tech.efficiency || 0), 0);
        avgEfficiency = Math.round(totalEfficiency / techs.length);
      }

      // Simulate Customer Sat (no direct DB table for this yet)
      const customerSat = (4.0 + Math.random() * 0.9).toFixed(1);

      setLiveMetrics([
        { label: "Jobs Today", value: numJobsToday.toString(), trend: "+3", icon: Wrench },
        { label: "Revenue", value: `$${(totalRevenueToday / 1000).toFixed(1)}K`, trend: "+18%", icon: DollarSign },
        { label: "Efficiency", value: `${avgEfficiency}%`, trend: "+5%", icon: TrendingUp },
        { label: "Customer Sat", value: `${customerSat}/5`, trend: "+0.2", icon: CheckCircle }
      ]);

      // Simulate AI insights
      setInsights([
        {
          id: 1,
          type: "opportunity",
          priority: "high",
          title: "Revenue Optimization",
          message: "Schedule more PM services during 2-4 PM peak efficiency window to increase daily revenue by $2,400",
          action: "Adjust scheduling algorithm",
          icon: DollarSign,
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          id: 2,
          type: "alert",
          priority: "medium",
          title: "Technician Workload",
          message: "Miguel Rodriguez is at 110% capacity. Consider redistributing 2-3 jobs to maintain quality",
          action: "Rebalance workload",
          icon: Users,
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        },
        {
          id: 3,
          type: "prediction",
          priority: "low",
          title: "Parts Inventory",
          message: "Brake pad inventory will run low in 5 days based on current job trends",
          action: "Order inventory",
          icon: Wrench,
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        },
        {
          id: 4,
          type: "suggestion",
          priority: "medium",
          title: "Customer Satisfaction",
          message: "Adding follow-up calls after AC repairs could increase customer satisfaction by 12%",
          action: "Implement follow-up process",
          icon: CheckCircle,
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        }
      ]);
      setIsLoading(false);
    };

    fetchInsightsAndMetrics();

    const channel = supabase
      .channel('admin_ai_insights_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchInsightsAndMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchInsightsAndMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchInsightsAndMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          AI Insights Dashboard
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Live Analysis
        </Badge>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {liveMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-green-600">{metric.trend}</p>
                </div>
                <metric.icon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Live AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border ${insight.bgColor}`}>
                  <div className="flex items-start gap-3">
                    <insight.icon className={`h-5 w-5 ${insight.color} mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{insight.message}</p>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Optimize Schedule</h3>
            <p className="text-sm text-gray-600">AI-powered job scheduling</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Pricing Analysis</h3>
            <p className="text-sm text-gray-600">Dynamic pricing insights</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
            <p className="text-sm text-gray-600">Predictive maintenance alerts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};