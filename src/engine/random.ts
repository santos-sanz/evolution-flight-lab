export class SeededRandom {
  private state: number;
  private spareNormal: number | undefined;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
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

  integer(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  normal(mean = 0, sigma = 1): number {
    if (this.spareNormal !== undefined) {
      const value = this.spareNormal;
      this.spareNormal = undefined;
      return mean + value * sigma;
    }
    const u = Math.max(this.next(), Number.EPSILON);
    const v = this.next();
    const magnitude = Math.sqrt(-2 * Math.log(u));
    this.spareNormal = magnitude * Math.sin(2 * Math.PI * v);
    return mean + magnitude * Math.cos(2 * Math.PI * v) * sigma;
  }
}
