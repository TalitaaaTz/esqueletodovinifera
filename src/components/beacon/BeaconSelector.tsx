import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, ChevronDown, Signal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TripBeacon {
  id: string;
  device_code: string;
  device_name: string;
  trip_id: string;
}

interface BeaconSelectorProps {
  selectedDeviceId: string | undefined;
  onSelect: (deviceCode: string | undefined) => void;
}

export const BeaconSelector = ({ selectedDeviceId, onSelect }: BeaconSelectorProps) => {
  const { user } = useAuthContext();
  const [devices, setDevices] = useState<TripBeacon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripBeacons = async () => {
      if (!user) return;
      const { data: trips } = await supabase
        .from('trips')
        .select('id')
        .or(`gestor_id.eq.${user.id},motorista_id.eq.${user.id}`);

      if (!trips || trips.length === 0) {
        setDevices([]);
        setLoading(false);
        return;
      }

      const tripIds = trips.map(t => t.id);
      const { data: beacons, error } = await supabase
        .from('trip_beacons')
        .select('*')
        .in('trip_id', tripIds);

      if (!error && beacons) {
        const unique = beacons.reduce((acc: TripBeacon[], b) => {
          if (!acc.find(x => x.device_code === b.device_code)) {
            acc.push(b as TripBeacon);
          }
          return acc;
        }, []);
        setDevices(unique);
        if (!selectedDeviceId && unique.length > 0) {
          onSelect(unique[0].device_code);
        }
      }
      setLoading(false);
    };
    fetchTripBeacons();
  }, [user]);

  if (loading || devices.length === 0) return null;

  const selectedDevice = devices.find(d => d.device_code === selectedDeviceId);

  return (
    <div className="flex items-center gap-2">
      <Signal className="h-4 w-4 text-primary" />
      <span className="text-sm text-muted-foreground">Beacon:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 min-w-[140px] justify-between">
            <span className="truncate">
              {selectedDevice ? selectedDevice.device_name : 'Todos'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onSelect(undefined)}>
            <Radio className="h-3.5 w-3.5 mr-2" />
            Todos os beacons
          </DropdownMenuItem>
          {devices.map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onSelect(device.device_code)}
              className={cn(selectedDeviceId === device.device_code && 'bg-accent')}
            >
              <Signal className="h-3.5 w-3.5 mr-2" />
              {device.device_name}
              <Badge variant="outline" className="ml-auto text-[10px]">
                #{device.device_code}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
