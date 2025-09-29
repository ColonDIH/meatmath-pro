import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface RevenueChartProps {
  organizationId: string;
}

export default function RevenueChart({ organizationId }: RevenueChartProps) {
  const [period, setPeriod] = useState("30");

  // Mock data for demonstration - in real app, this would come from API
  const chartData = [
    { week: "Week 1", value: 65 },
    { week: "Week 2", value: 78 },
    { week: "Week 3", value: 92 },
    { week: "Week 4", value: 70 },
    { week: "Week 5", value: 85 },
    { week: "Week 6", value: 98 },
    { week: "Week 7", value: 73 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Revenue Trend</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-center space-x-2">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="w-8 bg-primary rounded-t transition-all duration-500 hover:bg-primary/80"
              style={{ 
                height: `${(item.value / maxValue) * 200}px`,
                opacity: 0.8 + (item.value / maxValue) * 0.2
              }}
              title={`${item.week}: ${item.value}%`}
            />
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-4 text-sm text-muted-foreground">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
      </CardContent>
    </Card>
  );
}
