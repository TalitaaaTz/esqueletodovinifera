import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Thermometer, Droplets, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeaconsCardProps {
  microclima2Temp: number | null;
  microclima2Umidade: number | null;
  temperaturaCarga: number | null;
}

export const BeaconsCard = ({
  microclima2Temp,
  microclima2Umidade,
  temperaturaCarga,
}: BeaconsCardProps) => {
  const getVariant = (value: number | null, min: number, max: number) => {
    if (value === null) return "muted";
    if (value >= min && value <= max) return "healthy";
    return "warning";
  };

  const beacons = [
    {
      id: "microclima2",
      label: "Microclima 2",
      sensors: [
        {
          icon: Thermometer,
          label: "Temperatura",
          value: microclima2Temp,
          unit: "°C",
          variant: getVariant(microclima2Temp, 2, 6),
        },
        {
          icon: Droplets,
          label: "Umidade",
          value: microclima2Umidade,
          unit: "%",
          variant: getVariant(microclima2Umidade, 80, 92),
        },
      ],
    },
    {
      id: "carga",
      label: "Sensor de Carga",
      sensors: [
        {
          icon: Package,
          label: "Temp. Carga",
          value: temperaturaCarga,
          unit: "°C",
          variant: getVariant(temperaturaCarga, 2, 8),
        },
      ],
    },
  ];

  const variantClasses = {
    healthy: "text-[hsl(var(--vs-healthy))] bg-[hsl(var(--vs-healthy))]/8 border-[hsl(var(--vs-healthy))]/20",
    warning: "text-[hsl(var(--vs-warning))] bg-[hsl(var(--vs-warning))]/8 border-[hsl(var(--vs-warning))]/20",
    muted: "text-muted-foreground bg-muted/10 border-muted/20",
  };

  return (
    <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          Beacons / Sensores Adicionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {beacons.map((beacon) => (
          <div key={beacon.id} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {beacon.label}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {beacon.sensors.map((sensor, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2.5 p-3.5 rounded-xl border transition-all hover:scale-[1.01]",
                    variantClasses[sensor.variant as keyof typeof variantClasses]
                  )}
                >
                  <sensor.icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {sensor.label}
                    </p>
                    <p className="text-sm font-bold font-mono-data">
                      {sensor.value !== null
                        ? `${Number(sensor.value).toFixed(1)}${sensor.unit}`
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
