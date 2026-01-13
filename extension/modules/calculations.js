// Mathematical calculations module
window.Calculations = {
  // Calculate custom shape area using shoelace formula
  calculateCustomShapeArea: function (points) {
    if (!points || points.length < 3) {
      return 0;
    }

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  },

  // Calculate distance between two points
  calculateDistance: function (p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Find intersection of two circles to determine new point position
  // p1: center of first circle (fixed start point of changed side)
  // p3: center of second circle (fixed end point of next side)
  // R1: radius of first circle (new length of changed side)
  // R2: radius of second circle (original length of next side)
  // origP2: original position of the point we're moving (to choose closest intersection)
  // Returns: { point: {x, y}, adjustedR2: number }
  findCircleIntersection: function (p1, p3, R1, R2, origP2) {
    const dx = p3.x - p1.x;
    const dy = p3.y - p1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Edge case: centers are the same
    if (d < 0.0001) {
      return {
        point: { x: p1.x + R1, y: p1.y },
        adjustedR2: R2,
      };
    }

    let adjustedR2 = R2;

    // Case: circles don't intersect (too far apart)
    if (d > R1 + R2) {
      adjustedR2 = d - R1;
    }
    // Case: one circle inside the other
    else if (d < Math.abs(R1 - R2)) {
      if (R1 > R2) {
        adjustedR2 = R1 - d + 0.1; // Small offset to ensure intersection
      } else {
        adjustedR2 = d + R1 + 0.1;
      }
    }

    // Calculate intersection points
    const a = (R1 * R1 - adjustedR2 * adjustedR2 + d * d) / (2 * d);
    const hSquared = R1 * R1 - a * a;

    // Numerical error - point on line between centers
    if (hSquared < 0) {
      const ratio = R1 / d;
      return {
        point: { x: p1.x + dx * ratio, y: p1.y + dy * ratio },
        adjustedR2: adjustedR2,
      };
    }

    const h = Math.sqrt(hSquared);

    // Point P0 on line between centers
    const P0x = p1.x + (a * dx) / d;
    const P0y = p1.y + (a * dy) / d;

    // Perpendicular vector
    const perpX = -dy / d;
    const perpY = dx / d;

    // Two intersection points
    const intersection1 = {
      x: P0x + h * perpX,
      y: P0y + h * perpY,
    };
    const intersection2 = {
      x: P0x - h * perpX,
      y: P0y - h * perpY,
    };

    // Choose the one closer to original position
    const dist1 = Math.sqrt(
      Math.pow(intersection1.x - origP2.x, 2) +
        Math.pow(intersection1.y - origP2.y, 2)
    );
    const dist2 = Math.sqrt(
      Math.pow(intersection2.x - origP2.x, 2) +
        Math.pow(intersection2.y - origP2.y, 2)
    );

    return {
      point: dist1 <= dist2 ? intersection1 : intersection2,
      adjustedR2: adjustedR2,
    };
  },

  // Calculate wall lengths for custom shape
  calculateWallLengths: function (points) {
    if (!points || points.length < 2) {
      return [];
    }

    const lengths = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      lengths.push(this.calculateDistance(p1, p2));
    }
    return lengths;
  },

  // Rectangle area
  calculateRectangleArea: function (width, height) {
    return width * height;
  },

  // L-shape area from 6 sides
  // A = top, B = right-top vertical, C = inner horizontal, D = inner vertical, E = bottom, F = left vertical
  calculateLShapeArea: function (sideA, sideB, sideC, sideD, sideE, sideF) {
    // L-shape can be calculated as big rectangle minus cutout rectangle
    // Big rectangle: sideA * sideF
    // Cutout: sideC * (sideF - sideB)
    // Or using shoelace formula for 6 vertices
    // Area = sideA * sideF - sideC * sideD
    if (sideA > 0 && sideF > 0) {
      return sideA * sideF - sideC * sideD;
    }
    return 0;
  },

  // Triangle area using Heron's formula (from 3 sides)
  calculateTriangleArea: function (a, b, c) {
    // Check if triangle is valid
    if (a + b <= c || a + c <= b || b + c <= a) {
      return 0;
    }
    // Heron's formula
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  },

  // Circle area
  calculateCircleArea: function (radius) {
    return Math.PI * radius * radius;
  },

  // Quadrilateral area (approximation)
  calculateQuadrilateralArea: function (a, b, c, d) {
    const s_a = (a + c) / 2;
    const s_b = (b + d) / 2;
    return s_a * s_b;
  },

  // Calculate area for predefined shapes
  calculatePredefinedShapeArea: function (mode, dimensions) {
    const state = window.AppState;
    const unitMultiplier = state.shapeUnit === "m" ? 100 : 1; // Convert to cm
    const getVal = (inputRef) =>
      (parseFloat(inputRef.value) || 0) * unitMultiplier;
    let areaCm2 = 0;

    try {
      switch (mode) {
        case "rectangle":
          const sideA = getVal(dimensions.sideA);
          const sideB = getVal(dimensions.sideB);
          const sideC = getVal(dimensions.sideC);
          const sideD = getVal(dimensions.sideD);
          areaCm2 = this.calculateQuadrilateralArea(sideA, sideB, sideC, sideD);
          break;
        case "l-shape":
          const lSideA = getVal(dimensions.sideA);
          const lSideB = getVal(dimensions.sideB);
          const lSideC = getVal(dimensions.sideC);
          const lSideD = getVal(dimensions.sideD);
          const lSideE = getVal(dimensions.sideE);
          const lSideF = getVal(dimensions.sideF);
          areaCm2 = this.calculateLShapeArea(
            lSideA,
            lSideB,
            lSideC,
            lSideD,
            lSideE,
            lSideF
          );
          break;
        case "triangle":
          const triSideA = getVal(dimensions.sideA);
          const triSideB = getVal(dimensions.sideB);
          const triSideC = getVal(dimensions.sideC);
          areaCm2 = this.calculateTriangleArea(triSideA, triSideB, triSideC);
          break;
        case "circle":
          const circRadius = getVal(dimensions.radius);
          areaCm2 = this.calculateCircleArea(circRadius);
          break;
        default:
          areaCm2 = 0;
      }
    } catch (e) {
      console.error("Помилка у розрахунках:", e);
      areaCm2 = 0;
    }

    return areaCm2;
  },

  // Calculate material requirements
  calculateMaterialRequirements: function (
    shapeArea,
    materialWidth,
    materialHeight,
    unitsPerPack
  ) {
    if (
      shapeArea <= 0 ||
      materialWidth <= 0 ||
      materialHeight <= 0 ||
      unitsPerPack <= 0
    ) {
      return null;
    }

    const unitArea = materialWidth * materialHeight;
    if (unitArea <= 0) {
      return null;
    }

    const unitsNeeded = Math.ceil(shapeArea / unitArea);
    const packsNeeded = Math.ceil(unitsNeeded / unitsPerPack);

    return {
      unitsNeeded,
      packsNeeded,
      areaM2: (shapeArea / 10000).toFixed(2),
    };
  },

  // A new function to calculate area from inputs without modifying the shape
  // Input values are in visual units (same number for cm and m)
  // unitMultiplier converts visual units to real cm for area calculation
  calculateAreaFromInputs: function () {
    const state = window.AppState;
    const { currentShapeMode, shapeDimensions, customWallInputs, shapeUnit } =
      state;
    const unitMultiplier = shapeUnit === "m" ? 100 : 1;
    let areaVisualUnits = 0;

    // Get raw input value (visual units)
    const getVal = (input) => parseFloat(input.value) || 0;

    if (currentShapeMode === "circle") {
      const radius = getVal(shapeDimensions.radius);
      areaVisualUnits = this.calculateCircleArea(radius);
    } else if (customWallInputs && customWallInputs.length > 0) {
      const sides = customWallInputs.map(getVal);
      switch (currentShapeMode) {
        case "rectangle":
          if (sides.length === 4) {
            areaVisualUnits = this.calculateQuadrilateralArea(
              sides[0],
              sides[1],
              sides[2],
              sides[3]
            );
          }
          break;
        case "l-shape":
          if (sides.length === 6) {
            areaVisualUnits = this.calculateLShapeArea(
              sides[0],
              sides[1],
              sides[2],
              sides[3],
              sides[4],
              sides[5]
            );
          }
          break;
        case "triangle":
          if (sides.length === 3) {
            areaVisualUnits = this.calculateTriangleArea(sides[0], sides[1], sides[2]);
          }
          break;
        case "custom":
          // For custom shapes, calculate area from current points
          if (state.points && state.points.length >= 3) {
            const pixelArea = this.calculateCustomShapeArea(state.points);
            areaVisualUnits = pixelArea / (state.CM_TO_PX_SCALE * state.CM_TO_PX_SCALE);
          }
          break;
      }
    }
    // Convert visual units² to cm²
    return areaVisualUnits * unitMultiplier * unitMultiplier;
  },
};
