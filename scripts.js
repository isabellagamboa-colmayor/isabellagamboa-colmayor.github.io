// =============================
// MAPA INICIAL
// =============================
var map = L.map('map').setView([5.5990, -75.8190], 16);

// =============================
// MAPAS BASE
// =============================
var baseLayers = {
    imagery: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri' }
    ),
    dark: L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }
    )
};

baseLayers.imagery.addTo(map);

// =============================
// CONFIGURACIÓN DE CAPAS
// =============================
var capasConfig = [
    { key: 'Limite Municipal', nombre: 'Limite Municipal', url: 'data/Limite_Urbano_Jardin.json' },
    { key: 'Manzanas', nombre: 'Manzanas', url: 'data/Manzanas_Jardin.json' },
    { key: 'Predios', nombre: 'Predios', url: 'data/Predios_Jardin.json' },

    { key: 'Drenaje', nombre: 'Drenaje', url: 'data/Drenaje_Jardin.json' },
    { key: 'Curva de Nivel', nombre: 'Curvas de Nivel', url: 'data/Curvas_Nivel.json' },
    { key: 'Limites Viales', nombre: 'Limites Viales', url: 'data/Limites_Viales.json' },

    { key: 'Predios Afectados Retiro', nombre: 'Predios Afectados Retiro', url: 'data/Predios_Afectados_Retiros.json' },
    { key: 'Retiros', nombre: 'Retiros', url: 'data/Retiros_Urbanos_Hidrografia.json' }
];

var capasGeoJSON = {};
var capasLeaflet = {};

var grupoCapasGeograficas = L.layerGroup().addTo(map);

// =============================
// ESTILOS
// =============================
function estiloCapas(key) {
    switch (key) {

        case 'Limite Municipal':
            return { color: 'black', weight: 2, fillOpacity: 0 };

        case 'Predios':
            return { color: 'black', weight: 1, fillColor: '#BFBFBF', fillOpacity: 0.6 };

        case 'Manzanas':
            return { color: 'black', weight: 1, fillColor: '#2ECC71', fillOpacity: 0.5 };

        case 'Curva de Nivel':
            return { color: '#8B4513', weight: 1 };

        case 'Limites Viales':
            return { color: '#FF0000', weight: 2 };

        case 'Drenaje':
            return { color: '#00008B', weight: 2 };

        case 'Predios Afectados Retiro':
            return { color: '#FF00FF', weight: 2, fillOpacity: 0.3 }; // morado

        case 'Retiros':
            return { color: '#00FFFF', weight: 2, fillOpacity: 0.2 }; // celeste

        default:
            return { color: '#555', weight: 1, fillOpacity: 0.3 };
    }
}

// =============================
// POPUP
// =============================
function popupDesdeAtributos(feature) {
    if (!feature.properties) return 'Sin atributos';

    var html = '';
    for (var campo in feature.properties) {
        html += '<b>' + campo + ':</b> ' + feature.properties[campo] + '<br>';
    }
    return html;
}

// =============================
// CARGAR CAPA
// =============================
function cargarCapa(config) {
    fetch(config.url)
        .then(r => r.json())
        .then(data => {

            capasGeoJSON[config.key] = data;

            var layer = L.geoJSON(data, {
                style: estiloCapas(config.key),
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(popupDesdeAtributos(feature));
                }
            });

            capasLeaflet[config.key] = layer;
            grupoCapasGeograficas.addLayer(layer);

            actualizarTreeControl();
        })
        .catch(err => console.error('Error cargando:', config.url, err));
}

// =============================
// SELECTOR
// =============================
function poblarSelectorCapas() {
    var selector = document.getElementById('selectorCapa');
    selector.innerHTML = '';

    capasConfig.forEach(capa => {
        var opt = document.createElement('option');
        opt.value = capa.key;
        opt.textContent = capa.nombre;
        selector.appendChild(opt);
    });
}

function obtenerCapaSeleccionada() {
    var key = document.getElementById('selectorCapa').value;
    if (!capasGeoJSON[key]) return null;

    return {
        key: key,
        data: capasGeoJSON[key],
        titulo: key
    };
}

// =============================
// TREE CONTROL (🔥 CORREGIDO)
// =============================
var treeControl = null;

function actualizarTreeControl() {

    if (treeControl) treeControl.remove();

    var baseTree = {
        label: '<b>Mapa base</b>',
        children: [
            { label: 'Imagery', layer: baseLayers.imagery },
            { label: 'Dark', layer: baseLayers.dark }
        ]
    };

    var overlaysTree = {
        label: '<b>Capas geográficas</b>',
        children: [

            {
                label: '<b>Capas Catastrales</b>',
                children: [
                    'Predios',
                    'Manzanas',
                    'Limite Municipal',
                    'Predios Afectados Retiro'
                ]
                .filter(k => capasLeaflet[k])
                .map(k => ({ label: k, layer: capasLeaflet[k] }))
            },

            {
                label: '<b>Cartografía Básica</b>',
                children: [
                    'Curva de Nivel',
                    'Limites Viales',
                    'Drenaje',
                    'Retiros'
                ]
                .filter(k => capasLeaflet[k])
                .map(k => ({ label: k, layer: capasLeaflet[k] }))
            }
        ]
    };

    treeControl = L.control.layers.tree(baseTree, overlaysTree, {
        collapsed: false
    }).addTo(map);
}

// =============================
// ACTIVACIÓN
// =============================
poblarSelectorCapas();
capasConfig.forEach(cargarCapa);