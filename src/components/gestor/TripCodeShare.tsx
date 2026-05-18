import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageCircle, Mail, Smartphone, Check, Share2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TripCodeShareProps {
  tripCode: string;
  onClose: () => void;
}

const SHARE_MESSAGE = (code: string) =>
  `Viagem criada no ViniferaSense.\n\nCódigo da Viagem: ${code}\n\nUse este código no app do motorista para iniciar a viagem.`;

export function TripCodeShare({ tripCode, onClose }: TripCodeShareProps) {
  const [copied, setCopied] = useState(false);

  const message = SHARE_MESSAGE(tripCode);
  const encodedMessage = encodeURIComponent(message);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Copiado!', description: 'Código copiado para a área de transferência.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Código de Viagem ViniferaSense: ${tripCode}`);
    window.open(`mailto:?subject=${subject}&body=${encodedMessage}`, '_blank');
  };

  const handleSMS = () => {
    window.open(`sms:?body=${encodedMessage}`, '_blank');
  };

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Viagem Criada!
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-3">
          <p className="text-sm text-muted-foreground">Código da Viagem</p>
          <Badge className="text-2xl font-mono px-6 py-2 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20">
            {tripCode}
          </Badge>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Compartilhe este código com o motorista para que ele possa iniciar a viagem.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleWhatsApp} className="gap-2 h-11">
            <MessageCircle className="h-4 w-4 text-green-500" />
            WhatsApp
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2 h-11">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button variant="outline" onClick={handleEmail} className="gap-2 h-11">
            <Mail className="h-4 w-4 text-blue-500" />
            E-mail
          </Button>
          <Button variant="outline" onClick={handleSMS} className="gap-2 h-11">
            <Smartphone className="h-4 w-4 text-orange-500" />
            SMS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
