import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertProcessingRecordSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface YieldCalculatorProps {
  organizationId: string;
  onClose?: () => void;
  embedded?: boolean;
}

const calculatorSchema = insertProcessingRecordSchema.extend({
  calculatorMode: z.enum(["auto", "manual"]).default("auto"),
});

export default function YieldCalculator({ organizationId, onClose, embedded = false }: YieldCalculatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatorMode, setCalculatorMode] = useState<"auto" | "manual">("auto");

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["/api/customers", organizationId],
    enabled: !!organizationId,
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

  // Fetch species
  const { data: species } = useQuery({
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
  const form = useForm<z.infer<typeof calculatorSchema>>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      organizationId,
      customerId: "",
      speciesId: "",
      processingDate: new Date().toISOString().split('T')[0],
      totalLiveWeight: "0",
      totalHangingWeight: "0",
      totalRetailWeight: "0",
      processingCost: "0",
      notes: "",
      status: "pending",
      calculatorMode: "auto",
    },
  });

  const watchedValues = form.watch();

  // Calculate yields based on species and mode
  const calculateYields = () => {
    if (!watchedValues.speciesId || !watchedValues.totalLiveWeight) return;

    const selectedSpecies = species?.find(s => s.id === watchedValues.speciesId);
    if (!selectedSpecies) return;

    const liveWeight = parseFloat(watchedValues.totalLiveWeight);
    if (isNaN(liveWeight) || liveWeight <= 0) return;

    if (calculatorMode === "auto") {
      const hangingWeight = liveWeight * parseFloat(selectedSpecies.liveToHangingRatio);
      const retailWeight = hangingWeight * parseFloat(selectedSpecies.hangingToRetailRatio);
      const processingCost = parseFloat(selectedSpecies.averageProcessingCost || "0");

      form.setValue("totalHangingWeight", hangingWeight.toFixed(2));
      form.setValue("totalRetailWeight", retailWeight.toFixed(2));
      form.setValue("processingCost", processingCost.toFixed(2));
    }
  };

  // Recalculate when relevant values change
  useState(() => {
    calculateYields();
  });

  // Save processing record mutation
  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof calculatorSchema>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { calculatorMode, ...recordData } = data;
      await apiRequest("POST", "/api/processing-records", recordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processing-records", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", organizationId] });
      toast({
        title: "Success",
        description: "Processing record saved successfully",
      });
      form.reset();
      if (onClose) onClose();
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
        description: "Failed to save processing record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof calculatorSchema>) => {
    saveMutation.mutate(data);
  };

  const calculateYieldPercentages = () => {
    const liveWeight = parseFloat(watchedValues.totalLiveWeight || "0");
    const hangingWeight = parseFloat(watchedValues.totalHangingWeight || "0");
    const retailWeight = parseFloat(watchedValues.totalRetailWeight || "0");

    const hangingYield = liveWeight > 0 ? (hangingWeight / liveWeight * 100).toFixed(1) : "0.0";
    const retailYield = hangingWeight > 0 ? (retailWeight / hangingWeight * 100).toFixed(1) : "0.0";

    return { hangingYield, retailYield };
  };

  const { hangingYield, retailYield } = calculateYieldPercentages();

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Yield Calculator</h3>
          <p className="text-sm text-muted-foreground">Calculate processing yields and costs</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Calculator Mode */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={calculatorMode === "auto" ? "default" : "outline"}
              onClick={() => setCalculatorMode("auto")}
              className="flex-1"
            >
              Auto Mode
            </Button>
            <Button
              type="button"
              variant={calculatorMode === "manual" ? "default" : "outline"}
              onClick={() => setCalculatorMode("manual")}
              className="flex-1"
            >
              Manual Mode
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="speciesId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Species</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Species" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {species?.map((speciesItem) => (
                        <SelectItem key={speciesItem.id} value={speciesItem.id}>
                          {speciesItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Weight Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="totalLiveWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setTimeout(calculateYields, 100);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalHangingWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hanging Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      readOnly={calculatorMode === "auto"}
                      className={calculatorMode === "auto" ? "bg-muted" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalRetailWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      readOnly={calculatorMode === "auto"}
                      className={calculatorMode === "auto" ? "bg-muted" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Processing Cost */}
          <FormField
            control={form.control}
            name="processingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Cost ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    readOnly={calculatorMode === "auto"}
                    className={calculatorMode === "auto" ? "bg-muted" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this processing session"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Yield Analysis */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Yield Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hanging Yield</p>
                  <p className="text-2xl font-semibold text-foreground">{hangingYield}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Retail Yield</p>
                  <p className="text-2xl font-semibold text-foreground">{retailYield}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Processing Cost</p>
                  <p className="text-2xl font-semibold text-foreground">
                    ${watchedValues.processingCost || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {saveMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  if (embedded) {
    return <div className="p-6">{content}</div>;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yield Calculator</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
