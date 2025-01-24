// js/CotizacionUsados.js

// Función para cambiar entre modo oscuro y claro
function ToggleModoOscuro() {
  const html = document.documentElement;
  const modoOscuroTexto = document.getElementById("modo-oscuro-texto");

  if (html.getAttribute("data-theme") === "light") {
    html.setAttribute("data-theme", "dark");
    modoOscuroTexto.innerHTML = "☀️ Modo Claro";
  } else {
    html.setAttribute("data-theme", "light");
    modoOscuroTexto.innerHTML = "🌙 Modo Oscuro";
  }
}

// Función para actualizar las variantes del modelo de iPhone
function ActualizarVariantes() {
  const ModeloSelect = document.getElementById("Modelo");
  const VarianteSelect = document.getElementById("Variante");
  const Modelo = ModeloSelect.value;

  VarianteSelect.innerHTML = ""; // Limpiar opciones anteriores

  let Variantes = ["Regular"]; // Opcion base

  // Define las variantes según el modelo seleccionado
  switch (Modelo) {
    case "iPhone7":
    case "iPhone8":
      Variantes = ["Regular", "Plus"];
      break;
    case "iPhoneX":
      Variantes = ["Regular", "S", "S Max"];
      break;
    case "iPhone11":
      Variantes = ["Regular", "Pro", "Pro Max"];
      break;
    case "iPhone12":
    case "iPhone13":
      Variantes = ["Mini", "Regular", "Pro", "Pro Max"];
      break;
    case "iPhone14":
    case "iPhone15":
    case "iPhone16":
      Variantes = ["Regular", "Plus", "Pro", "Pro Max"];
      break;
    case "iPhoneSE":
      Variantes = ["2da Gen", "3ra Gen"];
      break;
  }

  // Añade las nuevas opciones al selector de variantes
  Variantes.forEach((variante) => {
    const Option = document.createElement("option");
    Option.value = variante;
    Option.textContent = variante;
    VarianteSelect.appendChild(Option);
  });
}

// Precios base actualizados (en pesos argentinos)
const PRECIOS_BASE = {
  iPhone16ProMax: {
    256: 5117199,
    512: 5500000
  },
  iPhone16Pro: {
    128: 4217199,
    256: 4639299
  },
  iPhone16Plus: {
    128: 3795099,
    256: 4217199
  },
  iPhone16: {
    128: 3372899,
    256: 3795099
  },
  iPhone15: {
    128: 2950799,
    256: 3372899
  },
  iPhone14: {
    128: 2528699,
    256: 2800000
  },
  iPhone13: {
    128: 1599000,
    256: 1800000
  },
  iPhone11: {
    64: 1199999,
    128: 1199990
  },
  iPhoneSE: {
    128: 888888
  },
  iPhone8: {
    64: 560499
  }
};

// Factores de depreciación según el estado
const FACTORES_ESTADO = {
  excelente: 0.85,  // 15% de depreciación
  muyBueno: 0.75,   // 25% de depreciación
  bueno: 0.65,      // 35% de depreciación
  regular: 0.55,    // 45% de depreciación
  malo: 0.45        // 55% de depreciación
};

// Factor de depreciación por batería
function calcularFactorBateria(porcentaje) {
  if (porcentaje >= 90) return 1;
  if (porcentaje >= 80) return 0.95;
  if (porcentaje >= 70) return 0.90;
  if (porcentaje >= 60) return 0.85;
  return 0.80;
}

// Función para calcular la cotización
function CalcularCotizacion() {
  const modelo = document.getElementById('modelo-equipo').value;
  const almacenamiento = parseInt(document.getElementById('almacenamiento').value);
  const estado = document.getElementById('estado').value;
  const bateria = parseInt(document.getElementById('bateria').value);

  if (!modelo || !almacenamiento || !estado || !bateria) {
    MostrarToast('warning', 'Por favor, complete todos los campos');
    return;
  }

  // Verificar si existe el modelo y almacenamiento
  if (!PRECIOS_BASE[modelo] || !PRECIOS_BASE[modelo][almacenamiento]) {
    MostrarToast('error', 'Combinación de modelo y almacenamiento no disponible');
    return;
  }

  const precioBase = PRECIOS_BASE[modelo][almacenamiento];
  const factorEstado = FACTORES_ESTADO[estado];
  const factorBateria = calcularFactorBateria(bateria);

  // Cálculo del precio usado
  const precioUsado = Math.round(precioBase * factorEstado * factorBateria);
  const rangoInferior = Math.round(precioUsado * 0.95);
  const rangoSuperior = Math.round(precioUsado * 1.05);

  // Mostrar resultados
  document.getElementById('precio-nuevo').textContent = `$${precioBase.toLocaleString()}`;
  document.getElementById('precio-usado').textContent = `$${precioUsado.toLocaleString()}`;
  document.getElementById('rango-precios').textContent = `$${rangoInferior.toLocaleString()} - $${rangoSuperior.toLocaleString()}`;

  // Generar recomendación
  let recomendacion = '';
  if (bateria < 80) {
    recomendacion = 'Se recomienda cambio de batería';
  } else if (estado === 'malo') {
    recomendacion = 'Considerar para repuestos';
  } else if (estado === 'regular') {
    recomendacion = 'Necesita reparaciones menores';
  } else {
    recomendacion = 'Listo para la venta';
  }
  document.getElementById('recomendacion').textContent = recomendacion;

  // Actualizar imagen
  ActualizarImagen(modelo);
}

// Función para actualizar la imagen del iPhone
function ActualizarImagen(modelo) {
  const imagenContainer = document.getElementById('imagen-iphone');
  const baseUrl = '../assets/iphones/';
  const imagenUrl = `${baseUrl}${modelo.toLowerCase()}.png`;

  imagenContainer.innerHTML = `<img src="${imagenUrl}" alt="${modelo}" onerror="this.src='${baseUrl}default.png'"/>`;
}

// Función para actualizar las opciones de almacenamiento según el modelo
function ActualizarAlmacenamiento() {
  const modelo = document.getElementById('modelo-equipo').value;
  const almacenamientoSelect = document.getElementById('almacenamiento');

  // Limpiar opciones actuales
  almacenamientoSelect.innerHTML = '';

  // Si existe el modelo en PRECIOS_BASE
  if (PRECIOS_BASE[modelo]) {
    // Agregar solo las capacidades disponibles para ese modelo
    Object.keys(PRECIOS_BASE[modelo]).forEach(capacidad => {
      const option = document.createElement('option');
      option.value = capacidad;
      option.textContent = `${capacidad} GB`;
      almacenamientoSelect.appendChild(option);
    });
  }
}

// Event Listeners
document.getElementById('modelo-equipo').addEventListener('change', ActualizarAlmacenamiento);

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
  ActualizarAlmacenamiento();
});

// Mostrar Toast Message
function MostrarToast(type, message) {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.innerHTML = `
          <span>${message}</span>
          <button class="toast-close" onclick="cerrarToast(this)">✖</button>
      `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("slideOut");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Cerrar Toast Message
function cerrarToast(button) {
  const toast = button.closest(".toast");
  toast.classList.add("slideOut");
  setTimeout(() => toast.remove(), 300);
}
