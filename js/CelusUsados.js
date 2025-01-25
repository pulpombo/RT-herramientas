// js/CelusUsados.js

// Configuración inicial y variables globales
const CONFIG = {
    STORAGE_KEY: 'celulares_usados',
    CHART_COLORS: {
        primary: '#4CAF50',
        secondary: '#2196F3',
        accent: '#FFC107',
        danger: '#F44336'
    },
    ANIMATION_DURATION: 300,
    MAX_ITEMS_PER_PAGE: 12,
    MODELOS_IPHONE: {
        'iPhone X': ['Regular'],
        'iPhone XS': ['Regular', 'Max'],
        'iPhone XR': ['Regular'],
        'iPhone 11': ['Regular', 'Pro', 'Pro Max'],
        'iPhone 12': ['Mini', 'Regular', 'Pro', 'Pro Max'],
        'iPhone 13': ['Mini', 'Regular', 'Pro', 'Pro Max'],
        'iPhone 14': ['Regular', 'Plus', 'Pro', 'Pro Max'],
        'iPhone 15': ['Regular', 'Plus', 'Pro', 'Pro Max']
    }
};

// Estado global de la aplicación
const state = {
    celulares: [],
    filtros: {
        busqueda: '',
        estado: 'todos',
        bateria: 'todas',
        ordenar: 'fecha'
    },
    paginacion: {
        pagina: 1,
        total: 0
    },
    vista: 'grid',
    charts: {}
};

// Clase principal para la gestión de celulares
class GestorCelulares {
    constructor() {
        this.state = {
            celulares: [],
            vistaActual: 'grid',
            paginaActual: 1,
            itemsPorPagina: 12,
            filtros: {
                busqueda: '',
                modelo: '',
                estado: ''
            }
        };
        this.initializeEventListeners();
        this.loadData();
        this.setupCharts();
        this.actualizarEstadisticas();
        this.renderizarRegistros();
    }

    // Inicialización de event listeners
    initializeEventListeners() {
        // Formulario de registro
        document.getElementById('formulario-registro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarCelular();
        });

