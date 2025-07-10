import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  metric: string;
  subtext: string;
  onClick?: () => void;
}

export const KpiCard = ({ title, metric, subtext, onClick }: KpiCardProps) => {
  return (
    <Card className="bg-card border-border group transition-all hover:shadow-glow-orange hover:border-primary/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-2 h-2 rounded-full bg-primary/50"></div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{metric}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        {onClick && (
          <Button
            variant="ghost"
            className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground px-0"
            onClick={onClick}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" /> View Detail
          </Button>
        )}
      </CardContent>
    </Card>
  );
};