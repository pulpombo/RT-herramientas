// js/ReservaRepuestos.js

// Estructura de datos para las reservas
let Reservas = JSON.parse(localStorage.getItem('reservas')) || [];

// Catálogo de modelos y repuestos
const CATALOGO = {
    'iPhone 15 Pro Max': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium']
    },
    'iPhone 15 Pro': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium']
    },
    'iPhone 15 Plus': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Pink', 'Yellow', 'Green', 'Blue', 'Black']
    },
    'iPhone 15': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Pink', 'Yellow', 'Green', 'Blue', 'Black']
    },
    'iPhone 14 Pro Max': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Space Black', 'Silver', 'Gold', 'Deep Purple']
    },
    'iPhone 14 Pro': {
        repuestos: ['Pantalla', 'Batería', 'Tapa Trasera', 'Cámara', 'Placa'],
        colores: ['Space Black', 'Silver', 'Gold', 'Deep Purple']
    }
};

// Guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem('reservas', JSON.stringify(Reservas));
    ActualizarEstadisticas();
}

// Función para actualizar las estadísticas
function ActualizarEstadisticas() {
    const reservasPendientes = Reservas.filter(r => r.estado === 'pendiente').length;
    const completadasHoy = Reservas.filter(r => {
        const fecha = new Date(r.fechaCompletado);
        const hoy = new Date();
        return r.estado === 'instalado' && 
               fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
    }).length;
    const valorTotal = Reservas.reduce((total, r) => total + (r.precio || 0), 0);
    
    // Calcular tiempo promedio
    const reservasCompletadas = Reservas.filter(r => r.estado === 'instalado' && r.fechaCompletado);
    let tiempoPromedio = 0;
    if (reservasCompletadas.length > 0) {
        const tiempoTotal = reservasCompletadas.reduce((total, r) => {
            const inicio = new Date(r.fechaCreacion);
            const fin = new Date(r.fechaCompletado);
            return total + (fin - inicio);
        }, 0);
        tiempoPromedio = Math.round(tiempoTotal / reservasCompletadas.length / (1000 * 60 * 60 * 24));
    }

    document.getElementById('reservas-pendientes').textContent = reservasPendientes;
    document.getElementById('reservas-completadas').textContent = completadasHoy;
    document.getElementById('valor-pedidos').textContent = `$${valorTotal.toLocaleString()}`;
    document.getElementById('tiempo-promedio').textContent = `${tiempoPromedio}d`;
}

// Función para actualizar los repuestos según el modelo
function ActualizarRepuestos() {
    const modelo = document.getElementById('modelo-dispositivo').value;
    const tipoRepuesto = document.getElementById('tipo-repuesto');
    const colorRepuesto = document.getElementById('color-repuesto');
    
    tipoRepuesto.innerHTML = '<option value="">Seleccionar repuesto</option>';
    colorRepuesto.innerHTML = '<option value="">Seleccionar color</option>';
    
    if (modelo && CATALOGO[modelo]) {
        CATALOGO[modelo].repuestos.forEach(repuesto => {
            const option = document.createElement('option');
            option.value = repuesto;
            option.textContent = repuesto;
            tipoRepuesto.appendChild(option);
        });
        
        CATALOGO[modelo].colores.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorRepuesto.appendChild(option);
        });
    }
}

// Función para agregar una nueva reserva
function AgregarReserva() {
    const nombre = document.getElementById('cliente-nombre').value;
    const telefono = document.getElementById('cliente-telefono').value;
    const modelo = document.getElementById('modelo-dispositivo').value;
    const repuesto = document.getElementById('tipo-repuesto').value;
    const color = document.getElementById('color-repuesto').value;
    const calidad = document.getElementById('calidad-repuesto').value;
    const prioridad = document.getElementById('prioridad').value;
    const fechaEstimada = document.getElementById('fecha-estimada').value;
    const seña = parseFloat(document.getElementById('seña').value) || 0;
    const notas = document.getElementById('notas-pedido').value;
    const notificarLlegada = document.getElementById('notificar-llegada').checked;
    const notificarRecordatorio = document.getElementById('notificar-recordatorio').checked;
    const notificarCambios = document.getElementById('notificar-cambios').checked;

    if (!nombre || !telefono || !modelo || !repuesto || !color || !calidad || !prioridad || !fechaEstimada) {
        MostrarToast('warning', 'Por favor, complete todos los campos requeridos.');
    return;
  }

    const nuevaReserva = {
        id: Date.now(),
        nombre,
        telefono,
        modelo,
        repuesto,
        color,
        calidad,
        prioridad,
        fechaEstimada,
        seña,
        notas,
        notificaciones: {
            llegada: notificarLlegada,
            recordatorio: notificarRecordatorio,
            cambios: notificarCambios
        },
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
        historial: [{
            estado: 'pendiente',
            fecha: new Date().toISOString(),
            comentario: 'Reserva creada'
        }]
    };

    Reservas.push(nuevaReserva);
    guardarDatos();
    LimpiarFormulario();
    ActualizarListaReservas();
    MostrarToast('success', 'Reserva creada exitosamente');

    // Programar notificaciones si están habilitadas
    if (notificarRecordatorio) {
        ProgramarRecordatorio(nuevaReserva);
    }
}

