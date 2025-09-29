import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  BarChart3, 
  ClipboardList, 
  Scissors, 
  Dog,
  ScanBarcode,
  Package,
  Users,
  FileText,
  Settings,
  ChevronDown,
  LogOut
} from "lucide-react";
import { type Organization, type User } from "@shared/schema";

interface SidebarProps {
  organizations: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (orgId: string) => void;
  user: User;
}

export default function Sidebar({ organizations, selectedOrg, onSelectOrg, user }: SidebarProps) {
  const [location] = useLocation();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const currentOrg = organizations.find(org => org.id === selectedOrg);

  const mainNavItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/calculator", label: "Calculator", icon: Calculator },
    { path: "/records", label: "Records", icon: ClipboardList },
    { path: "/cut-instructions", label: "Cut Instructions", icon: Scissors },
    { path: "/species", label: "Species", icon: Dog },
  ];

  const posNavItems = [
    { path: "/pos", label: "POS Dashboard", icon: ScanBarcode },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/invoices", label: "Invoices", icon: FileText },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col">
      {/* Logo and Organization */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">MeatMath Pro</h1>
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="truncate max-w-32">
                  {currentOrg?.name || "Select Organization"}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showOrgDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => {
                        onSelectOrg(org.id);
                        setShowOrgDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted first:rounded-t-md last:rounded-b-md"
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* POS Section */}
        <div className="pt-4">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Point of Sale
          </h3>
          {posNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <Badge variant="secondary" className="text-xs">
              Pro Plan
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
