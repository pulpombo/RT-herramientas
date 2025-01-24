// js/CelusUsados.js

// Configuración mejorada
const CONFIG = {
    BATERIA: {
        OPTIMA: 90,
        BUENA: 80,
        REGULAR: 70
    },
    ALERTAS: {
        BATERIA_BAJA: 75,
        STOCK_BAJO: 5,
        INTERVALO_VERIFICACION: 300000 // 5 minutos
    },
    PRECIOS: {
        MINIMO_PORCENTAJE: 0.6, // 60% del precio nuevo
        MAXIMO_PORCENTAJE: 0.85 // 85% del precio nuevo
    },
    GRAFICOS: {
        COLORES: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(153, 102, 255, 0.8)'
        ]
    }
};

// Variables globales con persistencia
let Registros = JSON.parse(localStorage.getItem('registros')) || [];
let Sesiones = JSON.parse(localStorage.getItem('sesiones')) || [];
let Estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || {
    totalRegistros: 0,
    promediosBateria: {},
    distribucionModelos: {},
    tendenciasVenta: [],
    ultimaActualizacion: null
};
let tema = localStorage.getItem('tema') || 'light';

// Sistema de gestión de datos mejorado
let Celulares = JSON.parse(localStorage.getItem('celulares')) || [];
let Historial = JSON.parse(localStorage.getItem('historial_celulares')) || [];
let Configuracion = JSON.parse(localStorage.getItem('config_celulares')) || {
    alertaStockBajo: 5,
    alertaBateriaBaja: 80,
    preciosMinimos: {},
    preciosMaximos: {},
    notificaciones: true,
    temaOscuro: false,
    ordenRegistros: 'fecha-desc',
    vistaPredeterminada: 'grid'
};

// Función para guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem('registros', JSON.stringify(Registros));
    localStorage.setItem('sesiones', JSON.stringify(Sesiones));
    localStorage.setItem('celulares', JSON.stringify(Celulares));
    localStorage.setItem('historial_celulares', JSON.stringify(Historial));
    localStorage.setItem('config_celulares', JSON.stringify(Configuracion));
    ActualizarEstadisticas();
    ActualizarGraficos();
    VerificarAlertas();
}

// Función para registrar cambios en el historial
function registrarHistorial(accion, celular, detalles = '') {
    const entrada = {
        fecha: new Date().toISOString(),
        accion: accion,
        celular: celular,
        detalles: detalles,
        usuario: 'Admin'
    };
    
    Historial.unshift(entrada); // Agregar al inicio para mostrar más recientes primero
    if (Historial.length > 1000) Historial.pop(); // Mantener historial manejable
    
    // Notificar cambios importantes
    if (['eliminar', 'editar', 'bateria_baja'].includes(accion)) {
        mostrarNotificacion(`${accion.toUpperCase()}: ${celular.Modelo} - ${detalles}`);
    }
    
    guardarDatos();
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    if (!Configuracion.notificaciones) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Celulares Usados', {
            body: mensaje,
            icon: '/path/to/icon.png'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                mostrarNotificacion(mensaje, tipo);
            }
        });
    }
    
    showToast(tipo, mensaje);
}

// Función para actualizar gráficos
function ActualizarGraficos() {
    actualizarGraficoModelos();
    actualizarGraficoTendencias();
}

// Función para actualizar el gráfico de modelos
function actualizarGraficoModelos() {
    const ctx = document.getElementById('graficoModelos')?.getContext('2d');
    if (!ctx) return;

    const datos = Object.entries(Estadisticas.distribucionModelos);
    const modelos = datos.map(([modelo]) => modelo);
    const cantidades = datos.map(([, cantidad]) => cantidad);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: modelos,
            datasets: [{
                data: cantidades,
                backgroundColor: CONFIG.GRAFICOS.COLORES,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Distribución por Modelo'
                }
            }
        }
    });
}

