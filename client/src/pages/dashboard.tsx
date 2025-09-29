import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import RevenueChart from "@/components/dashboard/revenue-chart";
import SpeciesBreakdown from "@/components/dashboard/species-breakdown";
import RecentActivity from "@/components/dashboard/recent-activity";
import YieldCalculator from "@/components/calculator/yield-calculator";
import POSModal from "@/components/pos/pos-modal";
import { useDashboardStore } from "@/store/dashboard";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  
  const { 
    metrics, 
    setMetrics, 
    processingRecords, 
    setProcessingRecords,
    invoices,
    setInvoices
  } = useDashboardStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

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
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  // Fetch dashboard metrics
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard", selectedOrg],
    enabled: !!selectedOrg,
    retry: false,
    onSuccess: (data) => {
      setMetrics(data);
    },
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

  // Fetch processing records
  const { data: records } = useQuery({
    queryKey: ["/api/processing-records", selectedOrg],
    enabled: !!selectedOrg,
    retry: false,
    onSuccess: (data) => {
      setProcessingRecords(data);
    },
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

  // Fetch invoices
  const { data: invoiceData } = useQuery({
    queryKey: ["/api/invoices", selectedOrg],
    enabled: !!selectedOrg,
    retry: false,
    onSuccess: (data) => {
      setInvoices(data);
    },
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

  if (isLoading || orgsLoading || !selectedOrg) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    // This should not happen as the Router handles this case
    window.location.href = "/";
    return null;
  }

  const currentOrg = organizations.find(org => org.id === selectedOrg);

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
          title="Dashboard"
          subtitle="Welcome back, here's your business overview"
          actions={[
            {
              label: "New Processing",
              icon: "plus",
              onClick: () => setShowCalculator(true),
              variant: "primary"
            },
            {
              label: "New Sale",
              icon: "cash-register",
              onClick: () => setShowPOSModal(true),
              variant: "secondary"
            }
          ]}
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          <MetricsGrid 
            metrics={metrics}
            isLoading={metricsLoading}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RevenueChart organizationId={selectedOrg} />
            <SpeciesBreakdown 
              processingRecords={processingRecords}
              isLoading={!records}
            />
          </div>
          
          <RecentActivity 
            processingRecords={processingRecords}
            invoices={invoices}
            isLoading={!records || !invoiceData}
          />
        </div>
      </main>

      {showCalculator && (
        <YieldCalculator
          organizationId={selectedOrg}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {showPOSModal && (
        <POSModal
          organizationId={selectedOrg}
          onClose={() => setShowPOSModal(false)}
        />
      )}
    </div>
  );
}
