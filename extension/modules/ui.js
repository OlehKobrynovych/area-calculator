// UI management module
window.UI = {
  translations: {
    uk: {
      title: "Калькулятор площі",
      shape_custom: "Довільна",
      shape_square: "Квадрат",
      shape_rectangle: "Прямокутник",
      shape_triangle: "Трикутник",
      shape_l_shape: "Г-подібна",
      shape_circle: "Круг",
      unit_cm: "см",
      unit_m: "м",
      unit_cm_short: "см",
      unit_m_short: "м",
      unit_currency: "грн",
      btn_clear: "Очистити",
      label_sides_count: "Кількість сторін:",
      hint_init: "Будь ласка, введіть параметри фігури.",
      hint_sides: "Будь ласка, введіть кількість сторін.",
      hint_invalid: "Будь ласка, введіть дійсні розміри.",
      area_label: "Площа фігури",
      ready_label: "Готово до розрахунку.",
      material_title: "Розрахунок матеріалу",
      mat_width: "Ширина",
      mat_height: "Довжина",
      mat_per_pack: "В упаковці",
      mat_price: "Ціна",
      result_needed: "Вам знадобиться",
      result_packs: "Кількість упаковок",
      result_cost: "Загальна вартість",
      unit_pcs: "шт.",
      side_label: "Сторона",
      angle_label: "Кут",
      hint_no_shape: "Спочатку задайте фігуру — площа поки 0.",
      error_impossible: "Така фігура неможлива — значення не застосовано.",
      radius_label: "Радіус R",
      unit_m2: "м²",
      unit_cm2: "см²"
    },
    en: {
      title: "Area Calculator",
      shape_custom: "Custom",
      shape_square: "Square",
      shape_rectangle: "Rectangle",
      shape_triangle: "Triangle",
      shape_l_shape: "L-Shape",
      shape_circle: "Circle",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "USD",
      btn_clear: "Clear",
      label_sides_count: "Number of sides:",
      hint_init: "Please enter shape parameters.",
      hint_sides: "Please enter number of sides.",
      hint_invalid: "Please enter valid dimensions.",
      area_label: "Shape Area",
      ready_label: "Ready for calculation.",
      material_title: "Material Calculation",
      mat_width: "Width",
      mat_height: "Length",
      mat_per_pack: "Per pack",
      mat_price: "Price",
      result_needed: "You will need",
      result_packs: "Number of packs",
      result_cost: "Total cost",
      unit_pcs: "pcs.",
      side_label: "Side",
      angle_label: "Angle",
      hint_no_shape: "Define a shape first — area is 0.",
      error_impossible: "This shape is impossible — value not applied.",
      radius_label: "Radius R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    fr: {
      title: "Calculateur de surface",
      shape_custom: "Libre",
      shape_square: "Carré",
      shape_rectangle: "Rectangle",
      shape_triangle: "Triangle",
      shape_l_shape: "Forme en L",
      shape_circle: "Cercle",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Effacer",
      label_sides_count: "Nombre de côtés :",
      hint_init: "Veuillez saisir les paramètres de la forme.",
      hint_sides: "Veuillez saisir le nombre de côtés.",
      hint_invalid: "Veuillez saisir des dimensions valides.",
      area_label: "Surface de la forme",
      ready_label: "Prêt pour le calcul.",
      material_title: "Calcul du matériau",
      mat_width: "Largeur",
      mat_height: "Longueur",
      mat_per_pack: "Par paquet",
      mat_price: "Prix",
      result_needed: "Vous aurez besoin de",
      result_packs: "Nombre de paquets",
      result_cost: "Coût total",
      unit_pcs: "pcs",
      side_label: "Côté",
      angle_label: "Angle",
      hint_no_shape: "Définissez d'abord une forme — la surface est de 0.",
      error_impossible: "Cette forme est impossible — valeur non appliquée.",
      radius_label: "Rayon R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    de: {
      title: "Flächenrechner",
      shape_custom: "Frei",
      shape_square: "Quadrat",
      shape_rectangle: "Rechteck",
      shape_triangle: "Dreieck",
      shape_l_shape: "L-Form",
      shape_circle: "Kreis",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Löschen",
      label_sides_count: "Anzahl der Seiten:",
      hint_init: "Bitte geben Sie die Formparameter ein.",
      hint_sides: "Bitte geben Sie die Anzahl der Seiten ein.",
      hint_invalid: "Bitte geben Sie gültige Maße ein.",
      area_label: "Formfläche",
      ready_label: "Bereit zur Berechnung.",
      material_title: "Materialberechnung",
      mat_width: "Breite",
      mat_height: "Länge",
      mat_per_pack: "Pro Packung",
      mat_price: "Preis",
      result_needed: "Sie benötigen",
      result_packs: "Anzahl der Packungen",
      result_cost: "Gesamtkosten",
      unit_pcs: "Stk.",
      side_label: "Seite",
      angle_label: "Winkel",
      hint_no_shape: "Definieren Sie zuerst eine Form — die Fläche beträgt 0.",
      error_impossible: "Diese Form ist unmöglich — Wert nicht übernommen.",
      radius_label: "Radius R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    es: {
      title: "Calculadora de área",
      shape_custom: "Personalizada",
      shape_square: "Cuadrado",
      shape_rectangle: "Rectángulo",
      shape_triangle: "Triángulo",
      shape_l_shape: "Forma en L",
      shape_circle: "Círculo",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Borrar",
      label_sides_count: "Número de lados:",
      hint_init: "Introduzca los parámetros de la forma.",
      hint_sides: "Introduzca el número de lados.",
      hint_invalid: "Introduzca dimensiones válidas.",
      area_label: "Área de la forma",
      ready_label: "Listo para calcular.",
      material_title: "Cálculo de material",
      mat_width: "Ancho",
      mat_height: "Largo",
      mat_per_pack: "Por paquete",
      mat_price: "Precio",
      result_needed: "Necesitará",
      result_packs: "Número de paquetes",
      result_cost: "Costo total",
      unit_pcs: "uds.",
      side_label: "Lado",
      angle_label: "Ángulo",
      hint_no_shape: "Defina primero una forma — el área es 0.",
      error_impossible: "Esta forma es imposible — valor no aplicado.",
      radius_label: "Radio R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    pl: {
      title: "Kalkulator powierzchni",
      shape_custom: "Dowolny",
      shape_square: "Kwadrat",
      shape_rectangle: "Prostokąt",
      shape_triangle: "Trójkąt",
      shape_l_shape: "Kształt L",
      shape_circle: "Koło",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "PLN",
      btn_clear: "Wyczyść",
      label_sides_count: "Liczba boków:",
      hint_init: "Podaj parametry kształtu.",
      hint_sides: "Podaj liczbę boków.",
      hint_invalid: "Podaj prawidłowe wymiary.",
      area_label: "Powierzchnia kształtu",
      ready_label: "Gotowe do obliczeń.",
      material_title: "Obliczenie materiału",
      mat_width: "Szerokość",
      mat_height: "Długość",
      mat_per_pack: "W opakowaniu",
      mat_price: "Cena",
      result_needed: "Będziesz potrzebować",
      result_packs: "Liczba opakowań",
      result_cost: "Koszt całkowity",
      unit_pcs: "szt.",
      side_label: "Bok",
      angle_label: "Kąt",
      hint_no_shape: "Najpierw zdefiniuj kształt — powierzchnia wynosi 0.",
      error_impossible: "Taki kształt jest niemożliwy — wartość nie została zastosowana.",
      radius_label: "Promień R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    it: {
      title: "Calcolatore di superficie",
      shape_custom: "Personalizzata",
      shape_square: "Quadrato",
      shape_rectangle: "Rettangolo",
      shape_triangle: "Triangolo",
      shape_l_shape: "Forma a L",
      shape_circle: "Cerchio",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Cancella",
      label_sides_count: "Numero di lati:",
      hint_init: "Inserisci i parametri della forma.",
      hint_sides: "Inserisci il numero di lati.",
      hint_invalid: "Inserisci dimensioni valide.",
      area_label: "Area della forma",
      ready_label: "Pronto per il calcolo.",
      material_title: "Calcolo del materiale",
      mat_width: "Larghezza",
      mat_height: "Lunghezza",
      mat_per_pack: "Per confezione",
      mat_price: "Prezzo",
      result_needed: "Avrai bisogno di",
      result_packs: "Numero di confezioni",
      result_cost: "Costo totale",
      unit_pcs: "pz.",
      side_label: "Lato",
      angle_label: "Angolo",
      hint_no_shape: "Definisci prima una forma — l'area è 0.",
      error_impossible: "Questa forma è impossibile — valore non applicato.",
      radius_label: "Raggio R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    pt: {
      title: "Calculadora de área",
      shape_custom: "Personalizada",
      shape_square: "Quadrado",
      shape_rectangle: "Retângulo",
      shape_triangle: "Triângulo",
      shape_l_shape: "Forma em L",
      shape_circle: "Círculo",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Limpar",
      label_sides_count: "Número de lados:",
      hint_init: "Insira os parâmetros da forma.",
      hint_sides: "Insira o número de lados.",
      hint_invalid: "Insira dimensões válidas.",
      area_label: "Área da forma",
      ready_label: "Pronto para calcular.",
      material_title: "Cálculo de material",
      mat_width: "Largura",
      mat_height: "Comprimento",
      mat_per_pack: "Por pacote",
      mat_price: "Preço",
      result_needed: "Você vai precisar de",
      result_packs: "Número de pacotes",
      result_cost: "Custo total",
      unit_pcs: "un.",
      side_label: "Lado",
      angle_label: "Ângulo",
      hint_no_shape: "Defina uma forma primeiro — a área é 0.",
      error_impossible: "Esta forma é impossível — valor não aplicado.",
      radius_label: "Raio R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    tr: {
      title: "Alan Hesaplayıcı",
      shape_custom: "Özel",
      shape_square: "Kare",
      shape_rectangle: "Dikdörtgen",
      shape_triangle: "Üçgen",
      shape_l_shape: "L Şekli",
      shape_circle: "Daire",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "TRY",
      btn_clear: "Temizle",
      label_sides_count: "Kenar sayısı:",
      hint_init: "Lütfen şekil parametrelerini girin.",
      hint_sides: "Lütfen kenar sayısını girin.",
      hint_invalid: "Lütfen geçerli boyutlar girin.",
      area_label: "Şekil Alanı",
      ready_label: "Hesaplamaya hazır.",
      material_title: "Malzeme Hesabı",
      mat_width: "Genişlik",
      mat_height: "Uzunluk",
      mat_per_pack: "Paket başına",
      mat_price: "Fiyat",
      result_needed: "İhtiyacınız olacak",
      result_packs: "Paket sayısı",
      result_cost: "Toplam maliyet",
      unit_pcs: "adet",
      side_label: "Kenar",
      angle_label: "Açı",
      hint_no_shape: "Önce bir şekil tanımlayın — alan 0.",
      error_impossible: "Bu şekil imkansız — değer uygulanmadı.",
      radius_label: "Yarıçap R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    },
    nl: {
      title: "Oppervlakteberekening",
      shape_custom: "Vrij",
      shape_square: "Vierkant",
      shape_rectangle: "Rechthoek",
      shape_triangle: "Driehoek",
      shape_l_shape: "L-vorm",
      shape_circle: "Cirkel",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "EUR",
      btn_clear: "Wissen",
      label_sides_count: "Aantal zijden:",
      hint_init: "Voer de vormparameters in.",
      hint_sides: "Voer het aantal zijden in.",
      hint_invalid: "Voer geldige afmetingen in.",
      area_label: "Oppervlakte van de vorm",
      ready_label: "Klaar voor berekening.",
      material_title: "Materiaalberekening",
      mat_width: "Breedte",
      mat_height: "Lengte",
      mat_per_pack: "Per pak",
      mat_price: "Prijs",
      result_needed: "U heeft nodig",
      result_packs: "Aantal pakken",
      result_cost: "Totale kosten",
      unit_pcs: "st.",
      side_label: "Zijde",
      angle_label: "Hoek",
      hint_no_shape: "Definieer eerst een vorm — oppervlakte is 0.",
      error_impossible: "Deze vorm is onmogelijk — waarde niet toegepast.",
      radius_label: "Straal R",
      unit_m2: "m²",
      unit_cm2: "cm²"
    }
  },

  translateUI: function() {
    const state = window.AppState;
    const lang = state.currentLanguage;
    const dict = this.translations[lang];

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Refresh dynamic parts
    this.updateResultText();
    if (state.currentShapeMode === "circle") {
      this.createCircleInput();
    } else if (state.points.length > 0) {
      this.createSideInputs(state.points);
    }
    
    // Trigger material recalculation to update its texts
    const event = new CustomEvent('shapeChanged');
    document.dispatchEvent(event);
  },

  // Update result text display
  updateResultText: function() {
    const state = window.AppState;
    const dict = this.translations[state.currentLanguage];
    
    if (state.shapeArea > 0) {
      const unitLabel = state.shapeUnit === "m" ? dict.unit_m2 : dict.unit_cm2;
      const area = state.shapeUnit === "m" ? state.shapeArea / 10000 : state.shapeArea;
      const extra = state.shapeUnit === "m" ? "" : ` (${(state.shapeArea / 10000).toFixed(2)} ${dict.unit_m2})`;
      state.resultText.textContent = `${dict.area_label}: ${area.toFixed(2)} ${unitLabel}${extra}`;
    } else {
      state.resultText.textContent = dict.hint_init;
    }
  },

  // Update existing input values without recreating DOM (prevents focus loss)
  // Write current sides and angles into inputs (except `skipInput`, the one being typed in)
  syncSideInputs: function(skipInput) {
    const state = window.AppState;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const lengths = window.Calculations.getSideLengths(state.points);
    const angles = window.Calculations.getInteriorAngles(state.points);

    lengths.forEach((len, i) => {
      const sideInput = document.getElementById(`side-input-${i}`);
      if (sideInput && sideInput !== skipInput) sideInput.value = (len / multiplier).toFixed(2);
      const angleInput = document.getElementById(`angle-input-${i}`);
      if (angleInput && angleInput !== skipInput) angleInput.value = angles[i].toFixed(1);
    });
  },

  // Create side + angle inputs dynamically
  createSideInputs: function(points) {
    const state = window.AppState;
    const dict = this.translations[state.currentLanguage];

    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? dict.unit_m_short : dict.unit_cm_short;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;

    const addInput = (row, id, labelText, step, onChange) => {
      const div = document.createElement("div");
      div.classList.add("input-group");
      const label = document.createElement("label");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "number";
      input.id = id;
      input.step = step;
      // Live update while typing: every keystroke is applied to the shape
      // as it was when editing started, so intermediate digits don't accumulate
      let base = null;
      input.addEventListener("focus", () => {
        base = state.points.map(p => ({ ...p }));
      });
      input.addEventListener("input", (e) => {
        if (!base) base = state.points.map(p => ({ ...p }));
        state.points = base.map(p => ({ ...p }));
        const ok = onChange(parseFloat(e.target.value));
        if (!ok) {
          window.Shapes.finalizeUpdate(); // show the unchanged shape
          state.resultText.textContent = dict.error_impossible;
        }
        this.syncSideInputs(input);
      });
      input.addEventListener("change", () => {
        base = state.points.map(p => ({ ...p }));
        this.syncSideInputs();
      });
      div.appendChild(label);
      div.appendChild(input);
      row.appendChild(div);
    };

    points.forEach((p, i) => {
      const letter = String.fromCharCode(65 + i);
      const row = document.createElement("div");
      row.classList.add("side-angle-row");
      addInput(row, `side-input-${i}`, `${dict.side_label} ${letter} (${unit}):`, "0.01",
        v => window.Shapes.handleSideLengthChange(i, v * multiplier));
      addInput(row, `angle-input-${i}`, `${dict.angle_label} ${letter} (°):`, "0.1",
        v => window.Shapes.handleAngleChange(i, v));
      state.dynamicInputsContainer.appendChild(row);
      // Triangle with fixed sides has fixed angles
      if (points.length === 3) document.getElementById(`angle-input-${i}`).readOnly = true;
    });

    this.syncSideInputs();
  },

  // Handle shape button clicks
  handleShapeButtonClick: function(shape) {
    const state = window.AppState;
    state.reset();
    state.currentShapeMode = shape;
    
    state.customSidesConfig.style.display = "none";
    state.canvasButtons.style.display = "none"; 

    // Default sizes: 1 m (geometry is always in cm)
    const m = 100;

    if (shape === "custom") {
      state.customSidesConfig.style.display = "block";
      state.canvasButtons.style.display = "flex";
      // Start with a ready shape so area/material are visible immediately
      this.handleConfirmSides();
      return;
    } else if (shape === "square") {
      state.points = window.Shapes.generateRectangle(1 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "rectangle") {
      state.points = window.Shapes.generateRectangle(2 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "triangle") {
      state.points = window.Shapes.generateTriangle(1 * m);
      state.isShapeClosed = true;
    } else if (shape === "l-shape") {
      state.points = window.Shapes.generateLShape(2 * m, 2 * m, 1 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "circle") {
      state.circleRadius = 0.5 * m;
      this.createCircleInput();
    }

    if (shape !== "circle" && state.points.length > 0) {
      window.Drawing.updateTransform(true);
      this.createSideInputs(state.points);
      state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
    } else if (shape === "circle") {
      state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
    }
    
    this.updateResultText();
    window.Drawing.redrawCanvas();
  },

  createCircleInput: function() {
    const state = window.AppState;
    const dict = this.translations[state.currentLanguage];
    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? dict.unit_m_short : dict.unit_cm_short;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const displayVal = (state.circleRadius / multiplier).toFixed(2);

    const div = document.createElement("div");
    div.classList.add("input-group");
    const label = document.createElement("label");
    label.textContent = `${dict.radius_label} (${unit}):`;
    const input = document.createElement("input");
    input.type = "number";
    input.value = displayVal;
    input.step = "0.01";
    
    // On blur, restore the valid value if something invalid was left
    input.addEventListener("change", (e) => {
      e.target.value = (state.circleRadius / multiplier).toFixed(2);
    });
    input.addEventListener("input", (e) => {
      const newVal = parseFloat(e.target.value) || 0;
      if (newVal <= 0) return;
      state.circleRadius = newVal * multiplier;
      state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
      window.Drawing.redrawCanvas();
      this.updateResultText();
      document.dispatchEvent(new CustomEvent('shapeChanged'));
    });
    
    div.appendChild(label);
    div.appendChild(input);
    state.dynamicInputsContainer.appendChild(div);
  },

  handleConfirmSides: function() {
    const state = window.AppState;
    const count = Math.min(20, Math.max(3, parseInt(state.sidesCountInput.value) || 4));
    state.sidesCountInput.value = count;
    // Regular polygon with 1 m sides
    const radius = 100 / (2 * Math.sin(Math.PI / count));

    state.points = window.Shapes.generateRegularPolygon(count, radius);
    state.isShapeClosed = true;
    state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
    window.Drawing.updateTransform(true);
    this.createSideInputs(state.points);
    this.updateResultText();
    window.Drawing.redrawCanvas();
  }
};
