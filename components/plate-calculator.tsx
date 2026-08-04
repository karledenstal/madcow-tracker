'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  calculatePlates,
  formatPlateLoading,
  DEFAULT_PLATES,
  getBarWeight,
  setBarWeight,
  getEnabledPlates,
  setEnabledPlates,
} from '@/lib/plates';

interface PlateCalculatorProps {
  defaultWeight: number;
  open: boolean;
  onClose: () => void;
}

export function PlateCalculator({ defaultWeight, open, onClose }: PlateCalculatorProps) {
  const [weight, setWeight] = useState(defaultWeight.toString());
  const [barWeight, setBarWeightState] = useState(() => getBarWeight());
  const [enabledPlates, setEnabledPlatesState] = useState(() => getEnabledPlates());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (open) {
      setWeight(defaultWeight.toString());
    }
  }, [open, defaultWeight]);

  if (!open) return null;

  const targetWeight = parseFloat(weight) || 0;
  const calculation = calculatePlates(targetWeight, barWeight, enabledPlates);
  const formattedLoading = formatPlateLoading(calculation, barWeight);

  const handleBarWeightChange = (newWeight: number) => {
    setBarWeightState(newWeight);
    setBarWeight(newWeight);
  };

  const togglePlate = (plate: number) => {
    const newPlates = enabledPlates.includes(plate)
      ? enabledPlates.filter((p) => p !== plate)
      : [...enabledPlates, plate].sort((a, b) => b - a);
    setEnabledPlatesState(newPlates);
    setEnabledPlates(newPlates);
  };

  const copyToClipboard = () => {
    const text = `${targetWeight}kg = ${formattedLoading}`;
    navigator.clipboard.writeText(text).then(() => {
      // Brief feedback
      const btn = document.getElementById('copy-btn');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      }
    });
  };

  return (
    <div className="border-t border-border pt-3 mt-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Plate Calculator</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-10 w-10 text-xl"
          >
            ⚙
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-xl"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="space-y-3 p-3 bg-muted/30 rounded border border-border">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Bar weight (kg)</label>
            <div className="flex gap-2">
              {[15, 20].map((w) => (
                <Button
                  key={w}
                  variant={barWeight === w ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBarWeightChange(w)}
                  className="h-8 text-xs"
                >
                  {w}kg
                </Button>
              ))}
              <Input
                type="number"
                value={barWeight}
                onChange={(e) => handleBarWeightChange(parseFloat(e.target.value) || 20)}
                className="h-8 w-20 text-xs"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Available plates (kg)</label>
            <div className="flex flex-wrap gap-1">
              {DEFAULT_PLATES.map((plate) => (
                <Button
                  key={plate}
                  variant={enabledPlates.includes(plate) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlate(plate)}
                  className="h-7 text-xs"
                >
                  {plate}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weight input */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Target weight (kg)</label>
        <Input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-10 text-base"
        />
      </div>

      {/* Result */}
      {targetWeight > 0 && (
        <div className="space-y-2">
          <div className="p-3 bg-primary/10 rounded border border-primary/20">
            <div className="font-mono text-sm break-all">{formattedLoading}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Per side: {calculation.totalPerSide}kg
            </div>
          </div>

          {!calculation.reachable && calculation.roundedTo !== null && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              ⚠ Nearest achievable: {calculation.roundedTo}kg
            </div>
          )}

          {calculation.needsMicroplates && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              ℹ Requires microplates (&lt; 2.5kg)
            </div>
          )}

          <div className="flex gap-2">
            <Button
              id="copy-btn"
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex-1 h-9 text-xs"
            >
              📋 Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
