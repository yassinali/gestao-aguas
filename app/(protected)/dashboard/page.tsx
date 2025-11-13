"use client";

import { useSessionData } from "@/lib/hooks/useSessionData";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalClients?: number;
  pendingInvoices?: number;
  activeMeters?: number;
  totalCompanyRevenue?: number;
}

export default function DashboardPage() {
  const { data: session } = useSessionData();
  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user.role) return;

      try {
        if (session.user.role === "ADMIN" || session.user.role === "CASHIER") {
          const [clientRes, invoiceRes, meterRes, revenueRes] =
            await Promise.all([
              fetch("/api/admin/clients"),
              fetch("/api/admin/invoices"),
              fetch("/api/admin/meters"),
              fetch("/api/admin/company"),
            ]);

          if (clientRes.ok && invoiceRes.ok && meterRes.ok && revenueRes.ok) {
            const [clients, invoices, meters, company] = await Promise.all([
              clientRes.json(),
              invoiceRes.json(),
              meterRes.json(),
              revenueRes.json(),
            ]);

            setStats({
              totalClients: clients.clients?.length || 0,
              pendingInvoices:
                invoices.invoices?.filter((i: any) => i.status === "PENDING")
                  .length || 0,
              activeMeters:
                meters.meters?.filter((m: any) => m.status === "ACTIVE")
                  .length || 0,
              totalCompanyRevenue: company.company?.totalPaidRevenue || 0, // só PAID
            });
          }
        }
      } catch (error) {
        console.error("Erro ao obter estatísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  if (!session) return null; // evita renderizar antes do login

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-dark">Painel</h1>
      <p className="mt-2">
        Bem-vindo ao Sistema <strong>AquaFlow</strong>{" "}
        {session.user.role === "ADMIN" ? "Administração" : "Gestão"}
      </p>

      {isLoading ? (
        <div className="text-center py-8">Carregando o painel...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* Total Clients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalClients || 0}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Faturas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {stats.pendingInvoices || 0}
              </div>
            </CardContent>
          </Card>

          {/* Active Meters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Contadores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats.activeMeters || 0}
              </div>
            </CardContent>
          </Card>

          {/* Company Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Receita da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalCompanyRevenue || 0} MT
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
