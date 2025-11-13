"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionData } from "@/lib/hooks/useSessionData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Meter {
  id: string;
  meterNumber: string;
  serialNumber: string;
  status: string;
  installationDate: string;
  replacedAt?: string;
  replacementReason?: string;
  isCurrentMeter: boolean;
  lastReading: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  connectionDate: string;
  meters: Meter[];
}

export default function ClientDetailsPage() {
  const { data: session } = useSessionData();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMeterDialogOpen, setIsAddMeterDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meterFormData, setMeterFormData] = useState({
    meterNumber: "",
    serialNumber: "",
  });

  useEffect(() => {
    if (session?.user.role !== "ADMIN") return;
    fetchClientDetails();
  }, [session, clientId]);

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast("Erro ao carregar dados do cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeter = async () => {
    if (!meterFormData.meterNumber || !meterFormData.serialNumber) {
      toast("Por favor preencha todos os campos");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          ...meterFormData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh client data
        await fetchClientDetails();
        setMeterFormData({
          meterNumber: "",
          serialNumber: "",
        });
        setIsAddMeterDialogOpen(false);
        toast("Contador adicionado com sucesso");
      } else {
        const error = await response.json();
        toast(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to add meter:", error);
      toast("Erro ao adicionar contador");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">Carregando dados do cliente...</div>
    );
  }

  if (!client) {
    return <div className="p-8 text-center">Cliente não encontrado</div>;
  }

  const currentMeter = client.meters?.find((m) => m.isCurrentMeter);
  const replacedMeters = client.meters?.filter((m) => !m.isCurrentMeter) || [];

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
        <h1 className="text-3xl font-bold text-neutral-dark">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-neutral-medium">
                  Email
                </Label>
                <p className="text-neutral-dark">{client.email}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-neutral-medium">
                  Telefone
                </Label>
                <p className="text-neutral-dark">{client.phone}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-neutral-medium">
                Morada
              </Label>
              <p className="text-neutral-dark">{client.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-neutral-medium">
                  Estado
                </Label>
                <Badge
                  className={
                    client.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {client.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-semibold text-neutral-medium">
                  Data de Registo
                </Label>
                <p className="text-neutral-dark">
                  {new Date(client.connectionDate).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Meter Card */}
        {currentMeter && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contador Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs ">Número</Label>
                  <p className="font-semibold">{currentMeter.meterNumber}</p>
                </div>
                <div>
                  <Label className="text-xs ">Série</Label>
                  <p className="font-semibold">{currentMeter.serialNumber}</p>
                </div>
                <div>
                  <Label className="text-xs ">Estado</Label>
                  <Badge className="bg-green-100 text-green-800">Activo</Badge>
                </div>
                <div>
                  <Label className="text-xs ">Última Leitura</Label>
                  <p className="font-semibold">{currentMeter.lastReading} m³</p>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link
                      href={`/dashboard/clients/${client.id}/invoices`}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Histórico
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Meter History */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos os Contadores ({client.meters?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="current">Actual</TabsTrigger>
          <TabsTrigger value="replaced">
            Histórico ({replacedMeters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={isAddMeterDialogOpen}
              onOpenChange={setIsAddMeterDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Contador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Contador</DialogTitle>
                  <DialogDescription>
                    Registar novo contador para este cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meter-number">Número do Contador</Label>
                    <Input
                      id="meter-number"
                      value={meterFormData.meterNumber}
                      onChange={(e) =>
                        setMeterFormData({
                          ...meterFormData,
                          meterNumber: e.target.value,
                        })
                      }
                      placeholder="CTR-002"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial-number">Número de Série</Label>
                    <Input
                      id="serial-number"
                      value={meterFormData.serialNumber}
                      onChange={(e) =>
                        setMeterFormData({
                          ...meterFormData,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="SN-2024-002"
                    />
                  </div>
                  <Button
                    onClick={handleAddMeter}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A adicionar..." : "Adicionar Contador"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {client.meters && client.meters.length > 0 ? (
              client.meters.map((meter) => (
                <Card key={meter.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            Nº {meter.meterNumber}
                          </p>
                          <p className="text-sm ">
                            Série: {meter.serialNumber}
                          </p>
                        </div>
                        <p className="text-xs ">
                          Instalado em:{" "}
                          {new Date(meter.installationDate).toLocaleDateString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        {meter.isCurrentMeter ? (
                          <Badge className="bg-green-100 text-green-800">
                            Actual
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge className="bg-blue-100 text-blue-800 block">
                              Substituído
                            </Badge>
                            {meter.replacedAt && (
                              <p className="text-xs ">
                                {new Date(meter.replacedAt).toLocaleDateString(
                                  "pt-PT"
                                )}
                              </p>
                            )}
                            {meter.replacementReason && (
                              <p className="text-xs ">
                                {meter.replacementReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center py-8 ">Nenhum contador registado</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="current">
          {currentMeter ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm ">Número</Label>
                      <p className="font-semibold text-lg">
                        {currentMeter.meterNumber}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm ">Série</Label>
                      <p className="font-semibold text-lg">
                        {currentMeter.serialNumber}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm ">Data de Instalação</Label>
                      <p className="font-semibold">
                        {new Date(
                          currentMeter.installationDate
                        ).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm ">Última Leitura</Label>
                      <p className="font-semibold">
                        {currentMeter.lastReading} m³
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center py-8 ">Nenhum contador activo</p>
          )}
        </TabsContent>

        <TabsContent value="replaced" className="space-y-2">
          {replacedMeters.length > 0 ? (
            replacedMeters.map((meter) => (
              <Card key={meter.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Nº {meter.meterNumber}</p>
                        <p className="text-sm ">Série: {meter.serialNumber}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Substituído
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs ">Data de Instalação</Label>
                        <p>
                          {new Date(meter.installationDate).toLocaleDateString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs ">Data de Substituição</Label>
                        <p>
                          {meter.replacedAt
                            ? new Date(meter.replacedAt).toLocaleDateString(
                                "pt-PT"
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>
                    {meter.replacementReason && (
                      <div>
                        <Label className="text-xs text-neutral-medium">
                          Motivo
                        </Label>
                        <p className="text-sm">{meter.replacementReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center py-8 text-neutral-medium">
              Nenhum contador no histórico
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
