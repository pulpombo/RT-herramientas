// js/OrganizadorInsumos.js

// Estructura de datos para los insumos
let Insumos = JSON.parse(localStorage.getItem('insumos')) || [];

// Guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem('insumos', JSON.stringify(Insumos));
    ActualizarEstadisticas();
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

// Función para agregar o actualizar un insumo
function AgregarOActualizarInsumo() {
    const nombre = document.getElementById('nombre-insumo').value;
    const categoria = document.getElementById('categoria-insumo').value;
    const cantidad = parseInt(document.getElementById('cantidad-insumo').value);
    const precio = parseFloat(document.getElementById('precio-insumo').value);
    const minimoStock = parseInt(document.getElementById('minimo-stock').value);
    const ubicacion = document.getElementById('ubicacion-insumo').value;
    const notas = document.getElementById('notas-insumo').value;

    if (!nombre || !categoria || isNaN(cantidad) || isNaN(precio)) {
        MostrarToast('warning', 'Por favor, complete todos los campos requeridos.');
        return;
    }

    const insumoExistenteIndex = Insumos.findIndex(insumo => 
        insumo.nombre.toLowerCase() === nombre.toLowerCase() && 
        insumo.categoria === categoria
    );

    const nuevoInsumo = {
        nombre,
        categoria,
        cantidad,
        precio,
        minimoStock,
        ubicacion,
        notas,
        fechaActualizacion: new Date().toLocaleString()
    };

    if (insumoExistenteIndex !== -1) {
        Insumos[insumoExistenteIndex] = nuevoInsumo;
        MostrarToast('success', 'Insumo actualizado exitosamente');
    } else {
        Insumos.push(nuevoInsumo);
        MostrarToast('success', 'Insumo agregado exitosamente');
    }

    LimpiarFormulario();
    guardarDatos();
    ActualizarListaInsumos();
}

// Función para actualizar las estadísticas
function ActualizarEstadisticas() {
    const totalInsumos = Insumos.length;
    const stockBajo = Insumos.filter(insumo => insumo.cantidad <= insumo.minimoStock).length;
    const valorTotal = Insumos.reduce((total, insumo) => total + (insumo.cantidad * insumo.precio), 0);

    document.getElementById('total-insumos').textContent = totalInsumos;
    document.getElementById('stock-bajo').textContent = stockBajo;
    document.getElementById('valor-total').textContent = `$${valorTotal.toLocaleString()}`;
}

// Función para filtrar insumos
function FiltrarInsumos() {
    const busqueda = document.getElementById('buscar-insumo').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;
    
    const insumosFiltrados = Insumos.filter(insumo => {
        const coincideNombre = insumo.nombre.toLowerCase().includes(busqueda);
        const coincideCategoria = !categoria || insumo.categoria === categoria;
        return coincideNombre && coincideCategoria;
    });

    ActualizarListaInsumos(insumosFiltrados);
}

// Función para ordenar insumos
function OrdenarInsumos() {
    const criterio = document.getElementById('ordenar-por').value;
    
    const insumosOrdenados = [...Insumos].sort((a, b) => {
        switch (criterio) {
            case 'nombre':
                return a.nombre.localeCompare(b.nombre);
            case 'cantidad':
                return b.cantidad - a.cantidad;
            case 'precio':
                return b.precio - a.precio;
            case 'categoria':
                return a.categoria.localeCompare(b.categoria);
            default:
                return 0;
        }
    });

    ActualizarListaInsumos(insumosOrdenados);
}

