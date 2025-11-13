"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSessionData } from "@/lib/hooks/useSessionData";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  status: string;
}

interface Payment {
  id: string;
  receiptNumber: string;
  invoice: {
    invoiceNumber: string;
  };
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  client: {
    name: string;
  };
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CARD", label: "Cartão" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "EMOLA", label: "Emola" },
  { value: "MPESA", label: "M-Pesa" },
];

export default function PaymentsPage() {
  const { data: session } = useSessionData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    amount: 0, // agora é número
    paymentMethod: "CASH",
    paymentReference: "",
    notes: "",
  });

  useEffect(() => {
    if (session?.user.role !== "CASHIER" && session?.user.role !== "ADMIN") return;

    const fetchData = async () => {
      try {
        const [invoicesRes, paymentsRes] = await Promise.all([
          fetch("/api/cashier/pending-invoices"),
          fetch("/api/cashier/payments"),
        ]);

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        }

        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Falha ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    const invoice = invoices.find((i) => i.id === invoiceId) || null;
    setSelectedInvoiceData(invoice);
    setFormData({
      ...formData,
      amount: invoice ? invoice.totalAmount : 0,
    });
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || formData.amount <= 0) {
      toast("Selecione uma fatura e introduza o valor");
      return;
    }

    const amount = Number(formData.amount);
    if (selectedInvoiceData && amount > selectedInvoiceData.totalAmount) {
      toast(`O valor excede o total da fatura de ${selectedInvoiceData.totalAmount} MT`);
      return;
    }

    setIsRecording(true);
    try {
      const response = await fetch("/api/cashier/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice,
          amount,
          paymentMethod: formData.paymentMethod,
          paymentReference: formData.paymentReference,
          notes: formData.notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to record payment");

      const data = await response.json();

      setFormData({ amount: 0, paymentMethod: "CASH", paymentReference: "", notes: "" });
      setSelectedInvoice("");
      setSelectedInvoiceData(null);
      setIsDialogOpen(false);

      // Atualizar dados
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch("/api/cashier/pending-invoices"),
        fetch("/api/cashier/payments"),
      ]);

      if (invoicesRes.ok) setInvoices((await invoicesRes.json()).invoices || []);
      if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments || []);

      toast(`Pagamento registado! Recibo: ${data.payment.receiptNumber}`);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast("Falha ao registar pagamento");
    } finally {
      setIsRecording(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentsToday = payments.filter((p) => {
    const paymentDate = new Date(p.paymentDate);
    const today = new Date();
    return paymentDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Pagamentos</h1>
          <p className="mt-2">Registar e acompanhar pagamentos de faturas</p>
        </div>

        {/* Dialogo de registo */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registar Pagamento</DialogTitle>
              <DialogDescription>
                Registe um novo pagamento para uma fatura
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Selecionar fatura */}
              <div>
                <Label htmlFor="invoice">Selecionar Fatura</Label>
                <Select value={selectedInvoice} onValueChange={handleInvoiceSelect}>
                  <SelectTrigger id="invoice">
                    <SelectValue placeholder="Escolha uma fatura..." />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.clientName} ({inv.totalAmount} MT)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Nenhuma fatura disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Total da fatura */}
              {selectedInvoiceData && (
                <div className="bg-neutral-light p-3 rounded-lg">
                  <p className="text-sm">Total da Fatura</p>
                  <p className="text-lg font-semibold text-neutral-dark">
                    {selectedInvoiceData.totalAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT
                  </p>
                </div>
              )}

              {/* Valor a pagar */}
              <div>
                <Label htmlFor="amount">Valor (MT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  placeholder="0,00"
                  disabled={!selectedInvoice}
                />
              </div>

              {/* Método de pagamento */}
              <div>
                <Label htmlFor="method">Método de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="method" disabled={!selectedInvoice}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Referência e notas */}
              <div>
                <Label htmlFor="reference">Referência do Pagamento</Label>
                <Input
                  id="reference"
                  value={formData.paymentReference}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentReference: e.target.value })
                  }
                  placeholder="ID da transação ou referência"
                  disabled={!selectedInvoice}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionais..."
                  disabled={!selectedInvoice}
                  className="text-sm"
                />
              </div>

              <Button
                onClick={handleRecordPayment}
                className="w-full"
                disabled={!selectedInvoice || formData.amount <= 0 || isRecording}
              >
                {isRecording ? "A registar..." : "Registar Pagamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalCollected.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagamentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{paymentsToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Recentes</CardTitle>
          <CardDescription>Últimos pagamentos registados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">A carregar pagamentos...</div>
          ) : payments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Nenhum pagamento registado ainda</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recibo #</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor (MT)</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                      <TableCell>{payment.invoice.invoiceNumber}</TableCell>
                      <TableCell>{payment.client.name}</TableCell>
                      <TableCell className="font-semibold">
                        {Number(payment.amount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
