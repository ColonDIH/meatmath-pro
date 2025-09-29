import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpeciesSchema, type Species } from "@shared/schema";
import { Plus, Edit, Trash2, Dog, TrendingUp, DollarSign } from "lucide-react";
import { z } from "zod";

const speciesFormSchema = insertSpeciesSchema;

export default function SpeciesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);

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

  // Fetch species
  const { data: species, isLoading: speciesLoading } = useQuery({
    queryKey: ["/api/species"],
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

  // Form setup
  const form = useForm<z.infer<typeof speciesFormSchema>>({
    resolver: zodResolver(speciesFormSchema),
    defaultValues: {
      name: "",
      category: "",
      liveToHangingRatio: "0.0000",
      hangingToRetailRatio: "0.0000",
      averageProcessingCost: "0.00",
      description: "",
    },
  });

  // Create species mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof speciesFormSchema>) => {
      await apiRequest("POST", "/api/species", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/species"] });
      setShowDialog(false);
      form.reset();
      setEditingSpecies(null);
      toast({
        title: "Success",
        description: "Species created successfully",
      });
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create species",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof speciesFormSchema>) => {
    createMutation.mutate(data);
  };

  const handleEdit = (speciesItem: Species) => {
    setEditingSpecies(speciesItem);
    form.reset({
      name: speciesItem.name,
      category: speciesItem.category,
      liveToHangingRatio: speciesItem.liveToHangingRatio,
      hangingToRetailRatio: speciesItem.hangingToRetailRatio,
      averageProcessingCost: speciesItem.averageProcessingCost || "0.00",
      description: speciesItem.description || "",
    });
    setShowDialog(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "beef":
        return "bg-red-100 text-red-800";
      case "pork":
        return "bg-pink-100 text-pink-800";
      case "lamb":
        return "bg-orange-100 text-orange-800";
      case "game":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateOverallYield = (liveToHanging: string, hangingToRetail: string) => {
    const lthr = parseFloat(liveToHanging);
    const hrtr = parseFloat(hangingToRetail);
    return ((lthr * hrtr) * 100).toFixed(1);
  };

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
          title="Species"
          subtitle="Manage animal species and their processing characteristics"
          actions={[
            {
              label: "Add Species",
              icon: "plus",
              onClick: () => {
                setEditingSpecies(null);
                form.reset({
                  name: "",
                  category: "",
                  liveToHangingRatio: "0.0000",
                  hangingToRetailRatio: "0.0000",
                  averageProcessingCost: "0.00",
                  description: "",
                });
                setShowDialog(true);
              },
              variant: "primary"
            }
          ]}
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          {speciesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !species || species.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Dog className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Species</h3>
                <p className="text-gray-500 text-center mb-6">
                  Get started by adding your first animal species with processing characteristics.
                </p>
                <Button 
                  onClick={() => setShowDialog(true)}
                  className="bg-primary hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Species
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {species.map((speciesItem) => (
                <Card key={speciesItem.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Dog className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{speciesItem.name}</CardTitle>
                          <CardDescription>
                            <Badge className={getCategoryColor(speciesItem.category)}>
                              {speciesItem.category}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-700">Overall Yield</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {calculateOverallYield(speciesItem.liveToHangingRatio, speciesItem.hangingToRetailRatio)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm font-medium text-gray-700">Processing Cost</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            ${speciesItem.averageProcessingCost || "0.00"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Live → Hanging</span>
                          <span className="text-sm font-medium">
                            {(parseFloat(speciesItem.liveToHangingRatio) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Hanging → Retail</span>
                          <span className="text-sm font-medium">
                            {(parseFloat(speciesItem.hangingToRetailRatio) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {speciesItem.description && (
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-2">{speciesItem.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(speciesItem)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                      >
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSpecies ? "Edit Species" : "Add New Species"}
            </DialogTitle>
            <DialogDescription>
              {editingSpecies ? "Update species processing characteristics" : "Create a new animal species with processing data"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Beef Cattle, Pork, Lamb" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beef">Beef</SelectItem>
                          <SelectItem value="pork">Pork</SelectItem>
                          <SelectItem value="lamb">Lamb</SelectItem>
                          <SelectItem value="game">Game</SelectItem>
                          <SelectItem value="poultry">Poultry</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="liveToHangingRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live to Hanging Ratio</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="0.6250"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hangingToRetailRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hanging to Retail Ratio</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="0.7420"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="averageProcessingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Processing Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="347.50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information about this species"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {editingSpecies ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
