import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore - Importing asset directly
import strategistImage from "@assets/IMG_1383_1768678517011.png";

interface FloatingCaddyProps {
  onActivate: () => void;
  isGameDetected: boolean;
  isVisible: boolean;
  isMinimized?: boolean;
}

export function FloatingCaddy({ onActivate, isGameDetected, isVisible, isMinimized = false }: FloatingCaddyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // CLINICAL MESSAGES - No conversational language
  useEffect(() => {
    if (isGameDetected && isVisible && !isMinimized) {
      const messages = [
        "ALLIANCE STATS: Intel available.",
        "ALLIANCE STATS: Review sand traps.",
        "ALLIANCE STATS: Check pace metrics.",
        "ALLIANCE STATS: Briefing ready.",
      ];
      
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          setMessage(messages[Math.floor(Math.random() * messages.length)]);
          setTimeout(() => setMessage(null), 3000);
        }
      }, 8000);
      
      return () => clearInterval(interval);
    }
  }, [isGameDetected, isVisible, isMinimized]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="floating-caddy"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: isMinimized ? 0.6 : 1, 
            rotate: 0,
            opacity: isMinimized ? 0.5 : 1
          }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="fixed bottom-8 right-8 z-[100]"
          drag
          dragConstraints={{ left: -300, right: 0, top: -300, bottom: 0 }}
          whileHover={{ scale: isMinimized ? 0.8 : 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onActivate}
        >
          {/* Status Indicator Ring - Ghost state has muted ring */}
          <div className={`absolute -inset-1 rounded-full transition-all duration-300 ${
            isMinimized 
              ? 'bg-white/10' 
              : isGameDetected 
                ? 'bg-primary animate-pulse' 
                : 'bg-white/20'
          }`} />
          
          {/* Avatar Container */}
          <div className={`relative rounded-full overflow-hidden border-2 bg-background shadow-2xl cursor-pointer transition-all duration-300 ${
            isMinimized ? 'w-10 h-10 border-white/30' : 'w-16 h-16 border-white'
          }`}>
            <img 
              data-testid="img-strategist"
              src={strategistImage} 
              alt="Caddy" 
              className={`w-full h-full object-cover object-top transition-all duration-300 ${isMinimized ? 'grayscale opacity-60' : ''}`}
            />
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Thought Bubble - Only show when not minimized */}
          <AnimatePresence>
            {!isMinimized && (message || isHovered) && (
              <motion.div
                data-testid="text-caddy-message"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="absolute bottom-full right-0 mb-3 w-52 bg-black text-primary p-3 rounded-lg rounded-br-none shadow-xl border border-primary/30"
              >
                <p className="text-xs font-mono font-bold">
                  {message || (isGameDetected ? "ALLIANCE STATS: Tap for briefing." : "ALLIANCE STATS: Standby.")}
                </p>
                <div className="absolute -bottom-2 right-4 w-3 h-3 bg-black transform rotate-45 border-r border-b border-primary/30" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Ghost State Indicator */}
          {isMinimized && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border border-black"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
