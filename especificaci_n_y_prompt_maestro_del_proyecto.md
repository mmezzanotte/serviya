# INSTRUCCIÓN MAESTRA PARA AGENTE DE DESARROLLO (TECH LEAD & SENIOR FULLSTACK)

> **UBICACIÓN DEL PROYECTO (Working Directory):**
> `C:\Users\maria\OneDrive\Desktop\AppServicios`
> 
> Todas las carpetas, scripts, configuraciones y módulos deben crearse y ejecutarse dentro de esta ruta.

---

## REGLA DE ORO DE ALINEACIÓN Y COMUNICACIÓN (OBLIGATORIA)
1. **CERO DECISIONES ARBITRARIAS:** No tomes decisiones de negocio por tu cuenta sobre porcentajes de comisión, plazos de garantía, reglas de cancelación o penalizaciones. Si encuentras un punto ciego funcional, **detén el flujo**, plantea las opciones con pros y contras técnicos/económicos, y espera la confirmación explícita del usuario antes de codificar.
2. **DESARROLLO INCREMENTAL Y MODULAR:** No generes archivos con código ficticio ni `// TODO: implementar después`. Cada módulo debe ser funcional, tipado en TypeScript y testeable paso a paso.

---

## 1. VISIÓN DEL PRODUCTO & PROPUESTA DE VALOR

Plataforma móvil diseñada para conectar clientes que necesitan arreglos o instalaciones en el hogar con profesionales matriculados/verificados de oficios (Gasistas, Plomeros, Electricistas, Cerrajeros, Albañiles, Pintores).

Combina dos dinámicas de mercado:
- **Modo Urgencia / On-Demand (Estilo PedidosYa / Uber):** Profesionales con switch `Online / Offline` en tiempo real. Algoritmo de cercanía por GPS para emergencias (pérdida de agua, fuga de gas, cerradura trabada).
- **Reputación, Agenda y Confianza (Estilo UrbanSitter):** Perfiles auditados, credenciales/matrículas visibles, agenda de citas programadas y sistema de valoraciones con tasa de respuesta forzada/amigable.

---

## 2. ARQUITECTURA DE USUARIOS Y ROLES (CUENTA DUAL)

- **Un solo registro / Login unificado:** El usuario ingresa mediante Supabase Auth (Email/Password, Google o Apple).
- **Selector de Modo en Perfil:** Cualquier usuario puede actuar como "Cliente". Dentro de la app, existe un switch para alternar al **"Modo Profesional"**.
- **Onboarding de Profesional:** Para desbloquear el Modo Profesional, el usuario debe completar su ficha técnica:
  - Carga de DNI (frente y dorso).
  - Número de matrícula o certificado de idoneidad (para gasistas, electricistas, etc.).
  - Definición de tarifa de visita base ($).
  - Definición de catálogo de servicios.
  *(El perfil queda en estado `pending_approval` hasta ser verificado).*

---

## 3. MODELO DE NEGOCIO Y COBRO (HÍBRIDO Y DEDUCIBLE)

La app maneja dos modalidades comerciales:

### Modalidad A: Servicio de Precio Fijo
- Tareas predecibles y estandarizadas (ej. cambio de cerradura simple, limpieza de calefactor).
- El cliente contrata directamente con precio final conocido de antemano.

### Modalidad B: Visita de Diagnóstico con Costo Deducible
- Para averías no diagnosticadas previamente (ej. caño roto en pared, olor a gas difuso, cortocircuito).
- **Fase 1 (Traslado garantizado):** El cliente abona o compromete la "Tarifa de Visita" fijada por el técnico.
- **Fase 2 (Presupuesto in situ):** El profesional revisa el problema y emite desde su app el presupuesto total de mano de obra y repuestos.
- **Fase 3 (Regla de Compensación):**
  - **Si el cliente ACEPTA:** La app descuenta automáticamente el valor de la visita del total del trabajo:
    $$\text{Total a Pagar} = \text{Presupuesto Total} - \text{Tarifa de Visita}$$
  - **Si el cliente RECHAZA:** El cliente abona únicamente la tarifa de visita por el traslado y peritaje del profesional.

