---
name: client-delivery
version: 1.0.0
description: "Establece el estándar de oro para la entrega de sistemas a clientes. Organiza documentos, explicaciones, videos y guías de uso."
---

# Client Delivery (El Arte de la Entrega)

La "entrega" no es un mensaje de "Ya está listo". Es un paquete profesional que garantiza que el cliente entienda y valore lo que ha comprado.

## 📂 Estructura de la Carpeta de Entrega

Al terminar un sistema, crea o sugiere una carpeta `/delivery` con:

1.  **`README.md` (Premium)**: Resumen ejecutivo, cómo empezar rápido y soporte.
2.  **`EXPLICACION_SISTEMA.md`**: El "mapa" del sistema.
3.  **`VIDEOS/`**: Guiones o links a videos de Loom/Remotion explicando el flujo.
4.  **`llms.txt`**: Documentación para que otras IAs entiendan el código (AI-friendly).
5.  **`MARKETING/`**: El pack de redes sociales (Reels, Instagram, LinkedIn).

## 🗺️ Mapa del Sistema (Explicación)

La explicación debe seguir 3 niveles:

### Nivel 1: Para el Dueño (ROI)
- ¿Qué problema resuelve?
- ¿Cuánto tiempo/dinero ahorra?
- ¿Cuál es la "Ventaja Injusta" que da este sistema?

### Nivel 2: Para el Usuario (Workflow)
- Paso 1: Entra aquí.
- Paso 2: El sistema hace X.
- Paso 3: Recibes el resultado en Y.

### Nivel 3: Para el Desarrollador (Técnico)
- Tecnologías usadas.
- Tablas de BD.
- Endpoints o webhooks críticos.

## 📹 Guiones de Video (The "Show & Tell")

Si el cliente lo requiere, genera el guion para un video de 2 minutos:
- **00:00 - 00:15**: El dolor actual del cliente.
- **00:15 - 01:30**: Demo en vivo (screen recording) del sistema funcionando.
- **01:30 - 02:00**: Resumen de beneficios y cierre.

## 🤖 AI-Friendly Delivery (llms.txt)

Genera siempre un archivo `llms.txt` en la raíz del proyecto o en `/delivery`:
- Incluye el resumen del proyecto.
- Lista funciones críticas.
- Explica la arquitectura brevemente.

---

## 🏁 Meta-Instrucción
Al terminar cualquier Blueprint complejo, el agente DEBE preguntar: *"¿Quieres que genere el Pack de Entrega Profesional (/delivery) con la documentación y el material de marketing?"*