// Función para filtrar reservas
function FiltrarReservas() {
    const busqueda = document.getElementById('buscar-reserva').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const prioridad = document.getElementById('filtro-prioridad').value;
    
    const reservasFiltradas = Reservas.filter(reserva => {
        const coincideTexto = reserva.nombre.toLowerCase().includes(busqueda) || 
                            reserva.modelo.toLowerCase().includes(busqueda) ||
                            reserva.repuesto.toLowerCase().includes(busqueda);
        const coincideEstado = !estado || reserva.estado === estado;
        const coincidePrioridad = !prioridad || reserva.prioridad === prioridad;
        return coincideTexto && coincideEstado && coincidePrioridad;
    });

    ActualizarListaReservas(reservasFiltradas);
}

// Función para ordenar reservas
function OrdenarReservas() {
    const criterio = document.getElementById('ordenar-por').value;
    
    const reservasOrdenadas = [...Reservas].sort((a, b) => {
        switch (criterio) {
            case 'fecha':
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            case 'prioridad':
                const prioridades = { alta: 3, media: 2, baja: 1 };
                return prioridades[b.prioridad] - prioridades[a.prioridad];
            case 'cliente':
                return a.nombre.localeCompare(b.nombre);
            case 'estado':
                return a.estado.localeCompare(b.estado);
            default:
                return 0;
        }
    });

    ActualizarListaReservas(reservasOrdenadas);
}

// Función para cambiar la vista
function CambiarVista(tipo) {
    const contenedor = document.getElementById('vista-contenedor');
    contenedor.className = `vista-${tipo}`;
    
    switch (tipo) {
        case 'lista':
            MostrarVistaLista(contenedor);
            break;
        case 'kanban':
            MostrarVistaKanban(contenedor);
            break;
        case 'calendario':
            MostrarVistaCalendario(contenedor);
            break;
    }
}

// Función para mostrar la vista de lista
function MostrarVistaLista(contenedor) {
    contenedor.innerHTML = '';
    Reservas.forEach(reserva => {
        const card = CrearTarjetaReserva(reserva);
        contenedor.appendChild(card);
    });
}

// Función para mostrar la vista Kanban
function MostrarVistaKanban(contenedor) {
    contenedor.innerHTML = '';
    const estados = ['pendiente', 'en-camino', 'recibido', 'instalado', 'cancelado'];
    
    estados.forEach(estado => {
        const columna = document.createElement('div');
        columna.className = 'kanban-columna';
        columna.innerHTML = `
            <div class="kanban-header">${estado.charAt(0).toUpperCase() + estado.slice(1)}</div>
        `;
        
        const reservasEstado = Reservas.filter(r => r.estado === estado);
        reservasEstado.forEach(reserva => {
            const card = CrearTarjetaReserva(reserva);
            columna.appendChild(card);
        });
        
        contenedor.appendChild(columna);
    });
}

// Función para mostrar la vista de calendario
function MostrarVistaCalendario(contenedor) {
    contenedor.innerHTML = '';
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    // Crear encabezados de días
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
        const diaHeader = document.createElement('div');
        diaHeader.className = 'dia-header';
        diaHeader.textContent = dia;
        contenedor.appendChild(diaHeader);
    });
    
    // Agregar días vacíos hasta el primer día del mes
    for (let i = 0; i < primerDia.getDay(); i++) {
        const diaVacio = document.createElement('div');
        diaVacio.className = 'dia-calendario vacio';
        contenedor.appendChild(diaVacio);
    }
    
    // Agregar los días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
        const diaElement = document.createElement('div');
        diaElement.className = 'dia-calendario';
        diaElement.innerHTML = `<div class="dia-header">${dia}</div>`;
        
        // Agregar reservas del día
        const reservasDia = Reservas.filter(r => {
            const fechaReserva = new Date(r.fechaEstimada);
            return fechaReserva.getDate() === dia &&
                   fechaReserva.getMonth() === fecha.getMonth() &&
                   fechaReserva.getFullYear() === fecha.getFullYear();
        });
        
        reservasDia.forEach(reserva => {
            const reservaItem = document.createElement('div');
            reservaItem.className = `reserva-item estado-${reserva.estado}`;
            reservaItem.textContent = `${reserva.nombre} - ${reserva.repuesto}`;
            reservaItem.onclick = () => MostrarDetallesReserva(reserva.id);
            diaElement.appendChild(reservaItem);
        });
        
        contenedor.appendChild(diaElement);
    }
}

