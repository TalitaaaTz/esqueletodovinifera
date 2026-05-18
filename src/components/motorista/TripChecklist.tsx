import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, Play, CheckCircle2 } from 'lucide-react';

interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
}

interface TripChecklistProps {
  onStartTrip: (checklist: Record<string, boolean>) => void;
  loading?: boolean;
}

export function TripChecklist({ onStartTrip, loading }: TripChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([
    { key: 'carga_conferida', label: 'Carga conferida', checked: false },
    { key: 'sensores_instalados', label: 'Sensores instalados', checked: false },
    { key: 'sistema_ligado', label: 'Sistema ligado', checked: false },
    { key: 'refrigeracao_verificada', label: 'Refrigeração verificada', checked: false },
    { key: 'rota_carregada', label: 'Rota carregada', checked: false },
  ]);

  const allChecked = items.every(i => i.checked);

  const toggle = useCallback((key: string) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, checked: !i.checked } : i));
  }, []);

  const handleStart = () => {
    const checklist: Record<string, boolean> = {};
    items.forEach(i => { checklist[`checklist_${i.key}`] = i.checked; });
    onStartTrip(checklist);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Checklist Pré-Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Checkbox
              id={item.key}
              checked={item.checked}
              onCheckedChange={() => toggle(item.key)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor={item.key} className="flex-1 cursor-pointer text-sm font-medium">
              {item.label}
            </Label>
            {item.checked && <CheckCircle2 className="h-4 w-4 text-accent" />}
          </div>
        ))}

        <Button
          onClick={handleStart}
          disabled={!allChecked || loading}
          className="w-full gap-2 mt-2"
          size="lg"
        >
          <Play className="h-4 w-4" />
          Iniciar Viagem
        </Button>

        {!allChecked && (
          <p className="text-xs text-muted-foreground text-center">
            Complete todos os itens para iniciar a viagem
          </p>
        )}
      </CardContent>
    </Card>
  );
}
