// Sistema de persistencia de datos global
const Storage = {
    // Guardar datos en localStorage
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error al guardar datos:', error);
            return false;
        }
    },

    // Obtener datos de localStorage
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error al obtener datos:', error);
            return defaultValue;
        }
    }, 

    // Eliminar datos de localStorage
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error al eliminar datos:', error);
            return false;
        }
    },

    // Limpiar todos los datos de localStorage
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }
};

// Sistema de gestión de temas
const ThemeManager = {
    // Obtener tema actual
    getCurrentTheme: function() {
        return localStorage.getItem('theme') || 'light';
    },

    // Establecer tema
    setTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeButton(theme);
    },

    // Alternar tema
    toggleTheme: function() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    // Actualizar texto del botón de tema
    updateThemeButton: function(theme) {
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.innerHTML = theme === 'light' ? 
                '<i class="ri-moon-line"></i>' : 
                '<i class="ri-sun-line"></i>';
        }
    },

    // Inicializar tema según preferencias guardadas
    initializeTheme: function() {
        const savedTheme = this.getCurrentTheme();
        this.setTheme(savedTheme);

        // Escuchar cambios en las preferencias del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
};

// Sistema de navegación
const Navigation = {
    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    },

    // Restaurar estado del sidebar
    restoreSidebarState: function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            this.toggleSidebar();
        }
    }
};

// Sistema de notificaciones (Toast)
const Toast = {
    show: function(type, message, duration = 3000) {
        const container = document.getElementById('toast-container') || this.createContainer();
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="cerrarToast(this)">✖</button>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('slideOut');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    createContainer: function() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
};

// Función global para cerrar toast
function cerrarToast(button) {
    const toast = button.closest('.toast');
    toast.classList.add('slideOut');
    setTimeout(() => toast.remove(), 300);
}

// Función global para mostrar toast
function MostrarToast(type, message) {
    Toast.show(type, message);
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.initializeTheme();
    Navigation.restoreSidebarState();
});

// Exportar funciones globales para uso en HTML
window.toggleTheme = () => ThemeManager.toggleTheme();
window.toggleSidebar = () => Navigation.toggleSidebar();
window.showToast = (type, message) => Toast.show(type, message);

// Funciones de tema
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton();
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function updateThemeButton() {
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
        const currentTheme = getCurrentTheme();
        themeButton.innerHTML = currentTheme === 'light' ? 
            '<i class="ri-moon-line"></i>' : 
            '<i class="ri-sun-line"></i>';
    }
}

// Funciones de sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Sistema de notificaciones
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="ri-${getToastIcon(type)}"></i>
            <span>${message}</span>
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

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'checkbox-circle-line';
        case 'error': return 'error-warning-line';
        case 'warning': return 'alert-line';
        default: return 'information-line';
    }
}

// Funciones de validación comunes
function validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
        showToast('error', `El campo ${fieldName} es requerido`);
        return false;
    }
    return true;
}

function validateNumber(value, fieldName, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        showToast('error', `${fieldName} debe ser un número válido`);
        return false;
    }
    if (min !== null && num < min) {
        showToast('error', `${fieldName} debe ser mayor o igual a ${min}`);
        return false;
    }
    if (max !== null && num > max) {
        showToast('error', `${fieldName} debe ser menor o igual a ${max}`);
        return false;
    }
    return true;
}

// Funciones de formato comunes
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Funciones de exportación comunes
function exportToExcel(data, filename, headers) {
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Ajustar anchos de columna
    const maxWidth = headers.reduce((acc, header) => {
        const maxLength = Math.max(
            header.length,
            ...data.map(row => String(row[header]).length)
        );
        acc[header] = { wch: maxLength + 2 };
        return acc;
    }, {});

    worksheet['!cols'] = Object.values(maxWidth);

    XLSX.writeFile(workbook, `${filename}_${formatDateForFilename(new Date())}.xlsx`);
    showToast('success', 'Archivo Excel exportado exitosamente');
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

// Funciones de modal común
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button onclick="this.closest('.modal').remove()" class="button">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Inicialización común
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    const savedTheme = getCurrentTheme();
    setTheme(savedTheme);
    
    // Inicializar listeners
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
});
