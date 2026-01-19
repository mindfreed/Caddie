import { motion, AnimatePresence } from "framer-motion";
import { Shield, Trophy, Activity, X, Crosshair, Cpu, AlertTriangle, Clock, Target, DollarSign, TrendingUp, Layers, Zap } from "lucide-react";
import { type AllianceStat, parseGameIntel } from "@/lib/alliance-engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CaddyBriefingProps {
  isOpen: boolean;
  onClose: () => void;
  stat: AllianceStat;
}

export function CaddyBriefing({ isOpen, onClose, stat }: CaddyBriefingProps) {
  const parsed = parseGameIntel(stat);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div data-testid="modal-briefing" className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            data-testid="backdrop-briefing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-lg pointer-events-auto relative max-h-[90vh]"
          >
            {/* Decorative Borders */}
            <div className={`absolute -inset-[2px] bg-gradient-to-b ${parsed.isSanctioned ? 'from-primary via-transparent to-primary' : 'from-destructive via-transparent to-destructive'} opacity-50 rounded-lg blur-sm`} />
            
            <Card className="bg-black/90 border-primary/50 text-foreground overflow-hidden relative shadow-[0_0_50px_rgba(34,197,94,0.15)]">
              {/* Header */}
              <div className={`relative p-6 border-b ${parsed.isSanctioned ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${parsed.isSanctioned ? 'via-primary' : 'via-destructive'} to-transparent opacity-50`} />
                
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 ${parsed.isSanctioned ? 'text-primary' : 'text-destructive'} text-xs font-mono tracking-widest`}>
                    <Cpu className="w-4 h-4" />
                    <span>GAMERGUIDE AI CADDIE</span>
                  </div>
                  <Button data-testid="button-close-briefing" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <h2 data-testid="text-briefing-title" className="text-3xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    {parsed.gameName}
                  </h2>
                  {parsed.isSanctioned ? (
                    <Badge className="bg-primary/20 text-primary border-primary/50">
                      <Shield className="w-3 h-3 mr-1" /> SANCTIONED
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/50">
                      <AlertTriangle className="w-3 h-3 mr-1" /> NO PLAY
                    </Badge>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="max-h-[60vh]">
                <div className="p-6 space-y-6">
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pace of Play
                      </label>
                      <div data-testid="text-pace-of-play" className="text-sm font-bold text-white">{parsed.paceOfPlay}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Target className="w-3 h-3" /> Reality Check
                      </label>
                      <div data-testid="text-reality-check" className="text-sm font-bold text-white">{parsed.realityCheck}</div>
                    </div>
                  </div>

                  {/* Phases Section */}
                  {parsed.phases.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono text-secondary uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Progression Phases ({parsed.phases.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {parsed.phases.map((phase, index) => (
                          <div 
                            key={index}
                            data-testid={`phase-${index}`}
                            className={`p-3 rounded-lg border ${
                              phase.sanctioned 
                                ? 'bg-primary/10 border-primary/20' 
                                : 'bg-destructive/10 border-destructive/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white uppercase">{phase.phase}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${
                                  phase.sanctioned 
                                    ? 'border-primary/50 text-primary' 
                                    : 'border-destructive/50 text-destructive'
                                }`}
                              >
                                {phase.sanctioned ? 'GO' : 'CAUTION'}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              LVL {phase.levelRange}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Zap className={`w-3 h-3 ${
                                phase.expectedVelocity === 'Fast' ? 'text-primary' :
                                phase.expectedVelocity === 'Moderate' ? 'text-yellow-500' : 'text-destructive'
                              }`} />
                              <span className={`text-[10px] font-mono ${
                                phase.expectedVelocity === 'Fast' ? 'text-primary' :
                                phase.expectedVelocity === 'Moderate' ? 'text-yellow-500' : 'text-destructive'
                              }`}>
                                {phase.expectedVelocity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sand Traps Section */}
                  {parsed.sandTraps.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono text-destructive uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Sand Traps ({parsed.sandTraps.length})
                      </h3>
                      <div className="space-y-2">
                        {parsed.sandTraps.map((trap, index) => (
                          <div 
                            key={index}
                            data-testid={`sand-trap-${index}`}
                            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">
                                Level {trap.level}
                              </Badge>
                              <span className="text-[10px] font-mono text-destructive uppercase">{trap.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{trap.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Clubs Section */}
                  {parsed.suggestedClubs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono text-primary uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Suggested Clubs ({parsed.suggestedClubs.length})
                      </h3>
                      <div className="space-y-2">
                        {parsed.suggestedClubs.map((club, index) => (
                          <div 
                            key={index}
                            data-testid={`suggested-club-${index}`}
                            className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <div className="text-[10px] font-mono text-muted-foreground uppercase">{club.stage}</div>
                              <div className="text-sm font-bold text-white">{club.club}</div>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                              {club.cost}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offers Section with HAZARD Evaluation */}
                  {parsed.offerEvaluations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono text-secondary uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Offer Analysis ({parsed.offerEvaluations.length})
                      </h3>
                      <div className="space-y-2">
                        {parsed.offerEvaluations.map((evaluation, index) => (
                          <div 
                            key={evaluation.offer.id}
                            data-testid={`offer-${index}`}
                            className={`p-3 rounded-lg border ${
                              evaluation.isHazard 
                                ? 'bg-destructive/10 border-destructive/30' 
                                : 'bg-primary/10 border-primary/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{evaluation.offer.name}</span>
                                {evaluation.isHazard && (
                                  <Badge 
                                    data-testid={`hazard-badge-${index}`}
                                    className="bg-destructive/20 text-destructive border-destructive/50 text-[10px] uppercase"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" /> HAZARD
                                  </Badge>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${
                                  evaluation.isHazard 
                                    ? 'border-destructive/50 text-destructive' 
                                    : 'border-primary/50 text-primary'
                                }`}
                              >
                                ${(evaluation.offer.priceCents / 100).toFixed(2)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                              <div>
                                <span className="text-muted-foreground">RESOURCES:</span>
                                <span className="text-white ml-1">{evaluation.offer.resourceAmount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">COST/RES:</span>
                                <span className="text-white ml-1">{evaluation.costPerResource.toFixed(2)}c</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`w-3 h-3 ${evaluation.isHazard ? 'text-destructive' : 'text-primary'}`} />
                                <span className={evaluation.isHazard ? 'text-destructive' : 'text-primary'}>
                                  {evaluation.markupPercent > 0 ? '+' : ''}{evaluation.markupPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            {evaluation.isHazard && evaluation.hazardReason && (
                              <p className="text-[10px] text-destructive mt-2 font-mono">
                                ALLIANCE STATS: {evaluation.hazardReason}. NOT RECOMMENDED.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Recommendations Warning */}
                  {!parsed.isSanctioned && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                      <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm font-bold text-destructive">ALLIANCE STATS: NO PLAY RECOMMENDED</p>
                      <p className="text-xs text-muted-foreground mt-1">Course not in alliance vault.</p>
                    </div>
                  )}

                  {/* Action Button - "Are you ready?" equivalent */}
                  <Button 
                    data-testid="button-acknowledge-intel" 
                    onClick={onClose} 
                    className={`w-full ${parsed.isSanctioned ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30' : 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30'} border font-display tracking-widest h-12 uppercase group relative overflow-hidden`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Crosshair className="w-4 h-4" /> ACKNOWLEDGED
                    </span>
                  </Button>
                </div>
              </ScrollArea>
              
              {/* Footer */}
              <div className={`h-1 w-full bg-gradient-to-r from-transparent ${parsed.isSanctioned ? 'via-primary/30' : 'via-destructive/30'} to-transparent`} />
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
