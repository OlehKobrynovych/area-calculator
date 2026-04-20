// Global application state
window.AppState = {
  // Drawing data (All coordinates in logical CM)
  points: [],
  isShapeClosed: false,
  currentShapeMode: "custom", // "custom", "triangle", "circle"
  shapeUnit: "cm", // "cm", "m"
  
  // Viewport/Canvas transform
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  mouseX: 0,
  mouseY: 0,

  // Results
  shapeArea: 0, // in cm2

  // Constants
  CM_TO_PX_SCALE: 1, // 1 unit = 1 pixel for simplicity in logical space

  // Dragging state
  draggedPointIndex: -1,
  isDragging: false,

  // DOM References
  canvas: null,
  ctx: null,
  shapeButtons: null,
  drawInstruction: null,
  canvasButtons: null,
  shapeInputs: null,
  resultText: null,
  materialResultDisplay: null,
  
  // New DOM References
  customSidesConfig: null,
  sidesCountInput: null,
  confirmSidesBtn: null,
  dynamicInputsContainer: null,

  // Reset state
  reset: function () {
    this.points = [];
    this.isShapeClosed = false;
    this.shapeArea = 0;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    if (this.resultText) {
      this.resultText.textContent = "Будь ласка, виберіть фігуру або намалюйте її.";
    }
    if (this.dynamicInputsContainer) {
      this.dynamicInputsContainer.innerHTML = "";
    }
    if (this.materialResultDisplay) {
        this.materialResultDisplay.innerHTML = "";
    }
  }
};
