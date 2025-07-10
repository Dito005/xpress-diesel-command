import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  metric: string;
  subtext: string;
  color: 'blue' | 'purple' | 'green';
  onClick?: () => void;
}

export const KpiCard = ({ title, metric, subtext, color, onClick }: KpiCardProps) => {
  const glowClasses = {
    blue: 'hover:shadow-glow-blue',
    purple: 'hover:shadow-glow-purple',
    green: 'hover:shadow-glow-green',
  };

  const borderClasses = {
    blue: 'border-neon-blue/30',
    purple: 'border-neon-purple/30',
    green: 'border-neon-green/30',
  }

  return (
    <Card className={`bg-slate-900/50 border-slate-800 group transition-all ${glowClasses[color]}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className={`w-2 h-2 rounded-full ${borderClasses[color].replace('border-', 'bg-')}`}></div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-50">{metric}</div>
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
        <Button
          variant="ghost"
          className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-50 px-0"
          onClick={onClick}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" /> View Detail
        </Button>
      </CardContent>
    </Card>
  );
};