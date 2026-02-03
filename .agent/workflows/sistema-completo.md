---
description: "Flujo completo de la Factoría: desde el refinamiento de la orden hasta la entrega profesional y marketing."
---

# 🏭 Workflow: Sistema Completo (End-to-End)

Este workflow garantiza que cada feature no solo se programe bien, sino que sea útil para el cliente y lista para redes sociales.

## Fase 0: Interrogación (Antes de Programar)
1.  **Analizar la orden** del humano.
2.  Ejecutar la skill `prompt-refiner`.
3.  **Preguntar**: Presentar al humano el PRP y las 3-5 dudas críticas.
4.  **Confirmación**: No avanzar hasta que la orden técnica sea perfecta.

## Fase 1: Construcción (Blueprint)
1.  Seguir el `bucle-agentico-blueprint.md`.
2.  Implementar la feature usando el **Golden Path**.
3.  Validar con **Playwright** (Visual) y **Next.js MCP** (Runtime).

## Fase 2: Marketing Factory (Post-Construcción)
1.  Ejecutar la skill `social-content`.
2.  Generar:
    - Guion para Reel/Story (HVS structure).
    - Copia para post de Instagram/LinkedIn.
    - Ideas de carrusel basadas en el valor técnico.

## Fase 3: Entrega Profesional (Pack Cliente)
1.  Ejecutar la skill `client-delivery`.
2.  Organizar la carpeta `/delivery` (o un documento final resumido):
    - `EXPLICACION_SISTEMA.md` (ROI + Workflow).
    - `llms.txt` (Para que otras IAs del cliente sigan trabajando).
    - Guion de explicación en video.

## Fase 4: Auto-Blindaje
1.  Documentar cualquier error en `GEMINI.md` o en el aprendizaje del PRP.

---

*"Construimos la máquina que construye el marketing."*