### Medios de Pago y Cobro de Comisión
- **Pasarela:** Mercado Pago SDK (preferencia de pago, checkout integrado o split).
- **Efectivo (Cash):** Si el cliente elige efectivo, el profesional cobra en mano y la app registra una comisión (ej. 12%) en su billetera virtual (`wallet_balance`). Si la deuda supera un límite prefijado, el switch `Online` se bloquea automáticamente hasta saldar con tarjeta.

---

## 4. DISEÑO UX/UI SELECCIONADO: "DAILY ASSIST - ÁGIL Y DIRECTO"

- **Estilo visual:** Limpio, moderno, sin ilustraciones genéricas de IA ni personajes de fantasía. Uso de iconos sólidos, bordes redondeados y tipografía altamente legible.
- **Paleta de Colores:**
  - Azul Eléctrico Cercano (`#1D4ED8` o `#2563EB`): Acción y confianza.
  - Coral / Naranja Acción (`#FF5A36`): Botones de urgencia y contratación inmediata.
  - Verde Esmeralda (`#10B981`): Switch e indicador de estado `🟢 ONLINE`.
  - Fondo: Blanco puro (`#FFFFFF`) y Gris neutro claro (`#F8FAFC`).
- **Tarjeta de Profesional en Home/Búsqueda:**
  - Foto de perfil real, nítida y circular.
  - Nombre y oficio: "Roberto D. • Cerrajero 24hs".
  - Estado: `🟢 ONLINE (a 8 min)`.
  - Calificación destacada: `⭐ 4.9 (84 opiniones) • 🛡️ Matrícula Verificada`.
  - Cita o reseña corta de un vecino en tipografía cursiva/suave.
  - Tarifa de visita visible y botón prominente: `[ ⚡ PEDIR VISITA AHORA ]`.
- **Modal de Calificación Post-Servicio (Casi Obligatorio):**
  - Se activa automáticamente al finalizar el servicio.
  - Formato Bottom Sheet invasivo: **SIN botón 'X' de cierre fácil**, solo un enlace secundario y tenue al pie ("Calificar más tarde").
  - Flujo en 4 pasos rápidos con un toque:
    1. Calificación de 1 a 5 estrellas.
    2. ¿Fue puntual?: `[ 👍 Sí, puntual ]` / `[ ⏳ Con demora ]`.
    3. ¿Respetó el precio acordado?: `[ ✅ Sí, exacto ]` / `[ ⚠️ Cobró de más ]`.
    4. Qué destacás: Chips `[ 🧼 Limpio ]`, `[ 💬 Buena onda ]`, `[ 💡 Muy claro ]`, `[ ⚡ Rápido ]`.
    5. Comentario opcional y botón `[ ENVIAR CALIFICACIÓN ]`.

---

## 5. STACK TECNOLÓGICO Y HERRAMIENTAS

- **Ruta de instalación:** `C:\Users\maria\OneDrive\Desktop\AppServicios`
- **Framework Mobile:** React Native con **Expo (Managed Workflow)** y TypeScript.
- **Enrutamiento:** `expo-router` (File-based routing).
- **Estilos:** NativeWind (Tailwind CSS para React Native) o StyleSheet estructurado.
- **Backend & Base de Datos:** **Supabase** (PostgreSQL, Auth, Realtime para presencia Online/Offline, PostGIS para geocálculo de cercanía, y Supabase Storage para fotos de perfiles y credenciales).
- **Iconografía:** `@expo/vector-icons` (Lucide Icons / Feather).
- **Pagos:** Mercado Pago API / SDK.
- **Geolocalización:** `expo-location` y mapas nativos.

---

## 6. ESQUEMA DE BASE DE DATOS (POSTGRESQL / SUPABASE)

El agente debe inicializar o proveer las migraciones SQL para las siguientes tablas principales:

1. `profiles`:
   - `id` (UUID, PK, referencia a `auth.users`)
   - `full_name` (text), `phone` (text), `avatar_url` (text), `address` (text)
   - `current_role` (text: 'client' | 'professional')
   - `created_at` (timestamptz)

