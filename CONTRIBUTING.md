# Cómo contribuir a La Aventura de Nelson

¡Gracias por tu interés! Este es un proyecto educativo pequeño y sencillo. Estas son las pautas
para proponer cambios.

## Cómo proponer cambios

1. Haz un *fork* del repositorio (<https://github.com/rolansor/aventura_escolar>).
2. Crea una rama descriptiva a partir de `main` (por ejemplo `feature/nueva-regla-ortografia`).
3. Haz tus cambios y pruébalos en el navegador (ver "Probar" abajo).
4. Abre un *Pull Request* hacia `main` explicando qué cambia y por qué.

Para reportar errores o sugerir ideas, abre un *issue* describiendo el problema o la propuesta,
con pasos para reproducirlo si aplica.

## Estilo de código

- **Todo en español**: nombres de variables y funciones, comentarios y textos de la interfaz.
  Mantén tildes y la ñ.
- **Sin dependencias**: no introduzcas frameworks, bundlers ni paquetes de npm. La única
  dependencia externa permitida es **three.js** (por CDN).
- **Módulos IIFE**: cada archivo expone un objeto global (`window.X`); no se usan imports/exports
  de ES modules.
- **Vocabulario adecuado**: contenido apropiado para ~9 años y en español de Ecuador.
- Sigue el estilo y la organización del código existente; consulta `CLAUDE.md` para entender la
  arquitectura.

## Compatibilidad y pruebas

- **Mantén la compatibilidad con doble clic (`file://`)**: nada de `fetch` a archivos locales que
  rompa la versión empaquetada de `dist/`. El contenido que necesite cargarse en `file://` debe
  embeberse como hace el build.
- Prueba en **Chrome, Edge o Firefox**.
- No hay Node, ni linters, ni tests automáticos: **valida a ojo** en el navegador.
- Tras editar JS/CSS, recarga con **Ctrl + Shift + R** (recarga forzada).

## Lo que conviene evitar

- No subas archivos generados (la carpeta `dist/` se regenera con el build).
- No incluyas recursos de terceros sin respetar su licencia (ver "Créditos" en el README).

¡Gracias por ayudar a que Nelson aprenda jugando! 🌙