// Función para actualizar el gráfico de tendencias
function actualizarGraficoTendencias() {
    const ctx = document.getElementById('graficoTendencia')?.getContext('2d');
    if (!ctx) return;

    const datos = Estadisticas.tendenciasVenta;
    const fechas = datos.map(d => new Date(d.fecha).toLocaleDateString());
    const cantidades = datos.map(d => d.cantidad);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [{
                label: 'Registros por día',
                data: cantidades,
                borderColor: CONFIG.GRAFICOS.COLORES[0],
                tension: 0.4,
                fill: true,
                backgroundColor: `${CONFIG.GRAFICOS.COLORES[0]}33`
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Tendencia de Registros'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Función para ordenar registros
function ordenarRegistros(registros, criterio = Configuracion.ordenRegistros) {
    const registrosOrdenados = [...registros];
    
    switch (criterio) {
        case 'fecha-desc':
            registrosOrdenados.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
            break;
        case 'fecha-asc':
            registrosOrdenados.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
            break;
        case 'bateria-desc':
            registrosOrdenados.sort((a, b) => {
                const promA = (parseInt(a.Bateria3u) + parseInt(a.BateriaDevice)) / 2;
                const promB = (parseInt(b.Bateria3u) + parseInt(b.BateriaDevice)) / 2;
                return promB - promA;
            });
            break;
        case 'bateria-asc':
            registrosOrdenados.sort((a, b) => {
                const promA = (parseInt(a.Bateria3u) + parseInt(a.BateriaDevice)) / 2;
                const promB = (parseInt(b.Bateria3u) + parseInt(b.BateriaDevice)) / 2;
                return promA - promB;
            });
            break;
        case 'modelo':
            registrosOrdenados.sort((a, b) => a.Modelo.localeCompare(b.Modelo));
            break;
    }
    
    return registrosOrdenados;
}

// Función para cambiar vista
function cambiarVista(vista) {
    const container = document.getElementById('lista-registros');
    if (!container) return;
    
    container.className = `vista-${vista}`;
    Configuracion.vistaPredeterminada = vista;
    guardarDatos();
    
    // Actualizar botones de vista
    document.querySelectorAll('.vista-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vista === vista);
    });
}

// Función para exportar a Excel mejorada
function ExportarExcel() {
    if (Registros.length === 0) {
        showToast('warning', 'No hay registros para exportar');
        return;
    }

    const wb = XLSX.utils.book_new();
    
    // Hoja de registros actuales
    const wsData = Registros.map(r => ({
        Modelo: r.Modelo,
        Variante: r.Variante,
        IMEI: r.IMEI,
        Almacenamiento: `${r.Storage}GB`,
        'Batería 3uTools': `${r.Bateria3u}%`,
        'Batería Device': `${r.BateriaDevice}%`,
        'Promedio Batería': `${((parseInt(r.Bateria3u) + parseInt(r.BateriaDevice)) / 2).toFixed(1)}%`,
        Limpieza: r.Limpieza,
        'Directo a Venta': r.DirectoVenta,
        Proveedor: r.Proveedor,
        Detalles: r.Detalles || '',
        Fecha: r.Fecha
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    
    // Ajustar anchos de columna
    const colWidths = {
        A: 15, // Modelo
        B: 12, // Variante
        C: 18, // IMEI
        D: 15, // Almacenamiento
        E: 15, // Batería 3uTools
        F: 15, // Batería Device
        G: 15, // Promedio Batería
        H: 12, // Limpieza
        I: 15, // Directo a Venta
        J: 15, // Proveedor
        K: 30, // Detalles
        L: 20  // Fecha
    };
    
    ws['!cols'] = Object.entries(colWidths).map(([, width]) => ({ wch: width }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    
    // Hoja de estadísticas
    const statsData = [
        ['Estadísticas Generales'],
        ['Total Registros', Registros.length],
        ['Última Actualización', new Date().toLocaleString()],
        [],
        ['Distribución por Modelo'],
        ...Object.entries(Estadisticas.distribucionModelos).map(([modelo, cantidad]) => [modelo, cantidad]),
        [],
        ['Promedios de Batería por Modelo'],
        ...Object.entries(Estadisticas.promediosBateria).map(([modelo, datos]) => [
            modelo,
            `${(datos.suma / datos.cantidad).toFixed(1)}%`
        ])
    ];
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');
    
    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Celulares_Usados_${fecha}.xlsx`);
    
    showToast('success', 'Archivo Excel generado exitosamente');
}

// Función para verificar alertas
function VerificarAlertas() {
    if (!Configuracion.notificaciones) return;
    
    const alertas = [];
    
    // Verificar baterías bajas
    Registros.forEach(registro => {
        const promedioBateria = (parseInt(registro.Bateria3u) + parseInt(registro.BateriaDevice)) / 2;
        if (promedioBateria < CONFIG.ALERTAS.BATERIA_BAJA) {
            alertas.push({
                tipo: 'warning',
                mensaje: `Batería baja en ${registro.Modelo} (${promedioBateria.toFixed(1)}%)`
            });
        }
    });
    
    // Verificar stock bajo por modelo
    const stockPorModelo = {};
    Registros.forEach(registro => {
        stockPorModelo[registro.Modelo] = (stockPorModelo[registro.Modelo] || 0) + 1;
    });
    
    Object.entries(stockPorModelo).forEach(([modelo, cantidad]) => {
        if (cantidad <= CONFIG.ALERTAS.STOCK_BAJO) {
            alertas.push({
                tipo: 'warning',
                mensaje: `Stock bajo de ${modelo} (${cantidad} unidades)`
            });
        }
    });
    
    // Mostrar alertas
    alertas.forEach(alerta => {
        mostrarNotificacion(alerta.mensaje, alerta.tipo);
    });
}

// Función para cambiar entre modo oscuro y claro
function ToggleModoOscuro() {
    const html = document.documentElement;
    const modoOscuroTexto = document.getElementById("modo-oscuro-texto");

    tema = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", tema);
    modoOscuroTexto.innerHTML = tema === "light" ? "🌙 Modo Oscuro" : "☀️ Modo Claro";
    
    // Guardar preferencia de tema
    localStorage.setItem('tema', tema);
}

// Función para actualizar las variantes del modelo de iPhone
function ActualizarVariantes() {
    const ModeloSelect = document.getElementById("Modelo");
    const VarianteSelect = document.getElementById("Variante");
    const Modelo = ModeloSelect.value;

    VarianteSelect.innerHTML = '<option value="">Seleccionar Variante</option>';

    let Variantes = [];

    switch (Modelo) {
        case "iPhone X":
            Variantes = ["Regular"];
            break;
        case "iPhone XS":
            Variantes = ["Regular", "Max"];
            break;
        case "iPhone XR":
            Variantes = ["Regular"];
            break;
        case "iPhone 11":
            Variantes = ["Regular", "Pro", "Pro Max"];
            break;
        case "iPhone 11 Pro":
            Variantes = ["Regular", "Max"];
            break;
        case "iPhone 12":
            Variantes = ["Regular", "Mini"];
            break;
        case "iPhone 12 Pro":
            Variantes = ["Regular", "Max"];
            break;
        case "iPhone 13":
            Variantes = ["Regular", "Mini"];
            break;
        case "iPhone 13 Pro":
            Variantes = ["Regular", "Max"];
            break;
        case "iPhone 14":
            Variantes = ["Regular", "Plus"];
            break;
        case "iPhone 14 Pro":
            Variantes = ["Regular", "Max"];
            break;
    }

    Variantes.forEach((variante) => {
        const Option = document.createElement("option");
        Option.value = variante;
        Option.textContent = variante;
        VarianteSelect.appendChild(Option);
    });
}

// Función para validar IMEI
function ValidarIMEIDuplicado(IMEI, IndexActual = -1) {
    return !Registros.some((registro, index) => 
        index !== IndexActual && registro.IMEI === IMEI
    );
}

// Función para procesar el registro
function ProcesarRegistro() {
    const Modelo = document.getElementById("Modelo").value;
    const Variante = document.getElementById("Variante").value;
    const IMEI = document.getElementById("IMEI").value;
    const Storage = document.getElementById("Storage").value;
    const Bateria3u = document.getElementById("Bateria3u").value;
    const BateriaDevice = document.getElementById("BateriaDevice").value;
    const Limpieza = document.getElementById("Limpieza").value;
    const DirectoVenta = document.getElementById("DirectoVenta").value;
    const Detalles = document.getElementById("Detalles").value;
    const Proveedor = document.getElementById("Proveedor").value;

    // Validaciones
    if (!Modelo || !IMEI || !Storage || !Bateria3u || !BateriaDevice) {
        showToast('error', 'Todos los campos son obligatorios');
        return;
    }

    if (!ValidarIMEIDuplicado(IMEI)) {
        showToast('error', 'Este IMEI ya está registrado');
        return;
    }

    const registro = {
        Modelo,
        Variante,
        IMEI,
        Storage,
        Bateria3u,
        BateriaDevice,
        Limpieza,
        DirectoVenta,
        Detalles,
        Proveedor,
        Fecha: new Date().toLocaleString()
    };

    Registros.push(registro);
    guardarDatos();
    ActualizarListaRegistros();
    LimpiarFormulario();
    showToast('success', 'Registro agregado exitosamente');
}

// Función para limpiar el formulario
function LimpiarFormulario() {
    document.getElementById("Modelo").value = "";
    document.getElementById("Variante").value = "Regular";
    document.getElementById("IMEI").value = "";
    document.getElementById("Storage").value = "";
    document.getElementById("Bateria3u").value = "";
    document.getElementById("BateriaDevice").value = "";
    document.getElementById("Limpieza").value = "No";
    document.getElementById("DirectoVenta").value = "No";
    document.getElementById("Detalles").value = "";
    document.getElementById("Proveedor").value = "";
}

// Función para actualizar la lista de registros
function ActualizarListaRegistros(registrosFiltrados = null) {
    const container = document.getElementById('lista-registros');
    const registrosAMostrar = registrosFiltrados || Registros;
    
    container.innerHTML = '';

    registrosAMostrar.forEach((registro, index) => {
        const card = document.createElement('div');
        card.className = 'registro-card';
        
        const estadoBateria = calcularEstadoBateria(registro.Bateria3u, registro.BateriaDevice);
        
        card.innerHTML = `
            <div class="registro-header">
                <h3>${registro.Modelo} ${registro.Variante}</h3>
                <span class="storage-badge">${registro.Storage}GB</span>
            </div>
            <div class="registro-info">
                <p>
                    <span><strong>IMEI:</strong></span>
                    <span>${registro.IMEI}</span>
                </p>
                <p>
                    <span><strong>Batería 3uTools:</strong></span>
                    <span class="bateria-badge ${estadoBateria.clase}">
                        <i class="ri-battery-2-charge-line"></i>
                        ${registro.Bateria3u}%
                    </span>
                </p>
                <p>
                    <span><strong>Batería Device:</strong></span>
                    <span class="bateria-badge ${estadoBateria.clase}">
                        <i class="ri-battery-2-charge-line"></i>
                        ${registro.BateriaDevice}%
                    </span>
                </p>
                <p>
                    <span><strong>Limpieza:</strong></span>
                    <span>${registro.Limpieza}</span>
                </p>
                <p>
                    <span><strong>Directo a Venta:</strong></span>
                    <span>${registro.DirectoVenta}</span>
                </p>
                <p>
                    <span><strong>Proveedor:</strong></span>
                    <span>${registro.Proveedor}</span>
                </p>
                ${registro.Detalles ? `
                <p>
                    <span><strong>Detalles:</strong></span>
                    <span>${registro.Detalles}</span>
                </p>` : ''}
                <p>
                    <span><strong>Fecha:</strong></span>
                    <span>${registro.Fecha}</span>
                </p>
            </div>
            <div class="registro-actions">
                <button onclick="EditarRegistro(${index})" class="button">
                    <i class="ri-edit-line"></i> Editar
                </button>
                <button onclick="GenerarSticker(${index})" class="button">
                    <i class="ri-printer-line"></i> Sticker
                </button>
                <button onclick="EliminarRegistro(${index})" class="button button-error">
                    <i class="ri-delete-bin-line"></i> Eliminar
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    ActualizarEstadisticas();
}

// Función para calcular el estado de la batería
function calcularEstadoBateria(bateria3u, bateriaDevice) {
    const promedio = (parseInt(bateria3u) + parseInt(bateriaDevice)) / 2;
    if (promedio >= 90) return { clase: 'bateria-optima', texto: 'Óptima' };
    if (promedio >= 80) return { clase: 'bateria-buena', texto: 'Buena' };
    if (promedio >= 70) return { clase: 'bateria-regular', texto: 'Regular' };
    return { clase: 'bateria-mala', texto: 'Mala' };
}

// Función para editar registro
function EditarRegistro(index) {
    const registro = Registros[index];
    
    document.getElementById("Modelo").value = registro.Modelo;
    ActualizarVariantes();
    document.getElementById("Variante").value = registro.Variante;
    document.getElementById("IMEI").value = registro.IMEI;
    document.getElementById("Storage").value = registro.Storage;
    document.getElementById("Bateria3u").value = registro.Bateria3u;
    document.getElementById("BateriaDevice").value = registro.BateriaDevice;
    document.getElementById("Limpieza").value = registro.Limpieza;
    document.getElementById("DirectoVenta").value = registro.DirectoVenta;
    document.getElementById("Detalles").value = registro.Detalles;
    document.getElementById("Proveedor").value = registro.Proveedor;

    // Cambiar el botón de guardar
    const btnGuardar = document.querySelector('button[onclick="ProcesarRegistro()"]');
    btnGuardar.innerHTML = '<i class="ri-save-line"></i> Actualizar';
    btnGuardar.onclick = () => GuardarEdicion(index);

    // Agregar botón de cancelar
    if (!document.getElementById('btnCancelar')) {
        const btnCancelar = document.createElement('button');
        btnCancelar.id = 'btnCancelar';
        btnCancelar.className = 'button button-error';
        btnCancelar.innerHTML = '<i class="ri-close-line"></i> Cancelar';
        btnCancelar.onclick = CancelarEdicion;
        btnGuardar.parentNode.insertBefore(btnCancelar, btnGuardar.nextSibling);
    }
}

// Función para guardar edición
function GuardarEdicion(index) {
    const IMEI = document.getElementById("IMEI").value;
    if (!ValidarIMEIDuplicado(IMEI, index)) {
        showToast('error', 'Este IMEI ya está registrado');
        return;
    }

    Registros[index] = {
        Modelo: document.getElementById("Modelo").value,
        Variante: document.getElementById("Variante").value,
        IMEI: IMEI,
        Storage: document.getElementById("Storage").value,
        Bateria3u: document.getElementById("Bateria3u").value,
        BateriaDevice: document.getElementById("BateriaDevice").value,
        Limpieza: document.getElementById("Limpieza").value,
        DirectoVenta: document.getElementById("DirectoVenta").value,
        Detalles: document.getElementById("Detalles").value,
        Proveedor: document.getElementById("Proveedor").value,
        Fecha: new Date().toLocaleString()
    };

    guardarDatos();
    ActualizarListaRegistros();
    CancelarEdicion();
    showToast('success', 'Registro actualizado exitosamente');
}

// Función para cancelar edición
function CancelarEdicion() {
    LimpiarFormulario();
    const btnGuardar = document.querySelector('button[onclick*="GuardarEdicion"]');
    btnGuardar.innerHTML = '<i class="ri-save-line"></i> Guardar';
    btnGuardar.onclick = ProcesarRegistro;
    
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.remove();
}

// Función para eliminar registro
function EliminarRegistro(index) {
    if (confirm('¿Está seguro de eliminar este registro?')) {
        Registros.splice(index, 1);
        guardarDatos();
        ActualizarListaRegistros();
        showToast('success', 'Registro eliminado exitosamente');
    }
}

// Función para guardar sesión
function GuardarSesion() {
    if (Registros.length === 0) {
        showToast('warning', 'No hay registros para guardar');
        return;
    }

    const nombreSesion = prompt('Ingrese un nombre para la sesión:');
    if (nombreSesion) {
        const sesion = {
            nombre: nombreSesion,
            registros: [...Registros],
            fecha: new Date().toLocaleString(),
            cantidad: Registros.length
        };
        Sesiones.push(sesion);
        guardarDatos();
        ActualizarListaSesiones();
        showToast('success', 'Sesión guardada exitosamente');
    }
}

// Función para cargar sesión
function CargarSesion() {
    const select = document.getElementById('sesiones-select');
    const sesionSeleccionada = select.value;
    
    if (!sesionSeleccionada) return;
    
    const sesion = Sesiones.find(s => s.nombre === sesionSeleccionada);
    if (sesion) {
        Registros = [...sesion.registros];
        guardarDatos();
        ActualizarListaRegistros();
        ActualizarMetadataSesion(sesion);
        showToast('success', 'Sesión cargada exitosamente');
    }
}

// Función para actualizar lista de sesiones
function ActualizarListaSesiones() {
    const select = document.getElementById('sesiones-select');
    select.innerHTML = '<option value="">Seleccionar Sesión</option>';
    
    Sesiones.forEach(sesion => {
        const option = document.createElement('option');
        option.value = sesion.nombre;
        option.textContent = sesion.nombre;
        select.appendChild(option);
    });
}

// Función para actualizar metadata de sesión
function ActualizarMetadataSesion(sesion) {
    const metadata = document.getElementById('sesion-metadata');
    if (metadata) {
        metadata.innerHTML = `
            <strong>Fecha:</strong> ${sesion.fecha} - 
            <strong>Cantidad de registros:</strong> ${sesion.cantidad}
        `;
    }
}

// Función para actualizar estadísticas
function ActualizarEstadisticas() {
    const stats = {
        totalRegistros: Registros.length,
        promediosBateria: {},
        distribucionModelos: {},
        tendenciasVenta: [],
        ultimaActualizacion: new Date().toISOString()
    };

    // Calcular promedios de batería por modelo
    Registros.forEach(registro => {
        const modelo = registro.Modelo;
        if (!stats.promediosBateria[modelo]) {
            stats.promediosBateria[modelo] = {
                suma: 0,
                cantidad: 0
            };
        }
        const promedioBateria = (parseInt(registro.Bateria3u) + parseInt(registro.BateriaDevice)) / 2;
        stats.promediosBateria[modelo].suma += promedioBateria;
        stats.promediosBateria[modelo].cantidad++;
    });

    // Calcular distribución de modelos
    Registros.forEach(registro => {
        const modelo = registro.Modelo;
        stats.distribucionModelos[modelo] = (stats.distribucionModelos[modelo] || 0) + 1;
    });

    // Calcular tendencias de venta (últimos 30 días)
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const ventasPorDia = {};
    Registros.forEach(registro => {
        const fecha = new Date(registro.Fecha);
        if (fecha >= treintaDiasAtras && registro.DirectoVenta === 'Si') {
            const fechaStr = fecha.toISOString().split('T')[0];
            ventasPorDia[fechaStr] = (ventasPorDia[fechaStr] || 0) + 1;
        }
    });

    stats.tendenciasVenta = Object.entries(ventasPorDia)
        .map(([fecha, cantidad]) => ({ fecha, cantidad }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Actualizar estadísticas en localStorage
    Estadisticas = stats;
    localStorage.setItem('estadisticas', JSON.stringify(stats));

    // Actualizar dashboard
    ActualizarDashboard();
}

// Función para actualizar el dashboard
function ActualizarDashboard() {
    const totalRegistros = Registros.length;
    const totalBateriaBuena = Registros.filter(r => 
        (parseInt(r.Bateria3u) + parseInt(r.BateriaDevice)) / 2 >= CONFIG.BATERIA.BUENA
    ).length;
    const totalDirectoVenta = Registros.filter(r => r.DirectoVenta === 'Si').length;

    const stats = document.querySelector('.dashboard-stats');
    if (stats) {
        stats.innerHTML = `
            <div class="stat-card">
                <i class="ri-smartphone-line"></i>
                <div class="stat-info">
                    <span class="stat-value">${totalRegistros}</span>
                    <span class="stat-label">Total Registros</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="ri-battery-2-charge-line"></i>
                <div class="stat-info">
                    <span class="stat-value">${totalBateriaBuena}</span>
                    <span class="stat-label">Batería Óptima</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="ri-shopping-bag-line"></i>
                <div class="stat-info">
                    <span class="stat-value">${totalDirectoVenta}</span>
                    <span class="stat-label">Listos para Venta</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="ri-line-chart-line"></i>
                <div class="stat-info">
                    <span class="stat-value">${calcularTendencia()}%</span>
                    <span class="stat-label">Tendencia Mensual</span>
                </div>
            </div>
        `;
    }
}

// Función para calcular tendencia
function calcularTendencia() {
    if (Estadisticas.tendenciasVenta.length < 2) return 0;
    
    const ultimosDias = Estadisticas.tendenciasVenta.slice(-7);
    const promedioReciente = ultimosDias.reduce((sum, dia) => sum + dia.cantidad, 0) / ultimosDias.length;
    
    const diasAnteriores = Estadisticas.tendenciasVenta.slice(-14, -7);
    const promedioAnterior = diasAnteriores.reduce((sum, dia) => sum + dia.cantidad, 0) / diasAnteriores.length;
    
    if (promedioAnterior === 0) return 100;
    
    const tendencia = ((promedioReciente - promedioAnterior) / promedioAnterior) * 100;
    return Math.round(tendencia);
}

// Función para exportar stickers
function ExportarStickers() {
    const doc = new jsPDF();
    const stickersPerPage = 4;
    let currentY = 10;
    let currentPage = 1;

    Registros.forEach((registro, index) => {
        if (index > 0 && index % stickersPerPage === 0) {
            doc.addPage();
            currentY = 10;
            currentPage++;
        }

        const promedioBateria = (parseInt(registro.Bateria3u) + parseInt(registro.BateriaDevice)) / 2;
        const estadoBateria = calcularEstadoBateria(registro.Bateria3u, registro.BateriaDevice);

        // Dibujar borde del sticker
        doc.rect(10, currentY, 190, 60);

        // Título
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${registro.Modelo} ${registro.Variante} - ${registro.Storage}GB`, 105, currentY + 10, { align: 'center' });

        // Información principal
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text([
            `IMEI: ${registro.IMEI}`,
            `Batería: ${promedioBateria.toFixed(1)}% (${estadoBateria.texto})`,
            `Limpieza: ${registro.Limpieza}`,
            `Directo a Venta: ${registro.DirectoVenta}`,
            `Fecha Revisión: ${registro.Fecha}`
        ], 15, currentY + 20);

        // QR Code con el IMEI
        const qr = new QRCode(null, {
            text: registro.IMEI,
            width: 40,
            height: 40
        });
        const qrImage = qr.createDataURL();
        doc.addImage(qrImage, 'PNG', 150, currentY + 15, 40, 40);

        // Pie del sticker
        doc.setFontSize(8);
        doc.text('Rosario Tecno - Revisión y Control de Calidad', 105, currentY + 55, { align: 'center' });

        currentY += 70;
    });

    doc.save(`Stickers_Celulares_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('success', 'Stickers generados exitosamente');
}

// Función para generar un sticker individual
function GenerarSticker(index) {
    const registro = Registros[index];
    const doc = new jsPDF();
    
    // Dibujar borde del sticker
    doc.rect(10, 10, 190, 60);

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${registro.Modelo} ${registro.Variante} - ${registro.Storage}GB`, 105, 20, { align: 'center' });

    const promedioBateria = (parseInt(registro.Bateria3u) + parseInt(registro.BateriaDevice)) / 2;
    const estadoBateria = calcularEstadoBateria(registro.Bateria3u, registro.BateriaDevice);

    // Información principal
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text([
        `IMEI: ${registro.IMEI}`,
        `Batería: ${promedioBateria.toFixed(1)}% (${estadoBateria.texto})`,
        `Limpieza: ${registro.Limpieza}`,
        `Directo a Venta: ${registro.DirectoVenta}`,
        `Fecha Revisión: ${registro.Fecha}`
    ], 15, 30);

    // QR Code con el IMEI
    const qr = new QRCode(null, {
        text: registro.IMEI,
        width: 40,
        height: 40
    });
    const qrImage = qr.createDataURL();
    doc.addImage(qrImage, 'PNG', 150, 25, 40, 40);

    // Pie del sticker
    doc.setFontSize(8);
    doc.text('Rosario Tecno - Revisión y Control de Calidad', 105, 65, { align: 'center' });

    doc.save(`Sticker_${registro.Modelo}_${registro.IMEI}.pdf`);
    showToast('success', 'Sticker generado exitosamente');
}

// Función para filtrar registros
function FiltrarRegistros() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    const filtroModelo = document.getElementById('filtro-modelo').value;
    const filtroEstado = document.getElementById('filtro-estado').value;

    const registrosFiltrados = Registros.filter(registro => {
        const coincideBusqueda = registro.IMEI.includes(busqueda) ||
            registro.Modelo.toLowerCase().includes(busqueda) ||
            registro.Detalles?.toLowerCase().includes(busqueda);
            
        const coincideModelo = !filtroModelo || registro.Modelo === filtroModelo;
        const coincideEstado = !filtroEstado || 
            (filtroEstado === 'optima' && calcularEstadoBateria(registro.Bateria3u, registro.BateriaDevice).clase === 'bateria-optima') ||
            (filtroEstado === 'venta' && registro.DirectoVenta === 'Si');

        return coincideBusqueda && coincideModelo && coincideEstado;
    });

    ActualizarListaRegistros(registrosFiltrados);
}

// Manejo de la sidebar
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const closeBtn = document.querySelector('.close-btn');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Función para abrir/cerrar la sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    // Event listeners
    menuBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Cerrar sidebar con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });

    ActualizarListaRegistros();
    ActualizarListaSesiones();
    ActualizarEstadisticas();
    ActualizarGraficos();
    
    // Event listeners
    const modeloSelect = document.getElementById('Modelo');
    if (modeloSelect) {
        modeloSelect.addEventListener('change', ActualizarVariantes);
    }

    const busquedaInput = document.getElementById('busqueda');
    if (busquedaInput) {
        busquedaInput.addEventListener('input', FiltrarRegistros);
    }

    const filtroModelo = document.getElementById('filtro-modelo');
    if (filtroModelo) {
        filtroModelo.addEventListener('change', FiltrarRegistros);
    }

    const filtroEstado = document.getElementById('filtro-estado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', FiltrarRegistros);
    }

    // Verificar alertas cada 5 minutos
    setInterval(VerificarAlertas, CONFIG.ALERTAS.INTERVALO_VERIFICACION);
});
