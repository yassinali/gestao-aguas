"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionData } from "@/lib/hooks/useSessionData";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  consumption: number;
  totalAmount: number;
  payments: Payment[];
  status: string;
  isOverdue: boolean;
  issuanceDate: string;
  dueDate: string;
  remainingAmount?: number; // Calculado dinamicamente
}

interface Client {
  name: string;
}

export default function ClientInvoicesPage() {
  const { data: session } = useSessionData();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  if (!session?.user || session.user.role !== "ADMIN") return;

  const fetchClientInvoices = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/client?clientId=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");

      const data = await response.json();
      if (data.invoices.length > 0) setClientName(data.invoices[0].client.name);

      // Calcula remainingAmount direto
      const invoicesWithRemaining = data.invoices.map((inv: any) => ({
        ...inv,
        remainingAmount: inv.totalAmount - (inv.payments?.reduce((a: number, p: any) => a + (p.amount || 0), 0) || 0)
      }));

      setInvoices(invoicesWithRemaining);
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar facturas");
    } finally {
      setIsLoading(false);
    }
  };

  fetchClientInvoices();
}, [session, clientId, toast]);

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return "bg-red-100 text-red-800";
    if (status === "PAID") return "bg-green-100 text-green-800";
    if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string, isOverdue: boolean) => {
    if (isOverdue) return "ATRASADA";
    return status;
  };

  // Stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter(
      (i) => (i.remainingAmount || 0) > 0 && !i.isOverdue
    ).length,
    paid: invoices.filter((i) => (i.remainingAmount || 0) === 0).length,
    overdue: invoices.filter(
      (i) => (i.remainingAmount || 0) > 0 && i.isOverdue
    ).length,
    totalDue: invoices
      .filter((i) => (i.remainingAmount || 0) > 0)
      .reduce((sum, i) => sum + (i.remainingAmount || 0), 0),
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">
            Facturas de {clientName}
          </h1>
          <p className=" mt-1">Histórico completo de facturas do cliente</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Devendo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalDue.toFixed(2)} MT
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Facturas</CardTitle>
          <CardDescription>Histórico individual de facturas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando facturas...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">Nenhuma factura encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Consumo (m³)</TableHead>
                    <TableHead>Valor (MT)</TableHead>
                    <TableHead>Devendo (MT)</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className={invoice.isOverdue ? "bg-red-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.consumption}</TableCell>
                      <TableCell className="font-semibold">
                        {Number(invoice.totalAmount).toFixed(2)} MT
                      </TableCell>
                      <TableCell
                        className={invoice.isOverdue ? "text-red-600 font-bold" : ""}
                      >
                        {Number(invoice.remainingAmount || 0).toFixed(2)} MT
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.issuanceDate).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(invoice.status, invoice.isOverdue)}
                        >
                          {getStatusLabel(invoice.status, invoice.isOverdue)}
                        </Badge>
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
