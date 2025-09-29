import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type ProcessingRecord } from "@shared/schema";

interface SpeciesBreakdownProps {
  processingRecords: ProcessingRecord[];
  isLoading: boolean;
}

export default function SpeciesBreakdown({ processingRecords, isLoading }: SpeciesBreakdownProps) {
  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Species Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate species breakdown from processing records
  const speciesBreakdown = processingRecords?.reduce((acc, record) => {
    const speciesName = record.speciesId || "Unknown";
    if (!acc[speciesName]) {
      acc[speciesName] = { count: 0, name: speciesName };
    }
    acc[speciesName].count += 1;
    return acc;
  }, {} as Record<string, { count: number; name: string }>);

  const totalRecords = processingRecords?.length || 0;
  const speciesData = Object.values(speciesBreakdown || {});

  const colors = [
    "bg-primary",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-yellow-500",
  ];

  const speciesNames = {
    "beef": "Beef Cattle",
    "pork": "Pork",
    "lamb": "Lamb",
    "deer": "Deer",
    "game": "Game"
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Species Processing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {speciesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processing records found
            </div>
          ) : (
            speciesData.map((species, index) => {
              const percentage = totalRecords > 0 ? (species.count / totalRecords * 100).toFixed(1) : "0.0";
              return (
                <div key={species.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm font-medium text-foreground">
                      {speciesNames[species.name as keyof typeof speciesNames] || species.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {species.count} animals
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
