import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "date-fns";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";

export default function Records() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // Fetch user organizations
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: isAuthenticated,
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Set default organization
  useState(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  });

  // Fetch processing records
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/processing-records", selectedOrg],
    enabled: !!selectedOrg,
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch customers for display
  const { data: customers } = useQuery({
    queryKey: ["/api/customers", selectedOrg],
    enabled: !!selectedOrg,
    retry: false,
  });

  // Fetch species for display
  const { data: species } = useQuery({
    queryKey: ["/api/species"],
    retry: false,
  });

  if (isLoading || orgsLoading || !selectedOrg) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Organization Found</h2>
          <p className="text-muted mb-6">You need to create or join an organization to continue.</p>
        </div>
      </div>
    );
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getSpeciesName = (speciesId: string) => {
    const spec = species?.find(s => s.id === speciesId);
    return spec?.name || "Unknown Species";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "invoiced":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar 
        organizations={organizations}
        selectedOrg={selectedOrg}
        onSelectOrg={setSelectedOrg}
        user={user}
      />
      
      <main className="flex-1 overflow-hidden">
        <Header
          title="Processing Records"
          subtitle="Manage your processing history and track yields"
          actions={[
            {
              label: "New Record",
              icon: "plus",
              onClick: () => {
                // Navigate to calculator
                window.location.href = "/calculator";
              },
              variant: "primary"
            }
          ]}
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          {recordsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !records || records.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Processing Records</h3>
                <p className="text-gray-500 text-center mb-6">
                  Get started by creating your first processing record using the yield calculator.
                </p>
                <Button 
                  onClick={() => window.location.href = "/calculator"}
                  className="bg-primary hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {records.map((record) => (
                <Card key={record.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {record.customerId ? getCustomerName(record.customerId) : "No Customer"}
                        </CardTitle>
                        <CardDescription>
                          {record.speciesId ? getSpeciesName(record.speciesId) : "Unknown Species"} • {formatDate(new Date(record.processingDate), "MMM d, yyyy")}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Live Weight</p>
                        <p className="text-lg font-semibold">{record.totalLiveWeight} lbs</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hanging Weight</p>
                        <p className="text-lg font-semibold">{record.totalHangingWeight || "N/A"} lbs</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Retail Weight</p>
                        <p className="text-lg font-semibold">{record.totalRetailWeight || "N/A"} lbs</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Processing Cost</p>
                        <p className="text-lg font-semibold">${record.processingCost || "0.00"}</p>
                      </div>
                    </div>
                    
                    {record.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
