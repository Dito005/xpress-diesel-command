import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const fetchJobStatusData = async () => {
    const { data, error } = await supabase.from('jobs').select('status');
    if (error) throw error;

    const statusCounts = data.reduce((acc, job) => {
        const status = job.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, count]) => ({ name, count }));
};

export const JobStatusChart = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['jobStatusChart'],
        queryFn: fetchJobStatusData,
    });

    if (isLoading) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Jobs by Status</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent))' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                            }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};