// Función para crear una tarjeta de reserva
function CrearTarjetaReserva(reserva) {
    const card = document.createElement('div');
    card.className = 'reserva-item';
    card.innerHTML = `
        <div class="reserva-header">
            <div class="cliente-info">
                <span class="cliente-nombre">${reserva.nombre}</span>
                <span class="cliente-telefono">${reserva.telefono}</span>
            </div>
            <span class="reserva-estado estado-${reserva.estado}">${reserva.estado}</span>
        </div>
        <div class="reserva-detalles">
            <div class="detalle-item">
                <span class="detalle-label">Modelo:</span>
                <span class="detalle-valor">${reserva.modelo}</span>
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Repuesto:</span>
                <span class="detalle-valor">${reserva.repuesto} - ${reserva.color}</span>
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Calidad:</span>
                <span class="detalle-valor">${reserva.calidad}</span>
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Fecha Estimada:</span>
                <span class="detalle-valor">${new Date(reserva.fechaEstimada).toLocaleDateString()}</span>
            </div>
            ${reserva.seña ? `
            <div class="detalle-item">
                <span class="detalle-label">Seña:</span>
                <span class="detalle-valor">$${reserva.seña.toLocaleString()}</span>
            </div>
            ` : ''}
        </div>
        <div class="reserva-actions">
            <button onclick="CambiarEstado(${reserva.id})" class="button">
                <i class="ri-exchange-line"></i>
                Cambiar Estado
            </button>
            <button onclick="MostrarDetallesReserva(${reserva.id})" class="button">
                <i class="ri-file-list-3-line"></i>
                Ver Detalles
            </button>
            <button onclick="EliminarReserva(${reserva.id})" class="button button-error">
                <i class="ri-delete-bin-line"></i>
                Eliminar
            </button>
        </div>
    `;
    return card;
}

// Función para cambiar el estado de una reserva
function CambiarEstado(id) {
    const reserva = Reservas.find(r => r.id === id);
    if (!reserva) return;

    const estados = ['pendiente', 'en-camino', 'recibido', 'instalado', 'cancelado'];
    const estadoActual = estados.indexOf(reserva.estado);
    const nuevoEstado = estados[(estadoActual + 1) % estados.length];
    
    reserva.estado = nuevoEstado;
    if (nuevoEstado === 'instalado') {
        reserva.fechaCompletado = new Date().toISOString();
    }
    
    reserva.historial.push({
        estado: nuevoEstado,
        fecha: new Date().toISOString(),
        comentario: `Estado cambiado a ${nuevoEstado}`
    });

    guardarDatos();
    ActualizarListaReservas();
    
    if (reserva.notificaciones.cambios) {
        EnviarNotificacion(reserva, `Tu pedido ha cambiado a estado: ${nuevoEstado}`);
    }
}

// Función para mostrar detalles de una reserva
function MostrarDetallesReserva(id) {
    const reserva = Reservas.find(r => r.id === id);
    if (!reserva) return;

    const modal = document.getElementById('modal-seguimiento');
    const timeline = modal.querySelector('.timeline-seguimiento');
    
    timeline.innerHTML = reserva.historial.map(evento => `
        <div class="timeline-item">
            <div class="timeline-fecha">${new Date(evento.fecha).toLocaleString()}</div>
            <div class="timeline-estado">${evento.estado}</div>
            <div class="timeline-comentario">${evento.comentario}</div>
        </div>
    `).join('');

    modal.style.display = 'block';
}

// Función para cerrar el modal
function CerrarModal() {
    document.getElementById('modal-seguimiento').style.display = 'none';
}

// Función para eliminar una reserva
function EliminarReserva(id) {
    if (confirm('¿Está seguro de eliminar esta reserva?')) {
        const index = Reservas.findIndex(r => r.id === id);
        if (index !== -1) {
            Reservas.splice(index, 1);
            guardarDatos();
            ActualizarListaReservas();
            MostrarToast('success', 'Reserva eliminada exitosamente');
        }
    }
}

// Función para limpiar el formulario
function LimpiarFormulario() {
    document.getElementById('cliente-nombre').value = '';
    document.getElementById('cliente-telefono').value = '';
    document.getElementById('modelo-dispositivo').value = '';
    document.getElementById('tipo-repuesto').value = '';
    document.getElementById('color-repuesto').value = '';
    document.getElementById('calidad-repuesto').value = '';
    document.getElementById('prioridad').value = '';
    document.getElementById('fecha-estimada').value = '';
    document.getElementById('seña').value = '';
    document.getElementById('notas-pedido').value = '';
    document.getElementById('notificar-llegada').checked = true;
    document.getElementById('notificar-recordatorio').checked = true;
    document.getElementById('notificar-cambios').checked = false;
}