        // Botones de vista
        document.querySelectorAll('.vista-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const vista = btn.dataset.vista;
                this.cambiarVista(vista);
            });
        });

        // Botón imprimir
        document.querySelector('.accion-btn.secundario').addEventListener('click', () => {
            this.imprimirRegistros();
        });

        // Botón exportar Excel
        document.querySelector('.accion-btn').addEventListener('click', () => {
            this.exportarExcel();
        });

        // Filtros
        document.getElementById('busqueda').addEventListener('input', (e) => {
            this.state.filtros.busqueda = e.target.value;
            this.filtrarYRenderizar();
        });

        document.getElementById('filtro-modelo').addEventListener('change', (e) => {
            this.state.filtros.modelo = e.target.value;
            this.filtrarYRenderizar();
        });

        document.getElementById('filtro-estado').addEventListener('change', (e) => {
            this.state.filtros.estado = e.target.value;
            this.filtrarYRenderizar();
        });

        // Modal de estadísticas
        document.getElementById('mostrar-estadisticas').addEventListener('click', () => this.mostrarEstadisticas());
        document.querySelector('.modal-close').addEventListener('click', () => this.cerrarModal());

        // Autocompletado de modelo
        this.setupModeloAutocompletado();
    }

    // Carga inicial de datos
    loadData() {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        this.state.celulares = savedData ? JSON.parse(savedData) : [];
    }

    // Configuración de gráficos
    setupCharts() {
        // Gráfico de estados
        const ctxEstados = document.getElementById('grafico-estados').getContext('2d');
        state.charts.estados = new Chart(ctxEstados, {
            type: 'doughnut',
            data: {
                labels: ['Excelente', 'Muy Bueno', 'Bueno', 'Regular'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: Object.values(CONFIG.CHART_COLORS)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Gráfico de baterías
        const ctxBaterias = document.getElementById('grafico-baterias').getContext('2d');
        state.charts.baterias = new Chart(ctxBaterias, {
            type: 'bar',
            data: {
                labels: ['Óptima', 'Buena', 'Regular', 'Baja'],
                datasets: [{
                    label: 'Cantidad',
                    data: [0, 0, 0, 0],
                    backgroundColor: Object.values(CONFIG.CHART_COLORS)
                }]
            },
            options: {
                responsive: true,
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

    registrarCelular() {
        const formData = {
            modelo: document.getElementById('Modelo').value,
            variante: document.getElementById('Variante').value,
            imei: document.getElementById('IMEI').value,
            almacenamiento: document.getElementById('almacenamiento').value,
            bateria3u: document.getElementById('bateria3u').value,
            bateriaDevice: document.getElementById('bateriaDevice').value,
            limpieza: document.getElementById('limpieza').value,
            directoVenta: document.getElementById('directoVenta').checked,
            proveedor: document.getElementById('proveedor').value,
            detalles: document.getElementById('detalles').value,
            fecha: new Date().toISOString(),
            id: Date.now().toString()
        };

        if (!this.validarDatos(formData)) {
            return;
        }

        this.state.celulares.unshift(formData);
        this.guardarDatos();
        this.filtrarYRenderizar();
        this.actualizarEstadisticas();
        this.mostrarNotificacion('Celular registrado exitosamente', 'success');
        document.getElementById('formulario-registro').reset();
    }

    validarDatos(data) {
        if (!data.modelo || !data.imei || !data.almacenamiento) {
            this.mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
            return false;
        }
        if (!/^\d{15}$/.test(data.imei)) {
            this.mostrarNotificacion('El IMEI debe contener exactamente 15 dígitos', 'error');
            return false;
        }
        const imeiExistente = this.state.celulares.some(c => c.imei === data.imei);
        if (imeiExistente) {
            this.mostrarNotificacion('Ya existe un celular registrado con este IMEI', 'error');
            return false;
        }
        return true;
    }

    cambiarVista(vista) {
        this.state.vistaActual = vista;
        document.querySelectorAll('.vista-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.vista === vista);
        });
        this.filtrarYRenderizar();
    }

    imprimirRegistros() {
        const contenido = document.createElement('div');
        contenido.className = 'print-content';
        
        // Encabezado
        contenido.innerHTML = `
            <h1>Registro de Celulares Usados</h1>
            <p>Fecha de impresión: ${new Date().toLocaleDateString()}</p>
            <hr>
        `;

        // Tabla de registros
        const tabla = document.createElement('table');
        tabla.className = 'print-table';
        tabla.innerHTML = `
            <thead>
                <tr>
                    <th>Modelo</th>
                    <th>IMEI</th>
                    <th>Almacenamiento</th>
                    <th>Batería</th>
                    <th>Estado</th>
                    <th>Proveedor</th>
                </tr>
            </thead>
            <tbody>
                ${this.state.celulares.map(celular => `
                    <tr>
                        <td>${celular.modelo} ${celular.variante}</td>
                        <td>${celular.imei}</td>
                        <td>${celular.almacenamiento} GB</td>
                        <td>${celular.bateria3u}% / ${celular.bateriaDevice}%</td>
                        <td>${celular.limpieza}</td>
                        <td>${celular.proveedor}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        contenido.appendChild(tabla);

        // Estilos para impresión
        const estilos = `
            <style>
                @media print {
                    .print-content { padding: 20px; }
                    .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .print-table th, .print-table td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    .print-table th { background-color: #f5f5f5; }
                    @page { size: landscape; }
                }
            </style>
        `;

        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(estilos + contenido.outerHTML);
        ventanaImpresion.document.close();
        ventanaImpresion.print();
    }

    exportarExcel() {
        const data = this.state.celulares.map(celular => ({
            'Modelo': `${celular.modelo} ${celular.variante}`,
            'IMEI': celular.imei,
            'Almacenamiento': `${celular.almacenamiento} GB`,
            'Batería 3uTools': `${celular.bateria3u}%`,
            'Batería Device': `${celular.bateriaDevice}%`,
            'Estado Limpieza': celular.limpieza,
            'Directo a Venta': celular.directoVenta,
            'Proveedor': celular.proveedor,
            'Detalles': celular.detalles,
            'Fecha Registro': new Date(celular.fecha).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Celulares');

        // Ajustar anchos de columna
        const maxWidth = Object.keys(data[0]).reduce((acc, key) => {
            const maxLength = Math.max(
                key.length,
                ...data.map(row => String(row[key]).length)
            );
            acc[key] = { wch: maxLength + 2 };
            return acc;
        }, {});

        worksheet['!cols'] = Object.values(maxWidth);

        // Generar archivo
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `registro_celulares_${fecha}.xlsx`);
        this.mostrarNotificacion('Archivo Excel exportado exitosamente', 'success');
    }

    filtrarYRenderizar() {
        const celularesFiltrados = this.state.celulares.filter(celular => {
            const coincideBusqueda = !this.state.filtros.busqueda || 
                celular.modelo.toLowerCase().includes(this.state.filtros.busqueda.toLowerCase()) ||
                celular.imei.includes(this.state.filtros.busqueda);
            
            const coincideModelo = !this.state.filtros.modelo || 
                celular.modelo.toLowerCase().includes(this.state.filtros.modelo.toLowerCase());
            
            const coincideEstado = !this.state.filtros.estado || 
                this.obtenerEstadoBateria(celular) === this.state.filtros.estado;

            return coincideBusqueda && coincideModelo && coincideEstado;
        });

        this.renderizarRegistros(celularesFiltrados);
    }

    obtenerEstadoBateria(celular) {
        const promedioBateria = (parseInt(celular.bateria3u) + parseInt(celular.bateriaDevice)) / 2;
        if (promedioBateria >= 90) return 'optima';
        if (promedioBateria >= 80) return 'buena';
        if (promedioBateria >= 70) return 'regular';
        return 'baja';
    }

    // Renderizado de registros
    renderizarRegistros(celulares = this.state.celulares) {
        const container = document.getElementById('lista-registros');
        if (!container) {
            console.error('No se encontró el contenedor lista-registros');
            return;
        }

        // Limpiar el contenedor
        container.innerHTML = '';

        // Si no hay registros
        if (celulares.length === 0) {
            container.innerHTML = '<div class="no-registros">No hay registros para mostrar</div>';
            return;
        }

        // Renderizar cada celular
        celulares.forEach(celular => {
            const tarjeta = this.generarTarjetaCelular(celular);
            container.insertAdjacentHTML('beforeend', tarjeta);
        });
    }

    generarTarjetaCelular(celular) {
        const estadoBateria = this.obtenerEstadoBateria(celular);
        return `
            <div class="celular-card">
                <div class="celular-header">
                    <h3>${celular.modelo} ${celular.variante || ''}</h3>
                    <span class="badge badge-${estadoBateria}">${estadoBateria}</span>
                </div>
                <div class="celular-info">
                    <div class="info-item">
                        <span class="label">IMEI:</span>
                        <span class="value">${celular.imei}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Almacenamiento:</span>
                        <span class="value">${celular.almacenamiento} GB</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Batería:</span>
                        <span class="value">${celular.bateria3u}%</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Estado:</span>
                        <span class="value">${celular.directoVenta ? 'Directo a Venta' : 'En Revisión'}</span>
                    </div>
                </div>
                <div class="celular-actions">
                    <button class="action-btn" onclick="window.gestor.editarCelular('${celular.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="window.gestor.eliminarCelular('${celular.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Actualización de estadísticas
    actualizarEstadisticas() {
        // Contadores para el dashboard
        const stats = {
            total: this.state.celulares.length,
            excelente: this.state.celulares.filter(c => c.limpieza === 'Excelente').length,
            optima: this.state.celulares.filter(c => c.bateria === 'Óptima').length,
            ultimoMes: this.state.celulares.filter(c => {
                const unMesAtras = new Date();
                unMesAtras.setMonth(unMesAtras.getMonth() - 1);
                return new Date(c.fecha) > unMesAtras;
            }).length
        };

        // Actualizar contadores en el DOM
        document.getElementById('total-celulares').textContent = stats.total;
        document.getElementById('estado-excelente').textContent = stats.excelente;
        document.getElementById('bateria-optima').textContent = stats.optima;
        document.getElementById('ultimo-mes').textContent = stats.ultimoMes;

        // Actualizar gráficos
        this.actualizarGraficos();
    }

    // Actualización de gráficos
    actualizarGraficos() {
        // Datos para el gráfico de estados
        const estadosData = {
            Excelente: 0,
            'Muy Bueno': 0,
            Bueno: 0,
            Regular: 0
        };

        // Datos para el gráfico de baterías
        const bateriasData = {
            Óptima: 0,
            Buena: 0,
            Regular: 0,
            Baja: 0
        };

        this.state.celulares.forEach(celular => {
            estadosData[celular.limpieza]++;
            bateriasData[celular.bateria]++;
        });

        // Actualizar gráfico de estados
        state.charts.estados.data.datasets[0].data = Object.values(estadosData);
        state.charts.estados.update();

        // Actualizar gráfico de baterías
        state.charts.baterias.data.datasets[0].data = Object.values(bateriasData);
        state.charts.baterias.update();
    }

    // Edición de celular
    editarCelular(id) {
        const celular = this.state.celulares.find(c => c.id === id);
        if (!celular) return;

        // Rellenar formulario con datos del celular
        const form = document.getElementById('formulario-registro');
        Object.keys(celular).forEach(key => {
            const input = form.elements[key];
            if (input) input.value = celular[key];
        });

        // Cambiar el comportamiento del formulario temporalmente
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const celularActualizado = {
                ...celular,
                modelo: formData.get('modelo'),
                imei: formData.get('imei'),
                limpieza: formData.get('limpieza'),
                bateria: formData.get('bateria'),
                almacenamiento: formData.get('almacenamiento'),
                color: formData.get('color'),
                observaciones: formData.get('observaciones')
            };

            const index = this.state.celulares.findIndex(c => c.id === id);
            this.state.celulares[index] = celularActualizado;
            this.guardarDatos();
            this.actualizarEstadisticas();
            this.renderizarRegistros();
            this.mostrarNotificacion('Celular actualizado exitosamente', 'success');
            form.reset();
            form.onsubmit = (e) => {
                e.preventDefault();
                this.registrarCelular();
            };
        };
    }

    // Eliminación de celular
    eliminarCelular(id) {
        if (!confirm('¿Está seguro de eliminar este registro?')) return;

        this.state.celulares = this.state.celulares.filter(c => c.id !== id);
        this.guardarDatos();
        this.actualizarEstadisticas();
        this.renderizarRegistros();
        this.mostrarNotificacion('Celular eliminado exitosamente', 'success');
    }

    // Autocompletado de modelo
    setupModeloAutocompletado() {
        const input = document.getElementById('modelo');
        const sugerencias = document.createElement('div');
        sugerencias.className = 'modelo-suggestions';
        input.parentNode.appendChild(sugerencias);

        const modelos = [
            'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14',
            'Samsung Galaxy S20', 'Samsung Galaxy S21', 'Samsung Galaxy S22',
            'Xiaomi Redmi Note 10', 'Xiaomi Redmi Note 11',
            'Motorola G60', 'Motorola Edge 30'
        ];

        input.addEventListener('input', () => {
            const valor = input.value.toLowerCase();
            if (valor.length < 2) {
                sugerencias.style.display = 'none';
        return;
    }

            const coincidencias = modelos.filter(modelo => 
                modelo.toLowerCase().includes(valor)
            );

            if (coincidencias.length > 0) {
                sugerencias.innerHTML = coincidencias.map(modelo => `
                    <div class="sugerencia-item">${modelo}</div>
                `).join('');
                sugerencias.style.display = 'block';

                sugerencias.querySelectorAll('.sugerencia-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.textContent;
                        sugerencias.style.display = 'none';
                    });
                });
            } else {
                sugerencias.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !sugerencias.contains(e.target)) {
                sugerencias.style.display = 'none';
            }
        });
    }

    // Utilidades
    guardarDatos() {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state.celulares));
    }

    actualizarVistaActiva() {
        document.querySelectorAll('.vista-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.vista === this.state.vistaActual);
        });
        document.getElementById('lista-registros').className = this.state.vistaActual;
    }

    actualizarPaginacion() {
        const paginacionEl = document.getElementById('paginacion');
        if (this.state.paginacion.total <= 1) {
            paginacionEl.style.display = 'none';
        return;
    }

        paginacionEl.style.display = 'flex';
        paginacionEl.innerHTML = `
            <button class="button" ${this.state.paginaActual === 1 ? 'disabled' : ''} 
                    onclick="gestor.cambiarPagina(${this.state.paginaActual - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span>Página ${this.state.paginaActual} de ${this.state.paginacion.total}</span>
            <button class="button" ${this.state.paginaActual === this.state.paginacion.total ? 'disabled' : ''} 
                    onclick="gestor.cambiarPagina(${this.state.paginaActual + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    cambiarPagina(pagina) {
        if (pagina < 1 || pagina > this.state.paginacion.total) return;
        this.state.paginaActual = pagina;
        this.renderizarRegistros();
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="ri-${this.getToastIcon(tipo)}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    getToastIcon(tipo) {
        switch (tipo) {
            case 'success': return 'checkbox-circle-line';
            case 'error': return 'error-warning-line';
            case 'warning': return 'alert-line';
            default: return 'information-line';
        }
    }

    mostrarEstadisticas() {
        document.getElementById('modal-estadisticas').classList.add('active');
    }

    cerrarModal() {
        document.getElementById('modal-estadisticas').classList.remove('active');
    }
}

// Función de utilidad para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para actualizar variantes según el modelo
function actualizarVariantes() {
    const modeloSelect = document.getElementById('Modelo');
    const varianteSelect = document.getElementById('Variante');
    const modelo = modeloSelect.value;

    // Limpiar opciones actuales
    varianteSelect.innerHTML = '<option value="">Seleccionar Variante</option>';

    // Si existe el modelo en la configuración
    if (CONFIG.MODELOS_IPHONE[modelo]) {
        CONFIG.MODELOS_IPHONE[modelo].forEach(variante => {
            const option = document.createElement('option');
            option.value = variante;
            option.textContent = variante;
            varianteSelect.appendChild(option);
        });
    }
}

// Event Listener cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.gestor = new GestorCelulares();
    
    // Inicializar el formulario
    const formulario = document.getElementById('formulario-registro');
    if (formulario) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            window.gestor.registrarCelular();
        });
    }

    // Inicializar selector de modelo
    const modeloSelect = document.getElementById('Modelo');
    if (modeloSelect) {
        modeloSelect.addEventListener('change', actualizarVariantes);
    }
});

// Manejo del tema oscuro/claro
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    );
});
