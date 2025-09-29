import { Button } from "@/components/ui/button";
import { Plus, ScanBarcode } from "lucide-react";

interface HeaderAction {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "plus":
        return Plus;
      case "cash-register":
        return ScanBarcode;
      default:
        return Plus;
    }
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center space-x-4">
            {actions.map((action, index) => {
              const Icon = getIcon(action.icon);
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant === "secondary" ? "outline" : "default"}
                  className={action.variant === "primary" ? "bg-primary hover:bg-primary/90" : ""}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