// Función para exportar a Excel
function ExportarExcel() {
    const data = Reservas.map(reserva => ({
        'Cliente': reserva.nombre,
        'Teléfono': reserva.telefono,
        'Modelo': reserva.modelo,
        'Repuesto': reserva.repuesto,
        'Color': reserva.color,
        'Calidad': reserva.calidad,
        'Estado': reserva.estado,
        'Fecha Estimada': new Date(reserva.fechaEstimada).toLocaleDateString(),
        'Fecha Creación': new Date(reserva.fechaCreacion).toLocaleDateString(),
        'Seña': reserva.seña,
        'Notas': reserva.notas
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");
    XLSX.writeFile(workbook, "reservas_repuestos.xlsx");
}

// Función para exportar a PDF
function ExportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Reservas de Repuestos", 20, 20);

    let y = 40;
    Reservas.forEach(reserva => {
        if (y >= 280) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.text(`Cliente: ${reserva.nombre}`, 20, y);
        doc.text(`Modelo: ${reserva.modelo} - ${reserva.repuesto}`, 20, y + 7);
        doc.text(`Estado: ${reserva.estado}`, 20, y + 14);
        doc.text(`Fecha Estimada: ${new Date(reserva.fechaEstimada).toLocaleDateString()}`, 20, y + 21);
        
        y += 35;
    });

    doc.save("reservas_repuestos.pdf");
}

// Función para compartir por WhatsApp
function CompartirWhatsApp() {
    let mensaje = "📱 *Reservas de Repuestos*\n\n";
    
    Reservas.forEach(reserva => {
        mensaje += `*Cliente:* ${reserva.nombre}\n`;
        mensaje += `📞 *Teléfono:* ${reserva.telefono}\n`;
        mensaje += `📱 *Modelo:* ${reserva.modelo}\n`;
        mensaje += `🔧 *Repuesto:* ${reserva.repuesto} - ${reserva.color}\n`;
        mensaje += `📅 *Fecha Estimada:* ${new Date(reserva.fechaEstimada).toLocaleDateString()}\n`;
        mensaje += `🔄 *Estado:* ${reserva.estado}\n\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Función para generar informe
function GenerarInforme() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const reservasMes = Reservas.filter(r => {
        const fecha = new Date(r.fechaCreacion);
        return fecha >= inicio && fecha <= fin;
    });

    const totalReservas = reservasMes.length;
    const completadas = reservasMes.filter(r => r.estado === 'instalado').length;
    const canceladas = reservasMes.filter(r => r.estado === 'cancelado').length;
    const enProceso = totalReservas - completadas - canceladas;
    const ingresos = reservasMes.reduce((total, r) => total + (r.seña || 0), 0);

    const mensaje = `📊 *Informe Mensual de Reservas*\n\n` +
                   `📅 Período: ${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}\n\n` +
                   `📦 Total Reservas: ${totalReservas}\n` +
                   `✅ Completadas: ${completadas}\n` +
                   `⏳ En Proceso: ${enProceso}\n` +
                   `❌ Canceladas: ${canceladas}\n` +
                   `💰 Ingresos por Señas: $${ingresos.toLocaleString()}\n\n` +
                   `📈 Tasa de Completación: ${((completadas/totalReservas)*100).toFixed(1)}%\n` +
                   `📉 Tasa de Cancelación: ${((canceladas/totalReservas)*100).toFixed(1)}%`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Función para programar recordatorio
function ProgramarRecordatorio(reserva) {
    // Aquí se implementaría la lógica para programar notificaciones
    // Por ahora solo mostramos un mensaje en consola
    console.log(`Recordatorio programado para la reserva de ${reserva.nombre}`);
}

// Función para enviar notificación
function EnviarNotificacion(reserva, mensaje) {
    // Aquí se implementaría la lógica para enviar notificaciones
    // Por ahora solo mostramos un mensaje en consola
    console.log(`Notificación para ${reserva.nombre}: ${mensaje}`);
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
    // Llenar el select de modelos
    const modeloSelect = document.getElementById('modelo-dispositivo');
    Object.keys(CATALOGO).forEach(modelo => {
        const option = document.createElement('option');
        option.value = modelo;
        option.textContent = modelo;
        modeloSelect.appendChild(option);
    });

    // Inicializar la vista de lista por defecto
    CambiarVista('lista');
    ActualizarEstadisticas();
});
