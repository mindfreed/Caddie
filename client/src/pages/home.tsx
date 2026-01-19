import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, ShieldAlert, Target, Trophy, Activity, AlertTriangle, Smartphone, Power, Loader2, Lock, Unlock } from "lucide-react";
import { getGameIntelFromAPI, getAllGameIntel, parseGameIntel, type AllianceStat } from "@/lib/alliance-engine";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaddyBriefing } from "@/components/caddy-briefing";
import { MarshalMonitor } from "@/components/marshal-monitor";
import { FloatingCaddy } from "@/components/floating-caddy";
import { toast } from "@/hooks/use-toast";

const searchSchema = z.object({
  packageName: z.string().min(1, "Enter a package name"),
});

export default function Home() {
  const [intel, setIntel] = useState<AllianceStat | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingStat, setBriefingStat] = useState<AllianceStat | null>(null);
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCaddyMinimized, setIsCaddyMinimized] = useState(false);
  
  // ACCESSIBILITY PERMISSION STATE (simulates Android permission)
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState(true);
  const [isServiceConnected, setIsServiceConnected] = useState(false);
  
  // DETERMINISTIC TRIGGER: Track last package to prevent duplicate briefings
  const lastBriefedPackage = useRef<string | null>(null);

  // onServiceConnected callback - simulates Android AccessibilityService lifecycle
  const onServiceConnected = useCallback(() => {
    if (hasAccessibilityPermission) {
      setIsServiceConnected(true);
      toast({
        title: "ALLIANCE STATS: SERVICE CONNECTED",
        description: "Accessibility binding verified. Detection active.",
        className: "border-primary text-primary bg-black font-mono",
      });
    } else {
      setIsServiceConnected(false);
      toast({
        variant: "destructive",
        title: "ALLIANCE STATS: SYSTEM OFFLINE",
        description: "Permissions Required. Enable Accessibility Service.",
        className: "border-destructive text-destructive bg-black font-mono",
      });
    }
  }, [hasAccessibilityPermission]);

  // Simulate service connection on mount and permission change
  useEffect(() => {
    onServiceConnected();
  }, [onServiceConnected]);

  // Toggle permission (simulates user granting/revoking accessibility)
  const toggleAccessibilityPermission = () => {
    const newState = !hasAccessibilityPermission;
    setHasAccessibilityPermission(newState);
    
    if (!newState) {
      setIsServiceConnected(false);
      setIsServiceActive(false);
    }
  };

  const { data: allGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ["/api/game-intel"],
    queryFn: getAllGameIntel,
  });

  const sanctionedGames = allGames.filter(g => g.isSanctioned);

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      packageName: "",
    },
  });

  async function onSubmit(data: z.infer<typeof searchSchema>) {
    await handlePackageDetection(data.packageName);
  }

  const handlePackageDetection = async (pkg: string) => {
    // DETERMINISTIC TRIGGER: Prevent duplicate briefings for same package
    if (pkg === lastBriefedPackage.current) {
      return;
    }
    
    setIsSearching(true);
    setLastQuery(pkg);
    form.setValue("packageName", pkg);

    try {
      const result = await getGameIntelFromAPI(pkg);
      setIntel(result);

      if (isServiceActive) {
        if (result.isSanctioned) {
          // DETERMINISTIC: Only fire briefing ONCE per unique package
          lastBriefedPackage.current = pkg;
          setBriefingStat(result);
          setIsBriefingOpen(true);
          toast({
            title: "ALLIANCE STATS: TARGET ACQUIRED",
            description: `Sanctioned course detected: ${result.gameName}`,
            className: "border-primary text-primary bg-black font-mono",
          });
        } else {
          lastBriefedPackage.current = pkg;
          toast({
            variant: "destructive",
            title: "ALLIANCE STATS: NO PLAY RECOMMENDED",
            description: "Package not in alliance vault. Engagement not advised.",
            className: "border-destructive text-destructive bg-black font-mono",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ALLIANCE STATS: SYSTEM FAULT",
        description: "Database query failed. Retry operation.",
        className: "border-destructive text-destructive bg-black font-mono",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCaddyActivate = () => {
    if (isCaddyMinimized) {
      // Expand from ghost state
      setIsCaddyMinimized(false);
      return;
    }
    
    if (intel?.isSanctioned) {
      setBriefingStat(intel);
      setIsBriefingOpen(true);
    } else {
      toast({
        title: "ALLIANCE STATS: CADDY ONLINE",
        description: "Monitoring for sanctioned course activity.",
        className: "border-primary text-primary bg-black font-mono",
      });
    }
  };

  const handleBriefingClose = () => {
    setIsBriefingOpen(false);
    // Minimize to ghost state after acknowledgment
    setIsCaddyMinimized(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-full h-full cyber-grid opacity-20" />
      </div>

      <header className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between mb-12 z-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
             <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
             <Target className="w-10 h-10 text-primary relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white">
              strategic<span className="text-primary">Gamaerz</span> caddie
            </h1>
            <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Strategic Intel System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Accessibility Permission Toggle */}
           <button
             data-testid="toggle-accessibility-permission"
             onClick={toggleAccessibilityPermission}
             className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
               hasAccessibilityPermission 
                 ? 'bg-primary/10 border-primary/30 text-primary' 
                 : 'bg-destructive/10 border-destructive/30 text-destructive'
             }`}
           >
             {hasAccessibilityPermission ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
             <span className="text-[10px] font-mono uppercase">A11Y</span>
           </button>
           
           {/* Detection Service Toggle */}
           <div className={`flex items-center gap-2 bg-black/40 border rounded-full px-4 py-2 backdrop-blur-sm transition-all ${
             !isServiceConnected ? 'border-destructive/30 opacity-50' : 'border-white/10'
           }`}>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Detection</span>
              <button 
                data-testid="toggle-detection-service"
                onClick={() => {
                  if (!isServiceConnected) {
                    toast({
                      variant: "destructive",
                      title: "ALLIANCE STATS: SYSTEM OFFLINE",
                      description: "Permissions Required. Enable Accessibility Service.",
                      className: "border-destructive text-destructive bg-black font-mono",
                    });
                    return;
                  }
                  setIsServiceActive(!isServiceActive);
                }}
                disabled={!isServiceConnected}
                className={`w-8 h-4 rounded-full relative transition-colors ${isServiceActive && isServiceConnected ? 'bg-primary/20' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-300 ${isServiceActive && isServiceConnected ? 'bg-primary left-[calc(100%-14px)] shadow-[0_0_10px_theme(colors.primary.DEFAULT)]' : 'bg-muted-foreground left-[2px]'}`} />
              </button>
           </div>
           
           <div className="hidden md:flex items-center gap-2">
             <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 font-mono">v3.1.0</Badge>
             <div className={`w-2 h-2 rounded-full ${isServiceConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-destructive'}`} />
           </div>
        </div>
      </header>

      <main className="w-full max-w-2xl z-10 space-y-8">
        
        {/* Permission Denied Banner */}
        <AnimatePresence>
          {!isServiceConnected && (
            <motion.div
              data-testid="banner-permission-denied"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full"
            >
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-destructive tracking-wider">ALLIANCE STATS: SYSTEM OFFLINE</h3>
                    <p className="text-xs text-muted-foreground mt-1">Permissions Required. Enable Accessibility Service to activate detection.</p>
                  </div>
                  <Button
                    data-testid="button-grant-permission"
                    onClick={toggleAccessibilityPermission}
                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50 font-mono text-xs"
                  >
                    GRANT ACCESS
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Simulation Console */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`col-span-full md:col-span-2 bg-black/60 border-white/10 transition-opacity ${!isServiceConnected ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader className="py-3 px-4 border-b border-white/5">
              <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="w-3 h-3" />
                Course Detection Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Simulate app launch to trigger <span className="text-primary font-bold">Alliance Stats Detection</span>.
              </p>
              <div className="flex flex-wrap gap-2">
                 {isLoadingGames ? (
                   <div className="flex items-center gap-2 text-muted-foreground text-sm">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     ALLIANCE STATS: Loading vault...
                   </div>
                 ) : (
                   <>
                     {sanctionedGames.map(game => (
                        <Button 
                          key={game.packageName}
                          variant="outline"
                          data-testid={`launch-game-${game.id}`}
                          onClick={() => handlePackageDetection(game.packageName)}
                          disabled={isSearching || !isServiceConnected}
                          className="bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/50 text-white font-mono text-xs h-9"
                        >
                          {game.gameName}
                        </Button>
                      ))}
                      <Button 
                        variant="outline"
                        data-testid="launch-unknown-game"
                        onClick={() => handlePackageDetection("com.unknown.game")}
                        disabled={isSearching || !isServiceConnected}
                        className="bg-white/5 border-white/10 hover:bg-destructive/10 hover:border-destructive/50 text-white font-mono text-xs h-9"
                      >
                        Unknown App
                      </Button>
                   </>
                 )}
              </div>
            </CardContent>
          </Card>
          
          <div className="col-span-full md:col-span-1">
             <MarshalMonitor expectedRatePerMin={12} />
          </div>
        </div>

        {/* Manual Query Section */}
        <Card className="glass-panel border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="packageName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              data-testid="input-package-name"
                              placeholder="Package name..." 
                              {...field} 
                              className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground/50 font-mono h-12 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    data-testid="button-query"
                    disabled={isSearching}
                    className="bg-white/10 text-white hover:bg-white/20 border border-white/20 font-bold font-display tracking-wide h-12 w-32"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "QUERY"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {intel && (
            <motion.div
              key={lastQuery}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">ALLIANCE STATS: VAULT RECORD</span>
                {isServiceActive && intel.isSanctioned && (
                  <span className="text-[10px] font-mono text-primary flex items-center gap-1 animate-pulse">
                    <Power className="w-3 h-3" /> BRIEFING ACTIVE
                  </span>
                )}
              </div>
              
              <Card data-testid={`card-result-${intel.id}`} className={`overflow-hidden border-2 ${intel.isSanctioned ? 'border-primary/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-destructive/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]'} bg-black/60 backdrop-blur-xl`}>
                <div className={`h-1 w-full ${intel.isSanctioned ? 'bg-primary' : 'bg-destructive'}`} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle data-testid="text-game-name" className="text-3xl font-display uppercase tracking-widest text-white flex items-center gap-3">
                      {intel.gameName}
                    </CardTitle>
                    <p data-testid="text-package-name" className="font-mono text-sm text-muted-foreground mt-1">PKG: {lastQuery}</p>
                  </div>
                  {intel.isSanctioned ? (
                    <Badge data-testid="badge-sanctioned" variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1 font-display tracking-widest text-sm uppercase flex items-center gap-2">
                      <Shield className="w-4 h-4" /> SANCTIONED
                    </Badge>
                  ) : (
                    <Badge data-testid="badge-unauthorized" variant="outline" className="border-destructive text-destructive bg-destructive/10 px-3 py-1 font-display tracking-widest text-sm uppercase flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> NO PLAY
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-4">
                    <div className="p-4 rounded bg-white/5 border border-white/5 hover:border-primary/20 transition-colors group">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2 group-hover:text-primary transition-colors">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">Pace of Play</span>
                      </div>
                      <div data-testid="text-pace-of-play" className="text-lg font-sans font-semibold text-white">
                        {intel.paceOfPlay}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 rounded bg-white/5 border border-white/5 hover:border-secondary/20 transition-colors group">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2 group-hover:text-secondary transition-colors">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">Reality Check</span>
                      </div>
                      <div data-testid="text-reality-check" className="text-sm text-white">
                        {intel.realityCheck}
                      </div>
                    </div>
                  </div>
                  
                  {!intel.isSanctioned && (
                     <div data-testid="warning-unauthorized" className="col-span-full mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded flex items-center gap-3 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-mono text-sm font-bold">ALLIANCE STATS: NO PLAY RECOMMENDED</span>
                     </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!intel && (
          <div className="text-center py-12 opacity-30">
             <Target className="w-24 h-24 mx-auto mb-4 text-white/20" />
             <p className="font-mono text-sm text-white/40">ALLIANCE STATS: AWAITING TARGET</p>
          </div>
        )}
      </main>

      {/* Caddy Briefing Overlay */}
      {briefingStat && (
        <CaddyBriefing 
          isOpen={isBriefingOpen} 
          onClose={handleBriefingClose} 
          stat={briefingStat} 
        />
      )}
      
      {/* Footer / Scanlines */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-primary/20 z-50" />
      <div className="fixed top-0 left-0 w-full h-1 bg-primary/20 z-50" />
      <div className="pointer-events-none fixed inset-0 z-40 scanline opacity-10" />

      {/* Floating Caddy with Ghost State */}
      <FloatingCaddy 
        isVisible={isServiceActive} 
        isGameDetected={!!intel?.isSanctioned}
        isMinimized={isCaddyMinimized}
        onActivate={handleCaddyActivate}
      />
    </div>
  );
}
