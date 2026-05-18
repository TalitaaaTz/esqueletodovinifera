import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Search, CheckCircle, Loader2, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LinkedDevice {
  id: string;
  device_code: string;
  device_name: string;
  linked_at: string;
}

interface BeaconLinkCardProps {
  onDeviceChange?: (deviceCode: string | null) => void;
}

export const BeaconLinkCard = ({ onDeviceChange }: BeaconLinkCardProps = {}) => {
  const { user } = useAuthContext();
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  const fetchDevices = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setDevices(data as LinkedDevice[]);
    }
    setLoadingDevices(false);
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const handleLink = async () => {
    if (!user || !code.trim()) return;
    
    setLinking(true);
    try {
      const { error } = await supabase
        .from('user_devices')
        .insert({
          user_id: user.id,
          device_code: code.trim(),
          device_name: `Beacon ${code.trim()}`,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este beacon já está vinculado à sua conta');
        } else {
          toast.error('Erro ao vincular beacon: ' + error.message);
        }
      } else {
        toast.success(`Beacon ${code.trim()} vinculado com sucesso!`);
        setCode('');
        fetchDevices();
        onDeviceChange?.(code.trim());
      }
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (deviceId: string, deviceCode: string) => {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);

    if (!error) {
      toast.success(`Beacon ${deviceCode} desvinculado`);
      fetchDevices();
      onDeviceChange?.(null);
    }
  };

  return (
    <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          Vincular Beacon / Sensor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Código do beacon (ex: 1009)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="bg-background/50 border-border/50"
            onKeyDown={(e) => e.key === 'Enter' && handleLink()}
          />
          <Button
            onClick={handleLink}
            disabled={linking || !code.trim()}
            size="sm"
            className="shrink-0 gradient-vs-primary"
          >
            {linking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Insira o código do beacon para vincular à sua conta e receber os dados dos sensores.
        </p>

        {loadingDevices ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Beacons Vinculados
            </h4>
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--vs-healthy))]/20 bg-[hsl(var(--vs-healthy))]/5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--vs-healthy))]" />
                  <span className="text-sm font-semibold">{device.device_name}</span>
                  <Badge variant="outline" className="text-xs">
                    #{device.device_code}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleUnlink(device.id, device.device_code)}
                >
                  <Unlink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 text-center py-2">
            Nenhum beacon vinculado ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
};
