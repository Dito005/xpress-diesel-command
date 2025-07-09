import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Wrench, Package, AlertTriangle, CheckCircle, Users, MapPin } from "lucide-react";

interface TechnicianSkill {
  id: string;
  name: string;
  skills: {
    [key: string]: {
      level: number; // 1-10
      completedJobs: number;
      avgEfficiency: number; // percentage
      avgQuality: number; // 1-10
    };
  };
  availability: {
    status: 'available' | 'busy' | 'road';
    currentJob?: string;
    estimatedFree?: string;
  };
  location: 'shop' | 'road';
  weeklyHours: number;
  maxCapacity: number;
}

interface JobRequirement {
  id: string;
  unitNumber: string;
  jobType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  requiredSkills: string[];
  requiredParts: Array<{
    partNumber: string;
    name: string;
    quantity: number;
    inStock: boolean;
    leadTime?: string;
  }>;
  customerName: string;
  location: 'shop' | 'road';
  setupRequired: string[];
  needsApproval?: boolean;
  deadline?: string;
}

interface AssignmentSuggestion {
  jobId: string;
  techId: string;
  confidenceScore: number;
  reasoning: string[];
  estimatedCompletion: string;
  efficiency: number;
  skillMatch: number;
  availability: number;
}

export const AIJobAnalyzer = () => {
  const [technicians] = useState<TechnicianSkill[]>([
    {
      id: "tech-1",
      name: "Oscar Rodriguez",
      skills: {
        "AC Repair": { level: 9, completedJobs: 47, avgEfficiency: 85, avgQuality: 9.2 },
        "Engine Diagnostics": { level: 8, completedJobs: 32, avgEfficiency: 90, avgQuality: 8.8 },
        "Transmission": { level: 6, completedJobs: 12, avgEfficiency: 75, avgQuality: 7.5 }
      },
      availability: { status: 'available' },
      location: 'shop',
      weeklyHours: 38,
      maxCapacity: 40
    },
    {
      id: "tech-2", 
      name: "Miguel Santos",
      skills: {
        "Brake Systems": { level: 10, completedJobs: 89, avgEfficiency: 95, avgQuality: 9.8 },
        "Suspension": { level: 8, completedJobs: 45, avgEfficiency: 88, avgQuality: 8.9 },
        "PM Service": { level: 9, completedJobs: 156, avgEfficiency: 92, avgQuality: 9.1 }
      },
      availability: { status: 'busy', currentJob: 'T-1507', estimatedFree: '2:30 PM' },
      location: 'shop',
      weeklyHours: 42,
      maxCapacity: 45
    },
    {
      id: "tech-3",
      name: "Jake Wilson", 
      skills: {
        "Road Service": { level: 9, completedJobs: 78, avgEfficiency: 87, avgQuality: 8.7 },
        "Emergency Repair": { level: 8, completedJobs: 34, avgEfficiency: 82, avgQuality: 8.5 },
        "Mobile Diagnostics": { level: 7, completedJobs: 23, avgEfficiency: 79, avgQuality: 8.2 }
      },
      availability: { status: 'road', currentJob: 'T-2190' },
      location: 'road',
      weeklyHours: 35,
      maxCapacity: 40
    }
  ]);

  const [openJobs] = useState<JobRequirement[]>([
    {
      id: "job-1",
      unitNumber: "T-2041",
      jobType: "AC Repair",
      priority: "high",
      estimatedHours: 3.5,
      requiredSkills: ["AC Repair"],
      requiredParts: [
        { partNumber: "AC-4401", name: "Compressor", quantity: 1, inStock: true },
        { partNumber: "AC-2201", name: "Refrigerant", quantity: 2, inStock: false, leadTime: "2 hours" }
      ],
      customerName: "ABC Transport",
      location: "shop",
      setupRequired: ["AC recovery unit", "Lift Bay 3"],
      needsApproval: false
    },
    {
      id: "job-2", 
      unitNumber: "T-1884",
      jobType: "Brake Systems",
      priority: "medium",
      estimatedHours: 4,
      requiredSkills: ["Brake Systems"],
      requiredParts: [
        { partNumber: "BR-9901", name: "Brake Pads", quantity: 8, inStock: true },
        { partNumber: "BR-7743", name: "Rotors", quantity: 4, inStock: true }
      ],
      customerName: "XYZ Logistics",
      location: "shop", 
      setupRequired: ["Brake lathe", "Lift Bay 1"],
      needsApproval: false
    },
    {
      id: "job-3",
      unitNumber: "T-3401",
      jobType: "Emergency Repair",
      priority: "urgent",
      estimatedHours: 2,
      requiredSkills: ["Road Service", "Emergency Repair"],
      requiredParts: [
        { partNumber: "EL-5501", name: "Alternator", quantity: 1, inStock: false, leadTime: "4 hours" }
      ],
      customerName: "Priority Freight",
      location: "road",
      setupRequired: ["Mobile unit", "Tow capability"],
      needsApproval: true
    }
  ]);

  const [assignments, setAssignments] = useState<AssignmentSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateAssignments = () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const suggestions: AssignmentSuggestion[] = [];
      
      openJobs.forEach(job => {
        let bestMatch: AssignmentSuggestion | null = null;
        
        technicians.forEach(tech => {
          // Calculate skill match
          const relevantSkills = job.requiredSkills.filter(skill => tech.skills[skill]);
          if (relevantSkills.length === 0) return;
          
          const skillMatch = relevantSkills.reduce((avg, skill) => {
            return avg + tech.skills[skill].level;
          }, 0) / relevantSkills.length * 10;
          
          // Calculate efficiency score
          const efficiency = relevantSkills.reduce((avg, skill) => {
            return avg + tech.skills[skill].avgEfficiency;
          }, 0) / relevantSkills.length;
          
          // Calculate availability score
          let availability = 100;
          if (tech.availability.status === 'busy') availability = 30;
          if (tech.availability.status === 'road' && job.location === 'shop') availability = 20;
          if (tech.location !== job.location && job.location === 'road') availability *= 0.8;
          
          // Calculate workload factor
          const workloadFactor = Math.max(0, (tech.maxCapacity - tech.weeklyHours) / tech.maxCapacity * 100);
          
          // Overall confidence score
          const confidenceScore = Math.round(
            (skillMatch * 0.4 + efficiency * 0.3 + availability * 0.2 + workloadFactor * 0.1)
          );
          
          const reasoning = [
            `${relevantSkills[0]} skill level: ${tech.skills[relevantSkills[0]]?.level}/10`,
            `${tech.skills[relevantSkills[0]]?.completedJobs} completed jobs`,
            `${efficiency.toFixed(0)}% avg efficiency`,
            tech.availability.status === 'available' ? 'Currently available' : 
            tech.availability.status === 'busy' ? `Busy until ${tech.availability.estimatedFree}` :
            'On road service'
          ];
          
          const suggestion: AssignmentSuggestion = {
            jobId: job.id,
            techId: tech.id,
            confidenceScore,
            reasoning,
            estimatedCompletion: new Date(Date.now() + job.estimatedHours * 60 * 60 * 1000).toLocaleTimeString(),
            efficiency,
            skillMatch: skillMatch / 10,
            availability: availability / 100
          };
          
          if (!bestMatch || suggestion.confidenceScore > bestMatch.confidenceScore) {
            bestMatch = suggestion;
          }
        });
        
        if (bestMatch) {
          suggestions.push(bestMatch);
        }
      });
      
      setAssignments(suggestions);
      setIsAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    calculateAssignments();
  }, []);

  const getJobById = (id: string) => openJobs.find(job => job.id === id);
  const getTechById = (id: string) => technicians.find(tech => tech.id === id);
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500'; 
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          AI Job Analyzer & Assignment Engine
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {openJobs.length} Open Jobs
          </Badge>
          <Button onClick={calculateAssignments} disabled={isAnalyzing}>
            <Brain className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Recalculate"}
          </Button>
        </div>
      </div>

      {/* Job Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const job = getJobById(assignment.jobId);
          const tech = getTechById(assignment.techId);
          if (!job || !tech) return null;

          const missingParts = job.requiredParts.filter(part => !part.inStock);
          
          return (
            <Card key={assignment.jobId} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(job.priority)}`} />
                    {job.unitNumber}
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {assignment.confidenceScore}% Match
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{job.jobType} • {job.customerName}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Recommended Technician */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Recommended: {tech.name}</span>
                  </div>
                  <div className="space-y-1">
                    {assignment.reasoning.map((reason, idx) => (
                      <p key={idx} className="text-xs text-blue-700">• {reason}</p>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-700">Est. completion: {assignment.estimatedCompletion}</span>
                  </div>
                </div>

                {/* Confidence Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Skill Match</span>
                    <span>{Math.round(assignment.skillMatch * 100)}%</span>
                  </div>
                  <Progress value={assignment.skillMatch * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Efficiency</span>
                    <span>{Math.round(assignment.efficiency)}%</span>
                  </div>
                  <Progress value={assignment.efficiency} className="h-2" />
                </div>

                {/* Parts Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Parts Status</span>
                  </div>
                  <div className="space-y-1">
                    {job.requiredParts.map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{part.name}</span>
                        {part.inStock ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  {missingParts.length > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      {missingParts.length} parts missing • Est. {missingParts[0].leadTime} lead time
                    </p>
                  )}
                </div>

                {/* Setup Requirements */}
                {job.setupRequired.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Setup Required</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {job.setupRequired.join(", ")}
                    </div>
                  </div>
                )}

                {/* Location & Approval */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {job.location === 'road' ? 'Road Service' : 'Shop'}
                  </div>
                  {job.needsApproval && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Needs Approval
                    </Badge>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Assign to {tech.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>AI analyzing job assignments...</span>
          </div>
        </div>
      )}
    </div>
  );
};