// Función para actualizar la lista de insumos
function ActualizarListaInsumos(insumosAMostrar = Insumos) {
    const container = document.getElementById('lista-insumos');
    container.innerHTML = '';

    insumosAMostrar.forEach((insumo, index) => {
        const stockStatus = insumo.cantidad <= 0 ? 'critico' : 
                          insumo.cantidad <= insumo.minimoStock ? 'bajo' : 'normal';

        const card = document.createElement('div');
        card.className = 'insumo-card';
        card.innerHTML = `
            <div class="insumo-header">
                <h3 class="insumo-title">${insumo.nombre}</h3>
                <span class="insumo-categoria">${insumo.categoria}</span>
            </div>
            <div class="insumo-info">
                <div class="info-item">
                    <span class="info-label">Cantidad:</span>
                    <span class="stock-badge stock-${stockStatus}">${insumo.cantidad} unidades</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Precio:</span>
                    <span class="info-value">$${insumo.precio.toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Ubicación:</span>
                    <span class="info-value">${insumo.ubicacion || 'No especificada'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Última actualización:</span>
                    <span class="info-value">${insumo.fechaActualizacion}</span>
                </div>
            </div>
            <div class="insumo-actions">
                <button onclick="EditarInsumo(${index})" class="button">
                    <i class="ri-edit-line"></i>
                    Editar
                </button>
                <button onclick="EliminarInsumo(${index})" class="button button-error">
                    <i class="ri-delete-bin-line"></i>
                    Eliminar
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Función para editar un insumo
function EditarInsumo(index) {
    const insumo = Insumos[index];
    document.getElementById('nombre-insumo').value = insumo.nombre;
    document.getElementById('categoria-insumo').value = insumo.categoria;
    document.getElementById('cantidad-insumo').value = insumo.cantidad;
    document.getElementById('precio-insumo').value = insumo.precio;
    document.getElementById('minimo-stock').value = insumo.minimoStock;
    document.getElementById('ubicacion-insumo').value = insumo.ubicacion || '';
    document.getElementById('notas-insumo').value = insumo.notas || '';
}

// Función para eliminar un insumo
function EliminarInsumo(index) {
    if (confirm('¿Está seguro de eliminar este insumo?')) {
        Insumos.splice(index, 1);
        guardarDatos();
        ActualizarListaInsumos();
        MostrarToast('success', 'Insumo eliminado exitosamente');
    }
}

// Función para limpiar el formulario
function LimpiarFormulario() {
    document.getElementById('nombre-insumo').value = '';
    document.getElementById('categoria-insumo').value = '';
    document.getElementById('cantidad-insumo').value = '';
    document.getElementById('precio-insumo').value = '';
    document.getElementById('minimo-stock').value = '5';
    document.getElementById('ubicacion-insumo').value = '';
    document.getElementById('notas-insumo').value = '';
}

// Función para exportar a Excel
function ExportarExcel() {
    const data = Insumos.map(insumo => ({
        'Nombre': insumo.nombre,
        'Categoría': insumo.categoria,
        'Cantidad': insumo.cantidad,
        'Precio': insumo.precio,
        'Stock Mínimo': insumo.minimoStock,
        'Ubicación': insumo.ubicacion,
        'Notas': insumo.notas,
        'Última Actualización': insumo.fechaActualizacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Insumos");
    XLSX.writeFile(workbook, "inventario_insumos.xlsx");
}

// Función para exportar a PDF
function ExportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Inventario de Insumos", 20, 20);

    let y = 40;
    Insumos.forEach(insumo => {
        doc.setFontSize(12);
        doc.text(`${insumo.nombre} (${insumo.categoria})`, 20, y);
        doc.text(`Cantidad: ${insumo.cantidad}`, 20, y + 7);
        doc.text(`Precio: $${insumo.precio}`, 20, y + 14);
        y += 30;

        if (y >= 280) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save("inventario_insumos.pdf");
}

// Función para compartir por WhatsApp
function CompartirWhatsApp() {
    let mensaje = "📦 *Inventario de Insumos*\n\n";
    
    Insumos.forEach(insumo => {
        mensaje += `*${insumo.nombre}* (${insumo.categoria})\n`;
        mensaje += `📍 Cantidad: ${insumo.cantidad}\n`;
        mensaje += `💰 Precio: $${insumo.precio}\n`;
        if (insumo.ubicacion) mensaje += `📍 Ubicación: ${insumo.ubicacion}\n`;
        mensaje += `\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Mostrar Toast Message
function MostrarToast(type, message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="cerrarToast(this)">✖</button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('slideOut');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cerrar Toast Message
function cerrarToast(button) {
    const toast = button.closest('.toast');
    toast.classList.add('slideOut');
    setTimeout(() => toast.remove(), 300);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    ActualizarListaInsumos();
    ActualizarEstadisticas();
});
