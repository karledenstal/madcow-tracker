'use client';

import { useEffect, useState, useRef } from 'react';
import { formatRestTime } from '@/lib/rest';
import { Button } from '@/components/ui/button';

interface RestTimerProps {
  open: boolean;
  initialSeconds: number;
  exerciseName: string;
  onClose: () => void;
}

export function RestTimer({ open, initialSeconds, exerciseName, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Initialize end time when timer opens
  useEffect(() => {
    if (open && isRunning) {
      endTimeRef.current = Date.now() + remaining * 1000;
    }
  }, [open, isRunning]);

  // Main timer loop
  useEffect(() => {
    if (!open || !isRunning) return;

    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;

      const now = Date.now();
      const newRemaining = Math.ceil((endTimeRef.current - now) / 1000);

      if (newRemaining <= 0) {
        setRemaining(0);
        setIsRunning(false);
        handleTimerEnd();
      } else {
        setRemaining(newRemaining);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, isRunning]);

  // Wake Lock to keep screen on
  useEffect(() => {
    if (!open) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Wake Lock not supported or permission denied - not critical
        console.log('Wake Lock not available:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [open]);

  const handleTimerEnd = () => {
    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);

    // Beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Audio not available:', err);
    }

    // Vibrate (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const adjustTime = (delta: number) => {
    const newRemaining = Math.max(0, remaining + delta);
    setRemaining(newRemaining);
    if (isRunning) {
      endTimeRef.current = Date.now() + newRemaining * 1000;
    }
  };

  const setPreset = (seconds: number) => {
    setRemaining(seconds);
    setIsRunning(true);
    endTimeRef.current = Date.now() + seconds * 1000;
  };

  const togglePause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      // Resume
      setIsRunning(true);
      endTimeRef.current = Date.now() + remaining * 1000;
    }
  };

  if (!open) return null;

  const progress = initialSeconds > 0 ? (remaining / initialSeconds) * 100 : 0;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors ${
        showFlash ? 'bg-green-500' : 'bg-background'
      }`}
      onClick={(e) => {
        if (remaining === 0 && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl w-10 h-10 flex items-center justify-center"
        aria-label="Close"
      >
        ×
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-muted-foreground">{exerciseName}</h2>
          <p className="text-sm text-muted-foreground">
            {remaining === 0 ? 'Rest complete!' : 'Rest timer'}
          </p>
        </div>

        {/* Giant countdown */}
        <div className="text-[120px] font-bold font-mono leading-none tracking-tight">
          {formatRestTime(remaining)}
        </div>

        {/* Controls */}
        {remaining > 0 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => adjustTime(-15)}
              className="h-14 text-lg"
            >
              −15s
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={togglePause}
              className="h-14 w-24 text-lg"
            >
              {isRunning ? '⏸' : '▶'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => adjustTime(15)}
              className="h-14 text-lg"
            >
              +15s
            </Button>
          </div>
        )}

        {/* Quick presets */}
        {remaining > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Quick:</span>
            {[60, 90, 120, 180, 300].map((seconds) => (
              <Button
                key={seconds}
                variant="ghost"
                size="sm"
                onClick={() => setPreset(seconds)}
                className="h-8 text-xs"
              >
                {formatRestTime(seconds)}
              </Button>
            ))}
          </div>
        )}

        {/* Done state */}
        {remaining === 0 && (
          <Button size="lg" onClick={onClose} className="h-16 text-lg px-12">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
