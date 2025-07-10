import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
}

export const Steps = ({ steps, currentStep }: StepsProps) => (
  <div className="flex justify-between">
    {steps.map((step, index) => (
      <div key={index} className={cn(
        "flex-1 border-t-2 pt-4",
        index <= currentStep ? "border-primary" : "border-muted"
      )}>
        <div className="font-medium">{step.title}</div>
        <div className="text-sm text-muted-foreground">{step.description}</div>
      </div>
    ))}
  </div>
);