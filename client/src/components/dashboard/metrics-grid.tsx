import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dog, DollarSign, TrendingUp, Users } from "lucide-react";

interface MetricsGridProps {
  metrics: {
    totalAnimals: number;
    revenue: number;
    averageYield: number;
    activeCustomers: number;
  } | null;
  isLoading: boolean;
}

export default function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Total Animals Processed",
      value: metrics?.totalAnimals || 0,
      icon: Dog,
      color: "text-primary",
      change: "+12% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Revenue This Month",
      value: `$${(metrics?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      change: "+18% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Average Yield",
      value: `${(metrics?.averageYield || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      change: "+2.1% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Active Customers",
      value: metrics?.activeCustomers || 0,
      icon: Users,
      color: "text-blue-600",
      change: "+7 new this month",
      changeColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-semibold text-foreground">
                  {metric.value}
                </span>
                <span className={`text-sm ${metric.changeColor}`}>
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
