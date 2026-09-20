/**
 * One-Euro (1€) Filter implementation for realtime noisy signal smoothing
 * Reference: Casiez, G., Roussel, N. and Vogel, D. (2012)
 * Eliminates jitter at low velocities and reduces lag during rapid movements.
 */

class LowPassFilter {
  constructor(alpha, initVal = 0) {
    this.alpha = alpha;
    this.s = initVal;
    this.hasInit = false;
  }

  filter(val, alpha) {
    if (alpha !== undefined) this.alpha = alpha;
    if (!this.hasInit) {
      this.s = val;
      this.hasInit = true;
      return val;
    }
    this.s = this.alpha * val + (1.0 - this.alpha) * this.s;
    return this.s;
  }

  last() {
    return this.s;
  }

  reset() {
    this.hasInit = false;
    this.s = 0;
  }
}

export class OneEuroFilter {
  /**
   * @param {number} minCutoff - Minimum cutoff frequency in Hz (> 0). Lower = less jitter at rest.
   * @param {number} beta - Speed coefficient (> 0). Higher = less lag during fast movements.
   * @param {number} dCutoff - Cutoff frequency for derivative filtering (typically 1.0 Hz).
   */
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;

    this.x = new LowPassFilter(this.alpha(minCutoff, 1 / 30));
    this.dx = new LowPassFilter(this.alpha(dCutoff, 1 / 30));
    this.lastTime = null;
  }

  alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(val, timestamp = performance.now()) {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.x.filter(val);
    }

    let dt = (timestamp - this.lastTime) / 1000.0;
    if (dt <= 0) dt = 1 / 60.0; // Avoid divide by zero
    if (dt > 1.0) dt = 1 / 30.0; // Reset after long pauses
    this.lastTime = timestamp;

    // Estimate derivative (speed)
    const prevX = this.x.last();
    const dVal = (val - prevX) / dt;
    const edVal = this.dx.filter(dVal, this.alpha(this.dCutoff, dt));

    // Dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edVal);

    // Filter value
    return this.x.filter(val, this.alpha(cutoff, dt));
  }

  reset() {
    this.x.reset();
    this.dx.reset();
    this.lastTime = null;
  }
}

/**
 * 2D / 3D Landmark array smoother that maintains individual 1€ filters per landmark coordinate
 */
export class LandmarkSmoother {
  constructor(minCutoff = 1.2, beta = 0.05) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.filters = {}; // index -> { x, y, z }
  }

  filterLandmarks(landmarks, timestamp = performance.now()) {
    if (!landmarks || landmarks.length === 0) return landmarks;

    return landmarks.map((lm, idx) => {
      if (!this.filters[idx]) {
        this.filters[idx] = {
          x: new OneEuroFilter(this.minCutoff, this.beta),
          y: new OneEuroFilter(this.minCutoff, this.beta),
          z: new OneEuroFilter(this.minCutoff, this.beta)
        };
      }

      const fx = this.filters[idx].x.filter(lm.x, timestamp);
      const fy = this.filters[idx].y.filter(lm.y, timestamp);
      const fz = lm.z !== undefined ? this.filters[idx].z.filter(lm.z, timestamp) : lm.z;

      return {
        ...lm,
        x: fx,
        y: fy,
        z: fz
      };
    });
  }

  reset() {
    this.filters = {};
  }
}
