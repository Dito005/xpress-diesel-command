import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Workflow, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Wrench, 
  Droplets, 
  Car,
  Phone,
  Timer,
  ArrowRight,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

interface SetupRequirement {
  id: string;
  type: 'tool' | 'bay' | 'fluid' | 'inspection' | 'approval';
  name: string;
  status: 'ready' | 'needed' | 'in_progress' | 'blocked';
  estimatedTime: number; // minutes
  responsible: string; // Tech ID
  dependencies?: string[];
}

interface JobWorkflow {
  id: string;
  unitNumber: string;
  jobType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'ready' | 'pending_setup' | 'pending_approval' | 'can_start' | 'blocked';
  customerName: string;
  setupRequirements: SetupRequirement[];
  approvals: Array<{
    type: string;
    status: 'needed' | 'pending' | 'approved' | 'rejected';
    estimatedCost?: number;
    description: string;
  }>;
  dependencies: string[]; // other job IDs this depends on
  estimatedStartTime: string;
  urgencyScore: number;
  blockingOthers: string[]; // job IDs that depend on this one
}

export const WorkflowOrchestrator = () => {
  const [workflows, setWorkflows] = useState<JobWorkflow[]>([]);
  const [techNames, setTechNames] = useState<Record<string, string>>({}); // Map tech ID to name
  const [activeTab, setActiveTab] = useState("priority-queue");
  
  useEffect(() => {
    const fetchWorkflowData = async () => {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          truck_vin,
          job_type,
          priority,
          status,
          customer_name,
          customer_concern,
          recommended_service,
          actual_service
        `);
      if (jobsError) {
        console.error("Error fetching jobs for workflow:", jobsError);
        return;
      }

      // Fetch techs for names
      const { data: techsData, error: techsError } = await supabase
        .from('techs')
        .select('id, name');
      if (techsError) {
        console.error("Error fetching techs for workflow:", techsError);
        return;
      }
      const namesMap = techsData.reduce((acc, tech) => ({ ...acc, [tech.id]: tech.name }), {});
      setTechNames(namesMap);

      // Simulate setup requirements and approvals for fetched jobs
      const simulatedWorkflows: JobWorkflow[] = jobsData.map(job => {
        const baseUrgency = { 'low': 30, 'medium': 60, 'high': 80, 'urgent': 100 }[job.priority] || 50;
        const randomFactor = Math.floor(Math.random() * 20) - 10; // -10 to +9
        const urgencyScore = Math.max(0, Math.min(100, baseUrgency + randomFactor));

        const setupReqs: SetupRequirement[] = [
          {
            id: `${job.id}-setup-1`,
            type: "bay",
            name: `Lift Bay for ${job.job_type}`,
            status: Math.random() > 0.5 ? "ready" : "needed",
            estimatedTime: 15,
            responsible: techsData[Math.floor(Math.random() * techsData.length)]?.id || 'unassigned'
          },
          {
            id: `${job.id}-setup-2`, 
            type: "tool",
            name: `Specialized Tool for ${job.job_type}`,
            status: Math.random() > 0.7 ? "ready" : "needed",
            estimatedTime: 5,
            responsible: techsData[Math.floor(Math.random() * techsData.length)]?.id || 'unassigned'
          }
        ];

        const approvals: JobWorkflow['approvals'] = [];
        if (job.priority === 'urgent' || Math.random() > 0.8) {
          approvals.push({
            type: "Customer Approval",
            status: Math.random() > 0.5 ? "approved" : "needed",
            estimatedCost: Math.floor(Math.random() * 1000) + 500,
            description: `Approval for ${job.job_type} service`
          });
        }

        let workflowStatus: JobWorkflow['status'] = 'ready';
        if (setupReqs.some(s => s.status === 'needed')) {
          workflowStatus = 'pending_setup';
        }
        if (approvals.some(a => a.status === 'needed')) {
          workflowStatus = 'pending_approval';
        }
        if (workflowStatus === 'pending_setup' && approvals.some(a => a.status === 'needed')) {
          workflowStatus = 'pending_approval'; // Approval takes precedence if both needed
        }
        if (job.status === 'in_progress') {
          workflowStatus = 'can_start'; // If job is already in progress, it can start
        } else if (job.status === 'completed') {
          workflowStatus = 'ready'; // Completed jobs are 'ready' in a sense
        }


        return {
          id: job.id,
          unitNumber: job.truck_vin || 'N/A',
          jobType: job.job_type,
          priority: job.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: workflowStatus,
          customerName: job.customer_name,
          setupRequirements: setupReqs,
          approvals: approvals,
          dependencies: [], // For simplicity, no real dependencies for now
          estimatedStartTime: "ASAP", // Placeholder
          urgencyScore: urgencyScore,
          blockingOthers: [], // Placeholder
        };
      });
      setWorkflows(simulatedWorkflows);
    };

    fetchWorkflowData();

    const channel = supabase
      .channel('workflow_orchestrator_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchWorkflowData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchWorkflowData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'can_start': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending_setup': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending_approval': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSetupStatusIcon = (status: string) => {
    switch(status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Timer className="h-4 w-4 text-blue-600" />;
      case 'needed': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSetupTypeIcon = (type: string) => {
    switch(type) {
      case 'tool': return <Wrench className="h-4 w-4" />;
      case 'bay': return <Car className="h-4 w-4" />;
      case 'fluid': return <Droplets className="h-4 w-4" />;
      case 'approval': return <User className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500'; 
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const sortedByPriority = [...workflows].sort((a, b) => b.urgencyScore - a.urgencyScore);
  const pendingApprovals = workflows.filter(w => w.status === 'pending_approval');
  const setupNeeded = workflows.filter(w => w.status === 'pending_setup');
  const readyToStart = workflows.filter(w => w.status === 'can_start');

  const updateSetupStatus = (jobId: string, setupId: string, newStatus: 'ready' | 'needed' | 'in_progress' | 'blocked') => {
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.id === jobId) {
        const updatedSetup = workflow.setupRequirements.map(setup => 
          setup.id === setupId ? { ...setup, status: newStatus } : setup
        );
        
        // Update job status based on setup completion
        const allReady = updatedSetup.every(s => s.status === 'ready');
        const hasApprovals = workflow.approvals.some(a => a.status === 'needed');
        
        let newJobStatus: 'ready' | 'pending_setup' | 'pending_approval' | 'can_start' | 'blocked' = workflow.status;
        if (allReady && !hasApprovals) newJobStatus = 'can_start';
        else if (allReady && hasApprovals) newJobStatus = 'pending_approval';
        
        return { ...workflow, setupRequirements: updatedSetup, status: newJobStatus };
      }
      return workflow;
    }));
  };

  const requestApproval = (jobId: string) => {
    // Simulate sending approval request
    console.log(`Requesting approval for job ${jobId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Workflow className="h-6 w-6 text-indigo-600" />
          Workflow Orchestrator
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            {readyToStart.length} Ready to Start
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {pendingApprovals.length} Need Approval
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="priority-queue">Priority Queue</TabsTrigger>
          <TabsTrigger value="setup-board">Setup Board</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="priority-queue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedByPriority.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(workflow.priority)}`} />
                      {workflow.unitNumber}
                    </CardTitle>
                    <Badge className={getStatusColor(workflow.status)} variant="outline">
                      {workflow.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{workflow.jobType} • {workflow.customerName}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Urgency Score */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Urgency Score</span>
                      <span className="font-medium">{workflow.urgencyScore}/100</span>
                    </div>
                    <Progress value={workflow.urgencyScore} className="h-2" />
                  </div>

                  {/* Setup Progress */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Setup Progress</span>
                    </div>
                    <div className="space-y-1">
                      {workflow.setupRequirements.map((setup) => (
                        <div key={setup.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getSetupTypeIcon(setup.type)}
                            <span>{setup.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSetupStatusIcon(setup.status)}
                            <span className="text-gray-500">{setup.estimatedTime}m</span>
                            {setup.responsible && <span className="text-gray-500">({techNames[setup.responsible] || 'Unknown'})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Start */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated Start:</span>
                    <span className="font-medium">{workflow.estimatedStartTime}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {workflow.status === 'can_start' && (
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start Job
                      </Button>
                    )}
                    {workflow.status === 'pending_approval' && (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={() => requestApproval(workflow.id)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Request Approval
                      </Button>
                    )}
                    {workflow.status === 'blocked' && (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <PauseCircle className="h-4 w-4 mr-1" />
                        Blocked
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setup-board" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Setup Needed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-5 w-5" />
                  Setup Needed ({setupNeeded.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {setupNeeded.map((workflow) => (
                  <div key={workflow.id} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-2">{workflow.unitNumber}</div>
                    {workflow.setupRequirements
                      .filter(s => s.status === 'needed')
                      .map((setup) => (
                        <div key={setup.id} className="flex items-center justify-between text-xs mb-1">
                          <span>{setup.name}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateSetupStatus(workflow.id, setup.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        </div>
                      ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Timer className="h-5 w-5" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workflows.map((workflow) => {
                  const inProgressSetups = workflow.setupRequirements.filter(s => s.status === 'in_progress');
                  if (inProgressSetups.length === 0) return null;
                  
                  return (
                    <div key={workflow.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-2">{workflow.unitNumber}</div>
                      {inProgressSetups.map((setup) => (
                        <div key={setup.id} className="flex items-center justify-between text-xs mb-1">
                          <span>{setup.name}</span>
                          <Button 
                            size="sm"
                            onClick={() => updateSetupStatus(workflow.id, setup.id, 'ready')}
                          >
                            Complete
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Ready */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Ready ({readyToStart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {readyToStart.map((workflow) => (
                  <div key={workflow.id} className="p-3 border rounded-lg bg-green-50">
                    <div className="font-medium text-sm mb-1">{workflow.unitNumber}</div>
                    <div className="text-xs text-gray-600 mb-2">{workflow.jobType}</div>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start Job
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingApprovals.map((workflow) => (
              <Card key={workflow.id} className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    {workflow.unitNumber} - {workflow.customerName}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {workflow.approvals.map((approval, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-sm text-orange-900 mb-1">
                        {approval.type}
                      </div>
                      <div className="text-xs text-orange-700 mb-2">
                        {approval.description}
                      </div>
                      {approval.estimatedCost && (
                        <div className="text-sm font-medium text-orange-900 mb-2">
                          Estimated Cost: ${approval.estimatedCost}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => requestApproval(workflow.id)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call Customer
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <div className="space-y-4">
            {workflows.map((workflow) => {
              if (workflow.dependencies.length === 0 && workflow.blockingOthers.length === 0) return null;
              
              return (
                <Card key={workflow.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{workflow.unitNumber} - {workflow.jobType}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {workflow.dependencies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Waiting For:
                        </div>
                        <div className="text-xs text-gray-600">
                          {workflow.dependencies.map(depId => {
                            const depJob = workflows.find(w => w.id === depId);
                            return depJob ? `${depJob.unitNumber} (${depJob.jobType})` : depId;
                          }).join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {workflow.blockingOthers.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Blocking:
                        </div>
                        <div className="text-xs text-gray-600">
                          {workflow.blockingOthers.map(blockId => {
                            const blockedJob = workflows.find(w => w.id === blockId);
                            return blockedJob ? `${blockedJob.unitNumber} (${blockedJob.jobType})` : blockId;
                          }).join(', ')}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};