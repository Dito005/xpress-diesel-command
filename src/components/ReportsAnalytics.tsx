import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, DollarSign, Clock, Users, FileText, Download, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

export const ReportsAnalytics = () => {
  const [dateRange, setDateRange] = useState("7days");

  // Enhanced mock data with performance trends
  const performanceTrendsData = [
    { month: "Jan", revenue: 125000, efficiency: 85, customerSat: 4.2, jobs: 145 },
    { month: "Feb", revenue: 142000, efficiency: 88, customerSat: 4.4, jobs: 162 },
    { month: "Mar", revenue: 138000, efficiency: 92, customerSat: 4.3, jobs: 158 },
    { month: "Apr", revenue: 165000, efficiency: 89, customerSat: 4.6, jobs: 178 },
    { month: "May", revenue: 175000, efficiency: 94, customerSat: 4.5, jobs: 189 },
    { month: "Jun", revenue: 168000, efficiency: 91, customerSat: 4.7, jobs: 184 },
  ];

  const predictiveInsights = [
    { title: "Revenue Forecast", value: "+18%", trend: "up", insight: "Based on current trends, next month revenue projected to increase by 18%" },
    { title: "Efficiency Optimization", value: "3.2h", trend: "down", insight: "Average job time can be reduced by 3.2 hours with suggested improvements" },
    { title: "Customer Retention", value: "92%", trend: "up", insight: "Customer satisfaction improvements leading to higher retention rates" },
    { title: "Peak Hours", value: "2-4 PM", trend: "neutral", insight: "Optimal scheduling window identified for maximum productivity" }
  ];

  const revenueData = [
    { name: "Mon", revenue: 8400, cost: 3200 },
    { name: "Tue", revenue: 12200, cost: 4800 },
    { name: "Wed", revenue: 9600, cost: 3600 },
    { name: "Thu", revenue: 15800, cost: 6200 },
    { name: "Fri", revenue: 11400, cost: 4200 },
    { name: "Sat", revenue: 6800, cost: 2400 },
    { name: "Sun", revenue: 4200, cost: 1800 }
  ];

  const efficiencyData = [
    { name: "Miguel Rodriguez", efficiency: 94, jobs: 12 },
    { name: "Carlos Martinez", efficiency: 89, jobs: 10 },
    { name: "David Thompson", efficiency: 92, jobs: 11 },
    { name: "Roberto Silva", efficiency: 87, jobs: 9 },
    { name: "Juan Hernandez", efficiency: 91, jobs: 13 }
  ];

  const jobTypeData = [
    { name: "PM Service", value: 35, color: "#3B82F6" },
    { name: "Brake Repair", value: 25, color: "#EF4444" },
    { name: "Engine Work", value: 20, color: "#10B981" },
    { name: "AC Repair", value: 12, color: "#F59E0B" },
    { name: "Other", value: 8, color: "#8B5CF6" }
  ];

  const kpiData = [
    {
      title: "Total Revenue",
      value: "$68,400",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Average Job Time",
      value: "4.2h",
      change: "-8.3%",
      trend: "down",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Technician Efficiency",
      value: "90.6%",
      change: "+3.2%",
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Profit Margin",
      value: "73.8%",
      change: "+5.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Reports & Analytics
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <kpi.icon className="h-4 w-4" />
                  {kpi.title}
                </CardTitle>
                <Badge variant={kpi.trend === "up" ? "default" : "destructive"} className="text-xs">
                  {kpi.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                vs previous period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="efficiency">Performance</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Bar dataKey="cost" fill="#EF4444" name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technician Efficiency Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={efficiencyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {jobTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="efficiency" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictiveInsights.map((insight, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {insight.title}
                    </CardTitle>
                    <Badge variant={insight.trend === "up" ? "default" : insight.trend === "down" ? "destructive" : "secondary"}>
                      {insight.trend === "up" ? <TrendingUp className="h-3 w-3" /> : 
                       insight.trend === "down" ? <AlertTriangle className="h-3 w-3" /> : 
                       <CheckCircle className="h-3 w-3" />}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {insight.value}
                  </div>
                  <p className="text-sm text-gray-600">
                    {insight.insight}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