2. `professional_profiles`:
   - `id` (UUID, PK, referencia a `profiles.id`)
   - `category` (text: 'gasista' | 'plomero' | 'electricista' | 'cerrajero' | 'albanil' | 'pintor')
   - `license_number` (text), `license_doc_url` (text)
   - `is_verified` (boolean, default false)
   - `is_online` (boolean, default false)
   - `last_location` (geography(Point, 4326))
   - `base_visit_price` (numeric)
   - `wallet_balance` (numeric, default 0)
   - `average_rating` (numeric, default 5.0)
   - `total_reviews` (int, default 0)

3. `services_catalog`:
   - `id` (UUID, PK)
   - `professional_id` (UUID, FK a `professional_profiles`)
   - `title` (text)
   - `description` (text)
   - `price_type` (text: 'fixed' | 'diagnostic_deductible')
   - `price` (numeric)

4. `bookings`:
   - `id` (UUID, PK)
   - `client_id` (UUID, FK a `profiles`)
   - `professional_id` (UUID, FK a `professional_profiles`)
   - `service_id` (UUID, FK a `services_catalog`, nullable)
   - `booking_type` (text: 'urgent' | 'scheduled')
   - `status` (text: 'pending' | 'accepted' | 'in_route' | 'in_progress' | 'quote_pending' | 'completed' | 'cancelled')
   - `destination_lat` (numeric), `destination_lng` (numeric), `destination_address` (text)
   - `visit_fee` (numeric)
   - `final_quote_amount` (numeric, nullable)
   - `total_paid` (numeric, nullable)
   - `payment_method` (text: 'mercadopago' | 'cash')
   - `payment_status` (text: 'pending' | 'authorized' | 'paid' | 'failed')
   - `created_at`, `updated_at` (timestamptz)

5. `reviews`:
   - `id` (UUID, PK)
   - `booking_id` (UUID, FK a `bookings`)
   - `client_id` (UUID, FK a `profiles`)
   - `professional_id` (UUID, FK a `professional_profiles`)
   - `rating` (int, 1 a 5)
   - `is_punctual` (boolean)
   - `agreed_price_respected` (boolean)
   - `highlight_tags` (text[])
   - `comment` (text, nullable)
   - `created_at` (timestamptz)

---

## 7. PLAN DE ACCIÓN Y EJECUCIÓN (PASO A PASO)

El agente debe proceder en el siguiente orden estricto dentro de `C:\Users\maria\OneDrive\Desktop\AppServicios`:

1. **FASE 1: Setup del Entorno & Proyecto**
   - Inicializar el proyecto con `npx create-expo-app@latest . --template blank-typescript`.
   - Instalar dependencias esenciales: `expo-router`, `nativewind`, `tailwindcss`, `@supabase/supabase-js`, `expo-location`, `lucide-react-native`, `react-native-safe-area-context`, `react-native-screens`.
   - Configurar `tailwind.config.js`, `babel.config.js` y variables de entorno (`.env.example`).

2. **FASE 2: Estructura de Directorios y Clientes de Servicio**
   - Crear carpetas:
     - `/app` (Rutas de navegación de Expo Router: `(auth)`, `(client)`, `(pro)`, `modal`)
     - `/components` (Componentes atómicos: `ProfessionalCard`, `OnlineToggle`, `RatingSheet`, `Button`, `Badge`)
     - `/lib` (Cliente de `supabase.ts`, utilitarios de geocálculo y formato de moneda)
     - `/types` (Modelos e interfaces TypeScript exhaustivas)

3. **FASE 3: Implementación de UI y Flujos Críticos**
   - Pantalla Home Cliente: Switch Urgencia vs. Programar, listado con tarjetas ricas (Daily Assist style).
   - Pantalla Switch Modo Pro & Toggle Online/Offline en tiempo real.
   - Flujo de Cotización in situ con deducción de visita.
   - Componente Bottom Sheet de Calificación post-servicio.

4. **FASE 4: Verificación y Preguntas Pendientes**
   - Correr verificación de compilación (`npx expo start`).
   - Consultar al usuario sobre los parámetros específicos de comisiones y límites de billetera antes de conectar la pasarela de pago real.