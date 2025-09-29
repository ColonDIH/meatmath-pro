import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";

interface POSModalProps {
  organizationId: string;
  onClose: () => void;
}

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inventoryItemId?: string;
}

const saleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(z.object({
    inventoryItemId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    lineTotal: z.number().min(0, "Line total must be non-negative"),
  })),
  subtotal: z.number().min(0, "Subtotal must be non-negative"),
  taxAmount: z.number().min(0, "Tax amount must be non-negative"),
  total: z.number().min(0, "Total must be non-negative"),
});

export default function POSModal({ organizationId, onClose }: POSModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<string>("1");

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

  // Fetch inventory items
  const { data: inventoryItems } = useQuery({
    queryKey: ["/api/inventory", organizationId],
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

  // Form setup
  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = 0; // No tax for raw meat in most jurisdictions
    const total = subtotal + taxAmount;

    form.setValue("subtotal", subtotal);
    form.setValue("taxAmount", taxAmount);
    form.setValue("total", total);
    form.setValue("items", saleItems.map(item => ({
      inventoryItemId: item.inventoryItemId,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })));

    return { subtotal, taxAmount, total };
  };

  // Add item to sale
  const addItemToSale = () => {
    if (!selectedItemId || !itemQuantity) return;

    const item = inventoryItems?.find(i => i.id === selectedItemId);
    if (!item) return;

    const quantity = parseFloat(itemQuantity);
    if (isNaN(quantity) || quantity <= 0) return;

    const lineTotal = quantity * parseFloat(item.retailPrice);

    const newItem: SaleItem = {
      id: Date.now().toString(),
      name: item.name,
      quantity,
      unitPrice: parseFloat(item.retailPrice),
      lineTotal,
      inventoryItemId: item.id,
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedItemId("");
    setItemQuantity("1");
    
    // Update form totals
    setTimeout(calculateTotals, 100);
  };

  // Remove item from sale
  const removeItemFromSale = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
    setTimeout(calculateTotals, 100);
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof saleSchema>) => {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice
      const invoiceData = {
        organizationId,
        customerId: data.customerId,
        invoiceNumber,
        subtotal: data.subtotal.toFixed(2),
        taxAmount: data.taxAmount.toFixed(2),
        total: data.total.toFixed(2),
        status: "paid",
        dueDate: new Date().toISOString().split('T')[0],
        paidDate: new Date().toISOString().split('T')[0],
      };

      const invoiceResponse = await apiRequest("POST", "/api/invoices", invoiceData);
      const invoice = await invoiceResponse.json();

      // Create invoice items
      for (const item of data.items) {
        const itemData = {
          invoiceId: invoice.id,
          inventoryItemId: item.inventoryItemId,
          description: item.description,
          quantity: item.quantity.toFixed(2),
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
        };
        await apiRequest("POST", "/api/invoice-items", itemData);
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", organizationId] });
      toast({
        title: "Success",
        description: "Sale processed successfully",
      });
      setSaleItems([]);
      form.reset();
      onClose();
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
        description: "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof saleSchema>) => {
    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }
    createSaleMutation.mutate(data);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Sale</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Customer and Items */}
          <div className="space-y-4">
            <Form {...form}>
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
            </Form>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Add Items</h4>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${item.retailPrice}/{item.unitType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-20"
                  />
                  <Button onClick={addItemToSale} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {inventoryItems && inventoryItems.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No inventory items found. Add items to your inventory first.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sale Items and Totals */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Sale Items</h4>
              <Card>
                <CardContent className="p-4">
                  {saleItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No items added to sale
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {saleItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-foreground">
                              ${item.lineTotal.toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromSale(item.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Totals */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="text-sm text-foreground">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-border pt-2">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createSaleMutation.isPending || saleItems.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                {createSaleMutation.isPending ? "Processing..." : "Process Sale"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
