// Mathematical calculations module
window.Calculations = {
  // Calculate polygon area using shoelace formula (Gauss)
  // Assumes points are in logical units (cm)
  calculatePolygonArea: function (points) {
    if (!points || points.length < 3) return 0;
    return Math.abs(this.signedDoubleArea(points)) / 2;
  },

  // Shoelace sum (2 * signed area); sign gives orientation
  signedDoubleArea: function (points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return area;
  },

  // Calculate circle area
  calculateCircleArea: function (radius) {
    return Math.PI * radius * radius;
  },

  // Calculate distance between two points
  calculateDistance: function (p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },

  // Calculate material requirements
  // areaCm2: area in cm2
  // materialWidth, materialHeight: in cm
  calculateMaterialRequirements: function (areaCm2, materialWidth, materialHeight, unitsPerPack) {
    if (areaCm2 <= 0 || materialWidth <= 0 || materialHeight <= 0) return null;

    const materialArea = materialWidth * materialHeight;
    // Use a small epsilon to avoid 100.000000001 becoming 101
    const unitsNeeded = Math.ceil((areaCm2 / materialArea) - 0.00001);

    let packsNeeded = 0;
    if (unitsPerPack > 0) {
      packsNeeded = Math.ceil(unitsNeeded / unitsPerPack);
    }

    return {
      unitsNeeded,
      packsNeeded
    };
  },

  // Check if two line segments (p1, p2) and (p3, p4) intersect
  doSegmentsIntersect: function (p1, p2, p3, p4) {
    function ccw(A, B, C) {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  },

  // Side i goes from point i to point i+1
  getSideLengths: function (points) {
    return points.map((p, i) => this.calculateDistance(p, points[(i + 1) % points.length]));
  },

  // Direction (radians) of each side
  getSideDirections: function (points) {
    return points.map((p, i) => {
      const q = points[(i + 1) % points.length];
      return Math.atan2(q.y - p.y, q.x - p.x);
    });
  },

  // Interior angle (degrees) at each vertex i, between side i-1 and side i
  getInteriorAngles: function (points) {
    const n = points.length;
    const s = this.signedDoubleArea(points) >= 0 ? 1 : -1;
    const dirs = this.getSideDirections(points);
    return dirs.map((d, i) => {
      let turn = d - dirs[(i - 1 + n) % n];
      while (turn > Math.PI) turn -= 2 * Math.PI;
      while (turn <= -Math.PI) turn += 2 * Math.PI;
      return (Math.PI - s * turn) * 180 / Math.PI;
    });
  },

  // Max area for given sides: the polygon inscribed in a circle.
  // Returns {area, angles (deg)} or null if the sides can't form a polygon.
  getMaxAreaShape: function (lengths) {
    const n = lengths.length;
    const total = lengths.reduce((s, l) => s + l, 0);
    const maxIdx = lengths.indexOf(Math.max(...lengths));
    const M = lengths[maxIdx];
    if (n < 3 || M >= total - M - 1e-9) return null;

    const theta = (R, l) => 2 * Math.asin(Math.min(1, l / (2 * R)));
    const sumTheta = R => lengths.reduce((s, l) => s + theta(R, l), 0);
    // Center inside the polygon if the arcs at the smallest radius already cover the circle
    const inside = sumTheta(M / 2) >= 2 * Math.PI;
    const h = inside
      ? R => sumTheta(R) - 2 * Math.PI
      : R => sumTheta(R) - 2 * theta(R, M);

    let lo = M / 2, hi = M;
    const sLo = Math.sign(h(lo));
    while (Math.sign(h(hi)) === sLo && hi < 1e12) hi *= 2;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if (Math.sign(h(mid)) === sLo) lo = mid; else hi = mid;
    }
    const R = (lo + hi) / 2;

    // Longest side's triangle is subtracted when the center is outside
    const sign = lengths.map((l, i) => (!inside && i === maxIdx ? -1 : 1));
    const th = lengths.map(l => theta(R, l));
    const area = th.reduce((s, t, i) => s + sign[i] * R * R * Math.sin(t) / 2, 0);
    const half = th.map((t, i) => sign[i] * (Math.PI - t) / 2);
    const angles = half.map((c, i) => (half[(i - 1 + n) % n] + c) * 180 / Math.PI);
    return { area, angles };
  }
};
