# 🎨 Generar Iconos para la Extensión

## ⚠️ IMPORTANTE: Los iconos son necesarios para publicar en Chrome Web Store

Sin iconos, la extensión mostrará el icono de rompecabezas genérico (muy poco profesional).

## 🚀 Opción 1: Usar el Generador HTML (Recomendado)

1. Abre el archivo `generate-icons.html` en tu navegador
2. Haz clic en "📦 Descargar Todos"
3. Mueve los 3 archivos descargados a la carpeta `src/icons/`
4. Recarga la extensión en Chrome

**✅ Ventaja:** No requiere instalación de nada, funciona en cualquier navegador.

## 🐍 Opción 2: Usar el Script Python

```bash
# Instalar Pillow
pip install pillow

# Ejecutar el script
python3 generate-icons.py
```

Los iconos se generarán automáticamente en `src/icons/`.

## 🎨 Opción 3: Crear Iconos Personalizados

Si prefieres diseñar tus propios iconos:

1. Crea 3 archivos PNG:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)  
   - `icon128.png` (128x128 pixels)

2. Guárdalos en `src/icons/`

3. Usa herramientas como:
   - Figma (gratis)
   - Canva (gratis)
   - Adobe Illustrator
   - GIMP (gratis)

**Recomendaciones de diseño:**
- Usa el color azul de la extensión (#2563eb)
- Icono simple y reconocible (el generador usa un cohete 🚀)
- Fondo sólido o transparente
- Debe verse bien en tamaños pequeños

## 📋 Verificación

Después de generar los iconos:

1. Ve a `chrome://extensions`
2. Recarga la extensión
3. Deberías ver tu icono personalizado en lugar del rompecabezas
4. El icono también aparecerá en la barra de herramientas

## ✅ Estado Actual

El `manifest.json` ya está configurado con las rutas correctas:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

**Solo falta generar los archivos PNG.**

## 🎯 Siguiente Paso

**Ejecuta una de las 3 opciones de arriba para generar los iconos.**

La opción más rápida es abrir `generate-icons.html` en tu navegador.
