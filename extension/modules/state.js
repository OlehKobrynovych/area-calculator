// Global application state
window.AppState = {
  // Drawing data
  points: [],
  originalPoints: [], // Store original points for scaling
  originalWallLengths: [], // Store original wall lengths for angle-based editing
  shapeArea: 0,
  currentShapeMode: "custom",
  shapeDimensions: {},
  customWallInputs: [],
  isShapeClosed: false,
  mouseX: 0,
  mouseY: 0,

  // Transform state (for coordinate system)
  scale: 1,
  offsetX: 0,
  offsetY: 0,

  // Constants
  CM_TO_PX_SCALE: 1,

  // Unit settings
  shapeUnit: "cm", // "cm" or "m"
  materialUnit: "cm",  // "cm" or "m"

  // DOM References (initialized in popup-main.js)
  canvas: null,
  ctx: null,
  materialWidthInput: null,
  materialHeightInput: null,
  unitsPerPackInput: null,
  materialPriceInput: null,
  calculateBtn: null,
  resultText: null,
  closeShapeBtn: null,
  clearBtn: null,
  undoLastPointBtn: null,
  shapeInputs: null,
  drawingSection: null,
  drawInstruction: null,
  canvasButtons: null,
  shapeButtonsContainer: null,
  shapeUnitSection: null,
  shapeUnitRadios: null,
  materialUnitRadios: null,

  // Reset state
  reset: function() {
    this.points = [];
    this.originalPoints = [];
    this.originalWallLengths = [];
    this.shapeArea = 0;
    this.isShapeClosed = false;
    this.shapeDimensions = {};
    this.customWallInputs = [];
    // Reset transform
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    if (this.resultText) {
      this.resultText.textContent = "Будь ласка, виберіть фігуру або намалюйте її.";
    }
    if (this.shapeInputs) {
      this.shapeInputs.innerHTML = "";
    }
  }
};
