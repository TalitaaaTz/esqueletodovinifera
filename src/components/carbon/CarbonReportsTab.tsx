import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCarbonData } from '@/hooks/useCarbonData';
import { FileText, Download, FileSpreadsheet, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';

export const CarbonReportsTab = () => {
  const { kpis, filteredTrips, calculateTripEmissions, settings } = useCarbonData();

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const generateCSV = () => {
    if (filteredTrips.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const headers = [
      'Data',
      'Origem',
      'Destino',
      'Caminhão',
      'Peso (t)',
      'Distância (km)',
      'Diesel (L)',
      'CO₂ (kg)',
      'Emissões (tCO₂e)',
      'Árvores Equivalentes',
      'Custo Compensação (R$)',
      'Status',
    ];

    const rows = filteredTrips.map((trip) => {
      const emissions = calculateTripEmissions(trip);
      return [
        new Date(trip.data_viagem).toLocaleDateString('pt-BR'),
        trip.origem,
        trip.destino,
        trip.veiculo_placa || '',
        trip.peso_carga_tons.toFixed(1),
        trip.distancia_km.toString(),
        emissions.consumo_litros.toFixed(1),
        emissions.emissions_kg_co2.toFixed(1),
        emissions.emissions_tco2e.toFixed(6),
        Math.round(emissions.trees_equivalent).toString(),
        emissions.offset_cost_brl.toFixed(2),
        trip.status,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `viniferasense_carbon_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório CSV exportado com sucesso!');
  };

  const generatePDF = () => {
    if (filteredTrips.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permita pop-ups para gerar o PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>ViniferaSense - Relatório de Carbono</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #6b21a8; margin-bottom: 10px; }
          h2 { color: #22c55e; margin-top: 30px; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .kpi-card { background: #f3f4f6; padding: 20px; border-radius: 8px; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #6b21a8; }
          .kpi-label { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #6b21a8; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .methodology { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .methodology h3 { color: #1e40af; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ViniferaSense</h1>
        <p class="subtitle">Relatório de Emissões de Carbono - Transporte Rodoviário</p>
        <p>Período: ${dateStart ? new Date(dateStart).toLocaleDateString('pt-BR') : 'Início'} a ${dateEnd ? new Date(dateEnd).toLocaleDateString('pt-BR') : 'Presente'}</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

        <h2>Indicadores Principais</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${(kpis.total_emissions_tco2e * 1000).toFixed(1)} kg</div>
            <div class="kpi-label">Emissões Totais (kg CO₂)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${kpis.total_trips}</div>
            <div class="kpi-label">Total de Viagens</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${(kpis.avg_emissions_per_trip * 1000).toFixed(1)} kg</div>
            <div class="kpi-label">Média por Viagem (kg CO₂)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${kpis.total_diesel_liters.toFixed(1)} L</div>
            <div class="kpi-label">Diesel Total Consumido</div>
          </div>
          ${settings.show_trees_equivalent ? `
          <div class="kpi-card">
            <div class="kpi-value">${Math.round(kpis.trees_equivalent)}</div>
            <div class="kpi-label">Árvores Equivalentes</div>
          </div>
          ` : ''}
          ${settings.show_offset_cost ? `
          <div class="kpi-card">
            <div class="kpi-value">R$ ${kpis.offset_cost_brl.toFixed(2)}</div>
            <div class="kpi-label">Custo Estimado de Compensação</div>
          </div>
          ` : ''}
        </div>

        <h2>Detalhamento por Viagem</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Caminhão</th>
              <th>Distância (km)</th>
              <th>Diesel (L)</th>
              <th>CO₂ (kg)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTrips.map(trip => {
              const emissions = calculateTripEmissions(trip);
              return `
                <tr>
                  <td>${new Date(trip.data_viagem).toLocaleDateString('pt-BR')}</td>
                  <td>${trip.origem}</td>
                  <td>${trip.destino}</td>
                  <td>${trip.veiculo_placa || '-'}</td>
                  <td>${trip.distancia_km}</td>
                  <td>${emissions.consumo_litros.toFixed(1)}</td>
                  <td>${emissions.emissions_kg_co2.toFixed(1)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="methodology">
          <h3>Nota Metodológica</h3>
          <p><strong>Fator de Emissão:</strong> ${settings.emission_factor_kg_per_liter} kg CO₂ por litro de diesel</p>
          <p><strong>Média de Consumo:</strong> ${settings.default_km_per_liter} km/L (quando não informado)</p>
          <p><strong>Fórmula:</strong> Consumo (L) = Distância (km) ÷ Média (km/L) | CO₂ (kg) = Consumo (L) × ${settings.emission_factor_kg_per_liter}</p>
          <p><strong>Árvores Equivalentes:</strong> 1 árvore absorve aproximadamente 0,14 tCO₂e/ano</p>
          <p><strong>Custo de Compensação:</strong> Estimativa de R$ 39,00 por árvore plantada</p>
          <p><strong>Fonte:</strong> Fator de emissão baseado na média brasileira para diesel (GHG Protocol / Guia Transvias).</p>
        </div>

        <div class="footer">
          <p>ViniferaSense - Monitoramento Inteligente de Transporte de Frutas</p>
          <p>© ${new Date().getFullYear()} - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();

    toast.success('PDF pronto para impressão!');
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar Período
          </CardTitle>
          <CardDescription>
            Selecione o intervalo de datas para o relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-start">Data Início</Label>
              <Input
                id="report-start"
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end">Data Fim</Label>
              <Input
                id="report-end"
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={generatePDF}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-red-500/10">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Exportar PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Relatório completo com KPIs e nota metodológica
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={generateCSV}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-green-500/10">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Exportar CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Dados tabulados para análise em Excel ou Google Sheets
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Resumo do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold font-mono-data">{filteredTrips.length}</div>
              <div className="text-sm text-muted-foreground">Viagens</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold font-mono-data">
                {(kpis.total_emissions_tco2e * 1000).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">kg CO₂ Total</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold font-mono-data">
                {kpis.total_diesel_liters.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Litros Diesel</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold font-mono-data">
                {kpis.total_cargo_tons.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Toneladas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
