// js/StockReparar.js

// Mantener el estado en localStorage
let Equipos = JSON.parse(localStorage.getItem('equipos')) || [];
let Usuarios = JSON.parse(localStorage.getItem('usuarios')) || [
    { nombre: "Admin", pass: "Admin123", rol: "Admin" },
    { nombre: "Tecnico", pass: "Tecnico123", rol: "Tecnico" }
];
let UsuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado')) || null;

// Función para guardar el estado
function guardarEstado() {
    localStorage.setItem('equipos', JSON.stringify(Equipos));
    localStorage.setItem('usuarios', JSON.stringify(Usuarios));
    localStorage.setItem('usuarioLogueado', JSON.stringify(UsuarioLogueado));
}

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
  const ModeloSelect = document.getElementById("modelo-equipo");
  const VarianteSelect = document.getElementById("variante-equipo");
  const Modelo = ModeloSelect.value;

  VarianteSelect.innerHTML = "";

  let Variantes = ["Regular"];

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

  Variantes.forEach((variante) => {
    const Option = document.createElement("option");
    Option.value = variante;
    Option.textContent = variante;
    VarianteSelect.appendChild(Option);
  });
}

function ValidarIMEI(imei) {
  return /^\d{15}$/.test(imei);
}

function AgregarOActualizarEquipo() {
  const cliente = document.getElementById("cliente-equipo").value;
  const modelo = document.getElementById("modelo-equipo").value;
  const variante = document.getElementById("variante-equipo").value;
  const imei = document.getElementById("imei-equipo").value;
  const fechaIngreso = new Date().toLocaleString();
  const estado = document.getElementById("estado-equipo").value;
  const detalles = document.getElementById("detalles-equipo").value;

  if (!cliente || !modelo || !imei || !estado || !variante) {
    MostrarToast(
      "warning",
      "Por favor, complete todos los campos correctamente",
    );
    return;
  }
  if (!ValidarIMEI(imei)) {
    MostrarToast("error", "El IMEI/Serial debe ser alfanumérico.");
    return;
  }
  // Buscar si el equipo ya existe
  const equipoExistenteIndex = Equipos.findIndex(
    (equipo) => equipo.imei === imei,
  );

  if (equipoExistenteIndex !== -1) {
    // Actualizar equipo existente
    Equipos[equipoExistenteIndex] = {
      cliente: cliente,
      modelo: modelo,
      variante: variante,
      imei: imei,
      fechaIngreso: fechaIngreso,
      estado: estado,
      detalles: detalles,
    };
    MostrarToast("success", "Equipo actualizado exitosamente");
  } else {
    // Añadir nuevo equipo
    Equipos.push({
      cliente: cliente,
      modelo: modelo,
      variante: variante,
      imei: imei,
      fechaIngreso: fechaIngreso,
      estado: estado,
      detalles: detalles,
    });
    MostrarToast("success", "Equipo agregado exitosamente");
  }

  LimpiarFormulario();
  ActualizarTablaEquipos();
}

function ActualizarTablaEquipos() {
  const tbody = document.getElementById("lista-equipos");
  tbody.innerHTML = "";

  Equipos.forEach((equipo, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
            <td>${equipo.cliente}</td>
            <td>${equipo.modelo} ${equipo.variante}</td>
            <td>${equipo.imei}</td>
            <td>${equipo.fechaIngreso}</td>
            <td><span class="estado-badge estado-${equipo.estado.toLowerCase()}">${equipo.estado}</span></td>
            <td>${equipo.detalles}</td>
            <td>
                <button onclick="EliminarEquipo(${index})" class="button-action button-error">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        `;
  });
}

function LimpiarFormulario() {
  document.getElementById("cliente-equipo").value = "";
  document.getElementById("modelo-equipo").value = "";
  document.getElementById("variante-equipo").value = "Regular";
  document.getElementById("imei-equipo").value = "";
  document.getElementById("estado-equipo").value = "Pendiente";
  document.getElementById("detalles-equipo").value = "";
}

// Eliminar equipo
function EliminarEquipo(index) {
  if (confirm("¿Está seguro de eliminar este equipo?")) {
    Equipos.splice(index, 1);
    ActualizarTablaEquipos();
    MostrarToast("success", "Equipo eliminado exitosamente");
  }
}

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

function login(nombre, pass) {
  const usuario = Usuarios.find(
    (user) => user.nombre === nombre && user.pass === pass,
  );
  if (usuario) {
    UsuarioLogueado = usuario;
    ActualizarNav();
    MostrarToast("success", "Logueado Correctamente");
  } else {
    MostrarToast("error", "Nombre de usuario o contraseña incorrectos");
  }
}
function logout() {
  UsuarioLogueado = null;
  ActualizarNav();
  MostrarToast("info", "Sesion cerrada");
}

function ActualizarNav() {
  const nav = document.getElementById("main-nav");
  nav.innerHTML = "";

  if (UsuarioLogueado) {
    if (UsuarioLogueado.rol === "Admin") {
      nav.innerHTML = `
                <button onclick="logout()" class="button">Cerrar Sesion</button>
                `;
    } else if (UsuarioLogueado.rol === "Tecnico") {
      nav.innerHTML = `
                 <button onclick="logout()" class="button">Cerrar Sesion</button>
                  `;
    }
  } else {
    nav.innerHTML = `
                 <button onclick="login(prompt('Ingrese su usuario', ''), prompt('Ingrese su contraseña', ''))" class="button">Iniciar Sesion</button>
              `;
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    ActualizarTablaEquipos();
    ActualizarNav();
});
