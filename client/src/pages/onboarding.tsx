import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Building2, Users, CheckCircle } from "lucide-react";
import CreateOrganizationModal from "@/components/organization/create-organization-modal";

export default function Onboarding() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateOrganization = () => {
    setShowCreateModal(true);
  };

  const handleOrganizationCreated = (orgId: string) => {
    // After organization is created, redirect to dashboard
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">MeatMath Pro</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.firstName || "User"}!</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/logout"}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Welcome to MeatMath Pro!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's get you set up with your processing facility. You'll need to create an organization 
            to start managing your operations.
          </p>
        </div>

        {/* Setup Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border border-border relative">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">1. Create Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Set up your processing facility with basic information and settings.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-border opacity-50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">2. Add Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Invite your team members and set up their roles and permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-border opacity-50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">3. Start Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Begin using the yield calculator, manage inventory, and track customers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Action Card */}
        <Card className="border border-border bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Create your organization to access all features of MeatMath Pro.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleCreateOrganization}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Create Your Organization
            </Button>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-foreground mb-8 text-center">
            What you'll get with MeatMath Pro:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-medium text-foreground">Yield Calculator</h4>
              <p className="text-sm text-muted-foreground">Precise processing calculations</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-medium text-foreground">Customer Management</h4>
              <p className="text-sm text-muted-foreground">Track customer relationships</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-medium text-foreground">Inventory Management</h4>
              <p className="text-sm text-muted-foreground">Real-time stock tracking</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-medium text-foreground">Business Analytics</h4>
              <p className="text-sm text-muted-foreground">Comprehensive reporting</p>
            </div>
          </div>
        </div>
      </main>

      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  );
}