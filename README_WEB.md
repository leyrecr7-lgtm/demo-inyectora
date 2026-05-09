# Web del sensor acústico

Esta carpeta contiene la página web pensada para enlazar desde el QR del póster.

## Archivos principales

- `index.html`: página principal.
- `demo.html`: demo de reproducción de audios.
- `resultados.html`: visualizaciones de resultados.
- `multimedia.html`: vídeo e imagen de la inyectora.

## Estructura de assets

- `assets/css/styles.css`: estilos visuales y animaciones.
- `assets/js/app.js`: interacción de la página.
- `assets/audio/`: audios de prueba de la demo.
- `assets/media/`: imagen y vídeo de la máquina.
- `assets/img/`: gráficas, espectrograma y visualizaciones SVG.

## Demo sincronizada

La demo usa segmentos de fase precalculados en `assets/js/app.js` para mostrar una
versión temprana del funcionamiento en continuo. No ejecuta MATLAB desde el navegador
y no modifica ningún script `.m` del proyecto.

## Nota

Para probar la web en local, abre `index.html` en el navegador.
Para subirla a GitHub Pages, sube esta carpeta manteniendo la misma estructura.
