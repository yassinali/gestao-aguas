"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useSessionData } from "@/lib/hooks/useSessionData";
import { InvoicePDFButton } from "@/components/invoice-pdf-button";

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: { name: string };
  consumption: number;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  isOverdue: boolean;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function InvoicesHistoryPage() {
  const router = useRouter();
  const { data: session } = useSessionData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  useEffect(() => {
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")
    )
      return;

    const fetchInvoices = async () => {
      try {
        const response = await fetch(
          `/api/admin/invoices/list?status=${statusFilter}&page=${currentPage}`
        );
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
          setPagination(data.pagination);
        } else {
          toast("Erro ao carregar facturas");
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast("Erro ao carregar facturas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [session, statusFilter, currentPage]);

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

  const stats = {
    total: pagination?.totalCount || 0,
    pending: invoices.filter((i) => i.status === "PENDING" && !i.isOverdue)
      .length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    overdue: invoices.filter((i) => i.isOverdue).length,
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          Histórico de Facturas
        </h1>
        <p className="mt-2">Consulte todas as facturas geradas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-green-600">
              {stats.paid}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <div className="w-48">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="PAID">Pagas</SelectItem>
              <SelectItem value="OVERDUE">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Facturas</CardTitle>
          <CardDescription>Lista completa de facturas geradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando facturas...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">Nenhuma factura encontrada</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Factura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Consumo (m³)</TableHead>
                      <TableHead>Valor (MT)</TableHead>
                      <TableHead>Devendo (MT)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell>{invoice.client.name}</TableCell>
                        <TableCell>{invoice.consumption}</TableCell>
                        <TableCell className="font-semibold">
                          {Number(invoice.totalAmount).toFixed(2)} MT
                        </TableCell>
                        <TableCell
                          className={
                            invoice.isOverdue ? "text-red-600 font-bold" : ""
                          }
                        >
                          {Number(invoice.remainingAmount).toFixed(2)} MT
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString(
                            "pt-PT"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(
                              invoice.status,
                              invoice.isOverdue
                            )}
                          >
                            {getStatusLabel(invoice.status, invoice.isOverdue)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <InvoicePDFButton
                            invoiceId={invoice.id}
                            invoiceNumber={invoice.invoiceNumber}
                            status={invoice.status}
                            remainingAmount={invoice.remainingAmount}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-neutral-medium">
                  Página {pagination?.currentPage} de {pagination?.totalPages} (
                  {pagination?.totalCount} registos)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="gap-1 bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={
                      pagination ? currentPage >= pagination.totalPages : false
                    } // <-- aqui
                    className="gap-1"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
