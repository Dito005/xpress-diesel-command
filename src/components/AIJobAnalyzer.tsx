import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Wrench, Package, AlertTriangle, CheckCircle, Users, MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

// Enhanced data structures
interface TechnicianSkill {
  id: string;
  name: string;
  skills: { [key: string]: { level: number; } };
  availability: 'available' | 'busy' | 'on_road';
  currentLoad: number; // Number of active jobs
  trainingNeeds: string[]; // Skills the tech needs to learn
}

interface JobRequirement {
  id: string;
  unitNumber: string;
  jobType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredSkills: string[];
  isTrainingOpportunity: boolean;
}

interface AssignmentSuggestion {
  jobId: string;
  techId: string;
  confidenceScore: number;
  reasoning: string[];
  isTrainingAssignment: boolean;
}

export const AIJobAnalyzer = () => {
  const [technicians, setTechnicians] = useState<TechnicianSkill[]>([]);
  const [openJobs, setOpenJobs] = useState<JobRequirement[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch technicians from the 'techs' table
      const { data: techsData, error: techsError } = await supabase
        .from('techs')
        .select('id, name, efficiency_by_type, is_available');

      if (techsError) {
        console.error("Error fetching technicians for AI Analyzer:", techsError);
        return;
      }

      const mappedTechs: TechnicianSkill[] = techsData.map(tech => ({
        id: tech.id,
        name: tech.name,
        skills: tech.efficiency_by_type || {},
        availability: tech.is_available ? 'available' : 'busy',
        currentLoad: 0, // Placeholder, would need to fetch from jobs/time_logs
        trainingNeeds: [], // Placeholder
      }));
      setTechnicians(mappedTechs);

      // Fetch open jobs from the 'jobs' table
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, truck_vin, job_type, priority, customer_concern');

      if (jobsError) {
        console.error("Error fetching jobs for AI Analyzer:", jobsError);
        return;
      }

      const mappedJobs: JobRequirement[] = jobsData.map(job => ({
        id: job.id,
        unitNumber: job.truck_vin || 'N/A',
        jobType: job.job_type,
        priority: job.priority as 'low' | 'medium' | 'high' | 'urgent',
        requiredSkills: [job.job_type], // Simple mapping for now, could be more complex
        isTrainingOpportunity: false, // Placeholder
      }));
      setOpenJobs(mappedJobs);

      calculateAssignments();
    };

    fetchData();

    const channel = supabase
      .channel('ai_analyzer_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateAssignments = () => {
    setIsAnalyzing(true);
    const suggestions: AssignmentSuggestion[] = [];
    openJobs.forEach(job => {
      let bestMatch: AssignmentSuggestion | null = null;
      
      technicians.forEach(tech => {
        // New Scoring Logic
        const skillLevel = tech.skills[job.requiredSkills[0]]?.level || 0;
        const skillScore = (skillLevel / 10) * 50; // 50% weight for skill
        const availabilityScore = tech.availability === 'available' ? 30 : 0; // 30% weight for availability
        const loadScore = (1 - Math.min(tech.currentLoad / 2, 1)) * 10; // 10% weight for load
        const trainingScore = tech.trainingNeeds.includes(job.requiredSkills[0]) && job.isTrainingOpportunity ? 20 : 0; // 20% bonus for training

        const confidenceScore = Math.round(skillScore + availabilityScore + loadScore + trainingScore);
        
        const reasoning = [
          `Skill Level: ${skillLevel}/10`,
          `Availability: ${tech.availability}`,
          `Training Opportunity: ${trainingScore > 0 ? 'Yes' : 'No'}`
        ];

        const suggestion: AssignmentSuggestion = {
          jobId: job.id,
          techId: tech.id,
          confidenceScore: Math.min(100, confidenceScore),
          reasoning,
          isTrainingAssignment: trainingScore > 0,
        };

        if (!bestMatch || suggestion.confidenceScore > bestMatch.confidenceScore) {
          bestMatch = suggestion;
        }
      });
      if (bestMatch) suggestions.push(bestMatch);
    });
    setAssignments(suggestions);
    setIsAnalyzing(false);
  };

  const getJobById = (id: string) => openJobs.find(job => job.id === id);
  const getTechById = (id: string) => technicians.find(tech => tech.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" /> AI Job Analyzer
        </h2>
        <Button onClick={calculateAssignments} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Recalculate"}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const job = getJobById(assignment.jobId);
          const tech = getTechById(assignment.techId);
          if (!job || !tech) return null;

          return (
            <Card key={assignment.jobId} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.unitNumber} - {job.jobType}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {assignment.confidenceScore}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Recommended: {tech.name}
                    </span>
                    {assignment.isTrainingAssignment && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <GraduationCap className="h-3 w-3 mr-1" /> Training
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    {assignment.reasoning.map((reason, idx) => <p key={idx}>• {reason}</p>)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Confidence Score</span>
                    <span>{assignment.confidenceScore}%</span>
                  </div>
                  <Progress value={assignment.confidenceScore} className="h-2" />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Assign to {tech.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};