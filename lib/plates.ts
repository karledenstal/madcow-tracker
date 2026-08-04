/**
 * Plate calculator for barbell loading
 */

export const DEFAULT_BAR_WEIGHT = 20; // kg
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]; // kg, per side

export interface PlateCount {
  [plate: number]: number;
}

export interface PlateCalculation {
  perSide: PlateCount;
  totalPerSide: number;
  totalWeight: number;
  reachable: boolean;
  roundedTo: number | null;
  needsMicroplates: boolean;
}

/**
 * Calculate which plates to load on each side of the bar
 * @param targetWeight Total weight including bar (kg)
 * @param barWeight Weight of the bar (kg)
 * @param enabledPlates Available plate weights (kg), sorted largest to smallest
 * @returns Plate loading calculation
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number = DEFAULT_BAR_WEIGHT,
  enabledPlates: number[] = DEFAULT_PLATES
): PlateCalculation {
  // Ensure plates are sorted largest to smallest
  const plates = [...enabledPlates].sort((a, b) => b - a);

  // Weight to load (excluding bar)
  const loadWeight = targetWeight - barWeight;

  if (loadWeight < 0) {
    return {
      perSide: {},
      totalPerSide: 0,
      totalWeight: barWeight,
      reachable: false,
      roundedTo: barWeight,
      needsMicroplates: false,
    };
  }

  // Weight per side
  let remaining = loadWeight / 2;
  const perSide: PlateCount = {};
  let needsMicroplates = false;

  // Greedy algorithm: use largest plates first
  for (const plate of plates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      perSide[plate] = count;
      remaining -= count * plate;

      if (plate < 2.5) {
        needsMicroplates = true;
      }
    }
  }

  const totalPerSide = Object.entries(perSide).reduce((sum, [plate, count]) => sum + Number(plate) * count, 0);
  const actualWeight = barWeight + totalPerSide * 2;
  const reachable = Math.abs(actualWeight - targetWeight) < 0.01;

  return {
    perSide,
    totalPerSide,
    totalWeight: actualWeight,
    reachable,
    roundedTo: reachable ? null : actualWeight,
    needsMicroplates,
  };
}

/**
 * Find the nearest achievable weight with given plates
 */
export function findNearestAchievable(
  targetWeight: number,
  barWeight: number = DEFAULT_BAR_WEIGHT,
  enabledPlates: number[] = DEFAULT_PLATES
): number {
  const result = calculatePlates(targetWeight, barWeight, enabledPlates);
  return result.totalWeight;
}

/**
 * Format plate calculation as a readable string
 * e.g., "20 bar + 2×10 + 2×5 + 2×2.5"
 */
export function formatPlateLoading(
  calculation: PlateCalculation,
  barWeight: number = DEFAULT_BAR_WEIGHT
): string {
  const plates = Object.entries(calculation.perSide)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([plate, count]) => `2×${plate}`)
    .join(' + ');

  if (plates) {
    return `${barWeight} bar + ${plates}`;
  } else {
    return `${barWeight} bar (empty)`;
  }
}

/**
 * Get or set enabled plates from localStorage
 */
export function getEnabledPlates(): number[] {
  if (typeof window === 'undefined') return DEFAULT_PLATES;
  
  try {
    const stored = localStorage.getItem('madcow_enabled_plates');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Failed to load plate settings:', err);
  }
  
  return DEFAULT_PLATES;
}

export function setEnabledPlates(plates: number[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('madcow_enabled_plates', JSON.stringify(plates));
  } catch (err) {
    console.warn('Failed to save plate settings:', err);
  }
}

export function getBarWeight(): number {
  if (typeof window === 'undefined') return DEFAULT_BAR_WEIGHT;
  
  try {
    const stored = localStorage.getItem('madcow_bar_weight');
    if (stored) {
      return parseFloat(stored);
    }
  } catch (err) {
    console.warn('Failed to load bar weight:', err);
  }
  
  return DEFAULT_BAR_WEIGHT;
}

export function setBarWeight(weight: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('madcow_bar_weight', weight.toString());
  } catch (err) {
    console.warn('Failed to save bar weight:', err);
  }
}
