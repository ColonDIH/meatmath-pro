import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, BarChart3, Users, DollarSign } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-background border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text">MeatMath Pro</h1>
              <p className="text-sm text-muted">Beef Processing Management</p>
            </div>
          </div>
          <Button onClick={handleLogin} className="bg-primary hover:bg-blue-600">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text mb-4">
            Complete SaaS Platform for Beef Processing Businesses
          </h2>
          <p className="text-xl text-muted max-w-3xl mx-auto">
            Streamline your operations with yield calculations, inventory management, 
            point-of-sale capabilities, and comprehensive business analytics.
          </p>
          <div className="mt-8">
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-primary hover:bg-blue-600 text-white px-8 py-3 text-lg"
            >
              Get Started Free
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-gray-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Yield Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Industry-standard calculations for processing efficiency with auto and manual modes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time business intelligence with comprehensive reporting and insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete customer profiles with order history and relationship tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Point of Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Professional invoicing with inventory management and tax compliance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Processing Business?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of processing facilities using MeatMath Pro to optimize their operations.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
