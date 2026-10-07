export class SeededRng {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number) {
    const normalized = seed >>> 0 || 1;
    this.state = normalized;
    this.initialSeed = normalized;
  }

  reset(): void {
    this.state = this.initialSeed;
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}
