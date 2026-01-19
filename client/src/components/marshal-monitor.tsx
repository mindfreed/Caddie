import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Zap, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";

interface MarshalMonitorProps {
  expectedRatePerMin?: number;
}

export function MarshalMonitor({ expectedRatePerMin = 12 }: MarshalMonitorProps) {
  const [isActive, setIsActive] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isStalled, setIsStalled] = useState(false);
  const [progressRate, setProgressRate] = useState(0);
  
  const sessionStart = useRef<number>(Date.now());
  const nudgeFiredForCurrentStall = useRef<boolean>(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - sessionStart.current;
        const elapsedMin = elapsedMs / 60000;
        setElapsed(elapsedMs);
        
        const currentRate = elapsedMin > 0 ? progressCount / elapsedMin : 0;
        setProgressRate(currentRate);
        
        // MARSHAL CORRECTION: if progressRate < expectedRate * 0.6
        const threshold = expectedRatePerMin * 0.6;
        if (elapsedMin >= 0.1 && currentRate < threshold && !nudgeFiredForCurrentStall.current) {
          nudgeFiredForCurrentStall.current = true;
          setIsStalled(true);
          executeMarshalNudge(currentRate, expectedRatePerMin);
        } else if (currentRate >= threshold) {
          nudgeFiredForCurrentStall.current = false;
          setIsStalled(false);
        }
      }, 100);
    } else {
      setElapsed(0);
      setProgressCount(0);
      setProgressRate(0);
      setIsStalled(false);
    }

    return () => clearInterval(interval);
  }, [isActive, expectedRatePerMin, progressCount]);

  const onProgressDetected = () => {
    setProgressCount(prev => prev + 1);
    nudgeFiredForCurrentStall.current = false;
    setIsStalled(false);
  };

  const executeMarshalNudge = (currentRate: number, expectedRate: number) => {
    const deficit = ((expectedRate * 0.6 - currentRate) / (expectedRate * 0.6) * 100).toFixed(0);
    toast({
      variant: "destructive",
      title: "ALLIANCE STATS: MARSHAL CORRECTION",
      description: `Progress rate ${currentRate.toFixed(1)}/min below threshold. ${deficit}% deficit.`,
      className: "border-destructive text-white bg-destructive/90 font-mono font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]",
      duration: 5000,
    });
  };

  const toggleSystem = () => {
    if (!isActive) {
      sessionStart.current = Date.now();
      setProgressCount(0);
      nudgeFiredForCurrentStall.current = false;
      setIsActive(true);
      toast({
        title: "ALLIANCE STATS: MARSHAL ACTIVE",
        description: `Pace monitoring engaged. Expected: ${expectedRatePerMin}/min. Threshold: ${(expectedRatePerMin * 0.6).toFixed(1)}/min.`,
        className: "border-primary text-primary bg-black font-mono",
      });
    } else {
      setIsActive(false);
      setIsStalled(false);
      setElapsed(0);
      setProgressCount(0);
      setProgressRate(0);
    }
  };

  const ratePercentage = Math.min(100, (progressRate / expectedRatePerMin) * 100);
  const thresholdLine = 60;

  return (
    <Card data-testid="card-marshal-monitor" className={`border-white/10 bg-black/60 backdrop-blur-md overflow-hidden transition-colors duration-500 ${isStalled ? 'border-destructive/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : ''}`}>
      <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Marshal Timer
        </CardTitle>
        <div data-testid="status-indicator-marshal" className={`w-2 h-2 rounded-full ${isActive ? (isStalled ? 'bg-destructive animate-ping' : 'bg-primary animate-pulse') : 'bg-muted-foreground/30'}`} />
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Status</div>
             <div data-testid="text-marshal-status" className={`text-xl font-display font-bold ${isActive ? (isStalled ? 'text-destructive' : 'text-primary') : 'text-muted-foreground'}`}>
               {isActive ? (isStalled ? 'VIOLATION' : 'OPTIMAL') : 'STANDBY'}
             </div>
          </div>
          <Button 
             data-testid="button-toggle-marshal"
             variant={isActive ? "destructive" : "default"} 
             size="sm" 
             onClick={toggleSystem}
             className={isActive ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50" : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"}
          >
             <PowerIcon />
             {isActive ? "STOP" : "START"}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>PROGRESS RATE</span>
            <span data-testid="text-progress-rate">{progressRate.toFixed(1)}/min (threshold: {(expectedRatePerMin * 0.6).toFixed(1)})</span>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
             <motion.div 
               className={`absolute inset-0 ${isStalled ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-green-600'}`}
               initial={{ width: "0%" }}
               animate={{ width: `${ratePercentage}%` }}
               transition={{ ease: "linear", duration: 0.1 }}
             />
             <div className="absolute top-0 bottom-0 w-[2px] bg-yellow-500/80" style={{ left: `${thresholdLine}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>COUNT: {progressCount}</span>
            <span>ELAPSED: {(elapsed / 1000).toFixed(0)}s</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center transition-colors hover:bg-white/10 group">
           <Button 
             data-testid="button-action-detected"
             disabled={!isActive}
             onClick={onProgressDetected}
             className="w-full h-12 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/50 font-display tracking-widest text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
           >
             <Zap className="w-5 h-5 mr-2" />
             ACTIVITY
           </Button>
           <p className="text-[10px] text-muted-foreground font-mono">
             {isActive ? "Register activity to reset timer" : "Marshal offline"}
           </p>
        </div>

        {isStalled && (
           <motion.div 
             data-testid="alert-pace-violation"
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive"
           >
             <AlertOctagon className="w-5 h-5 shrink-0" />
             <div className="space-y-1">
               <p className="font-bold font-display text-sm tracking-wide">ALLIANCE STATS: PACE VIOLATION</p>
               <p className="text-xs font-mono">Marshal correction issued. Resume immediately.</p>
             </div>
           </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function PowerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 mr-2"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" x2="12" y1="2" y2="12" />
    </svg>
  );
}
