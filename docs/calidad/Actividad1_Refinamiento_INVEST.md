# Taller 5 – Actividad 1: Refinamiento de historias de usuario con IA (método INVEST)

**Proyecto:** eco-TRACE – Plataforma de puntos ecológicos de Ciudad Bolívar (Bogotá)
**Herramienta de IA utilizada:** Claude (Anthropic)
**Fuente de las historias:** `eco-TRACE_Historias_Usuario_Tier1.xlsx` y `eco-TRACE_Backlog_Priorizado_Final.xlsx` (23 historias, HU-01 a HU-23, 70 puntos)

---

## 1. Prompt utilizado

> Eres un Product Owner Sénior y experto en Metodologías Ágiles especializado en la validación y refinamiento de Historias de Usuario (HU). Tu objetivo es evaluar las Historias de Usuario que te presente el usuario utilizando el marco INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) y proporcionar retroalimentación constructiva y accionable.
>
> Sigue estrictamente estas instrucciones en tu análisis:
>
> 1. ANÁLISIS INVEST: Evalúa la Historia de Usuario según los 6 criterios:
> - I (Independent): ¿Puede desarrollarse y entregarse sin depender fuertemente de otras historias?
> - N (Negotiable): ¿Expresa qué se necesita sin imponer una solución técnica cerrada, dejando espacio para la discusión?
> - V (Valuable): ¿Tiene la estructura "Como [rol], quiero [acción] para [beneficio]"? ¿El valor para el usuario o negocio es claro?
> - E (Estimable): ¿Está suficientemente clara para que el equipo de desarrollo entienda el alcance y pueda estimar su esfuerzo?
> - S (Small): ¿Es lo suficientemente pequeña para completarse dentro de un solo Sprint? Si parece un Épica, indícalo.
> - T (Testable): ¿Cuenta con Criterios de Aceptación claros y verificables (idealmente en formato Given-When-Then / Dado-Cuando-Entonces)?
>
> 2. ESTRUCTURA DE TU RESPUESTA: Organiza siempre tu respuesta utilizando la siguiente estructura en Markdown:
>
> ### 📊 Diagnóstico General: [Aprobada / Requiere Ajustes / Rechazada]
> **Puntuación INVEST:** [X]/6 criterios cumplidos.
>
> ### 🔍 Evaluación por Criterio
> - **Independiente (I):** [✅ Cumple / ⚠️ Advertencia / ❌ No cumple] + [Breve explicación]
> - **Negociable (N):** [✅ / ⚠️ / ❌] + [Breve explicación]
> - **Valiosa (V):** [✅ / ⚠️ / ❌] + [Breve explicación]
> - **Estimable (E):** [✅ / ⚠️ / ❌] + [Breve explicación]
> - **Pequeña (S):** [✅ / ⚠️ / ❌] + [Breve explicación]
> - **Testeable (T):** [✅ / ⚠️ / ❌] + [Breve explicación]
>
> ### 💡 Puntos de Mejora Accionables
> - Listado puntual de lo que falta o debe corregirse.
>
> ### 🛠️ Propuesta de Historia Mejorada
> Reescribe la historia corrigiendo todas las fallas detectadas, incluyendo:
> - **Título sugerido**
> - **Estructura:** Como [rol]... Quiero [acción]... Para [beneficio]...
> - **Criterios de Aceptación (Dado - Cuando - Entonces)**
>
>
> Mantén un tono profesional, claro, directo y de apoyo técnico. Si la información proporcionada en la HU es insuficiente para evaluar algún punto, asume el peor escenario y pide aclaración.

---

## 2. Respuestas de la IA por historia

### HU-01 – Registro de usuario
**Historia presentada:** "Registro de usuario" (Alta, 3 pts). Sin enunciado ni criterios.

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 4/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple. Es la base del sistema; no depende de otras historias.
- **Negociable (N):** ✅ Cumple. No impone tecnología.
- **Valiosa (V):** ⚠️ Advertencia. El valor es intuitivo, pero no tiene la estructura Como/Quiero/Para.
- **Estimable (E):** ✅ Cumple. El alcance de un registro es conocido y fue estimado en 3 pts.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. No hay criterios de aceptación (¿qué datos se piden? ¿qué pasa con un correo repetido?).
#### 💡 Puntos de Mejora Accionables
- Redactar el enunciado con rol, acción y beneficio.
- Definir los campos obligatorios y las reglas de validación (formato de correo, longitud de contraseña).
- Agregar escenarios de error: correo ya registrado, datos inválidos.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Registro de ciudadano en eco-TRACE
- **Estructura:** Como ciudadano de Ciudad Bolívar, quiero crear una cuenta con mi nombre, correo y contraseña, para poder proponer puntos ecológicos y registrar mis entregas.
- **Criterios de Aceptación:**
  1. **Dado** que estoy en la página de registro, **cuando** ingreso nombre, correo válido y una contraseña de al menos 8 caracteres y presiono "Registrarme", **entonces** el sistema crea mi cuenta con rol usuario y me redirige al inicio de sesión.
  2. **Dado** que el correo ya existe, **cuando** intento registrarme, **entonces** el sistema muestra "El correo ya está registrado" y no crea la cuenta.
  3. **Dado** que dejo un campo obligatorio vacío o el correo tiene formato inválido, **cuando** envío el formulario, **entonces** el sistema señala el campo con error y no envía la solicitud.

---

### HU-02 – Inicio de sesión
**Historia presentada:** "Inicio de sesión" (Alta, 2 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-01 (debe existir la cuenta), dependencia natural y aceptable.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. Falta el beneficio explícito.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. Sin criterios de aceptación.

#### 💡 Puntos de Mejora Accionables
- Indicar qué pasa con credenciales incorrectas y cuánto dura la sesión.
- Diferenciar el destino del usuario y del administrador.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Inicio de sesión con correo y contraseña
- **Estructura:** Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder a las funciones que requieren identificación (proponer puntos, registrar entregas, reseñar).
- **Criterios de Aceptación:**
  1. **Dado** que tengo una cuenta, **cuando** ingreso correo y contraseña correctos, **entonces** el sistema me autentica, guarda mi sesión y me muestra el menú según mi rol.
  2. **Dado** que ingreso una contraseña incorrecta o un correo no registrado, **cuando** presiono "Ingresar", **entonces** el sistema muestra "Correo o contraseña incorrectos" sin indicar cuál falló.
  3. **Dado** que soy administrador, **cuando** inicio sesión, **entonces** el menú muestra el acceso al panel de administración.

---

### HU-03 – Cierre de sesión
**Historia presentada:** "Cierre de sesión" (Media, 1 pt).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-02.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. El beneficio (seguridad en equipos compartidos) no está escrito.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Explicitar el beneficio de seguridad.
- Definir qué ocurre al intentar entrar a rutas protegidas después de cerrar sesión.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Cerrar sesión de forma segura
- **Estructura:** Como usuario autenticado, quiero cerrar mi sesión, para que nadie más use mi cuenta en un equipo compartido.
- **Criterios de Aceptación:**
  1. **Dado** que tengo sesión iniciada, **cuando** presiono "Cerrar sesión", **entonces** el sistema elimina el token guardado y me lleva a la página de inicio.
  2. **Dado** que cerré sesión, **cuando** intento abrir una ruta protegida (por ejemplo, Mi perfil), **entonces** el sistema me redirige al inicio de sesión.

---

### HU-04 – Recuperación de contraseña
**Historia presentada:** "Recuperación de contraseña" (Media, 2 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-01 y de un servicio de correo.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. Falta la estructura.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. No define el mecanismo (código, enlace), su vigencia ni los errores.

#### 💡 Puntos de Mejora Accionables
- Definir el mecanismo de recuperación y su tiempo de expiración.
- Agregar escenarios de código inválido o vencido.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Recuperar contraseña con código enviado al correo
- **Estructura:** Como usuario que olvidó su contraseña, quiero recibir un código en mi correo para crear una nueva, para recuperar el acceso a mi cuenta sin ayuda del administrador.
- **Criterios de Aceptación:**
  1. **Dado** que mi correo está registrado, **cuando** lo ingreso en "Recuperar contraseña", **entonces** el sistema me envía un código de verificación con vigencia limitada.
  2. **Dado** que tengo un código válido, **cuando** lo ingreso junto con una nueva contraseña, **entonces** el sistema actualiza mi contraseña y puedo iniciar sesión con ella.
  3. **Dado** que el código es incorrecto o ya venció, **cuando** intento usarlo, **entonces** el sistema muestra un error y no cambia la contraseña.

---

### HU-05 – Gestión de perfil
**Historia presentada:** "Gestión de perfil" (Baja, 3 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 2/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-02.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. "Gestión" no dice qué valor obtiene el usuario.
- **Estimable (E):** ❌ No cumple. "Gestionar" es ambiguo: ¿ver, editar, cambiar contraseña, eliminar cuenta?
- **Pequeña (S):** ✅ Cumple si se limita a ver y editar datos básicos.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Reemplazar "gestionar" por acciones concretas (consultar y editar nombre y correo).
- Aclarar si el cambio de contraseña entra en esta historia o va en otra.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Consultar y editar mi perfil
- **Estructura:** Como usuario autenticado, quiero ver y actualizar mis datos personales, para mantener mi información correcta y conocer mi actividad en la plataforma.
- **Criterios de Aceptación:**
  1. **Dado** que tengo sesión iniciada, **cuando** entro a "Mi perfil", **entonces** veo mi nombre, correo, rol y fecha de registro.
  2. **Dado** que estoy en mi perfil, **cuando** modifico mi nombre o mi correo y presiono "Guardar", **entonces** el sistema actualiza los datos y muestra un mensaje de confirmación.
  3. **Dado** que ingreso un correo que ya usa otro usuario, **cuando** intento guardar, **entonces** el sistema muestra "El correo ya está registrado por otro usuario" y no guarda.
  4. **Dado** que ingreso mi contraseña actual y una nueva de al menos 8 caracteres, **cuando** presiono "Cambiar contraseña", **entonces** el sistema actualiza mi contraseña.

---

### HU-06 – Visualizar mapa
**Historia presentada:** "Visualizar mapa" (Alta, 5 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple. No requiere sesión.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. Falta la estructura.
- **Estimable (E):** ⚠️ Advertencia. No indica la zona inicial, el zoom ni el comportamiento en celulares.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Especificar que el mapa se centra en Ciudad Bolívar y muestra su límite.
- Incluir un escenario para dispositivos móviles.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Mapa interactivo de Ciudad Bolívar
- **Estructura:** Como ciudadano, quiero ver un mapa interactivo de Ciudad Bolívar, para ubicar visualmente los puntos ecológicos de mi localidad.
- **Criterios de Aceptación:**
  1. **Dado** que entro a la sección "Mapa", **cuando** carga la página, **entonces** el mapa aparece centrado en Ciudad Bolívar con el límite de la localidad dibujado.
  2. **Dado** que el mapa está cargado, **cuando** hago zoom o lo arrastro, **entonces** el mapa responde sin recargar la página.
  3. **Dado** que entro desde un celular, **cuando** carga el mapa, **entonces** ocupa la pantalla y los controles son utilizables al tacto.

---

### HU-07 – Visualizar puntos ecológicos
**Historia presentada:** "Visualizar puntos ecológicos" (Alta, 3 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-06; se solapa con HU-08, HU-09 y HU-10.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. Falta la estructura.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Absorber HU-08 (electrónicos), HU-09 (donación) y HU-10 (marcadores): son la misma funcionalidad con distinta categoría.
- Aclarar que solo se muestran puntos aprobados.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Ver los puntos ecológicos aprobados en el mapa
- **Estructura:** Como ciudadano, quiero ver en el mapa los puntos de reciclaje, donación de ropa y reciclaje electrónico, con un marcador distinto por categoría, para identificar rápidamente dónde llevar cada material.
- **Criterios de Aceptación:**
  1. **Dado** que existen puntos aprobados, **cuando** abro el mapa, **entonces** cada punto aparece como un marcador en su ubicación.
  2. **Dado** que un punto pertenece a una categoría, **cuando** se muestra, **entonces** su marcador usa el color o ícono de esa categoría.
  3. **Dado** que un punto está pendiente o rechazado, **cuando** abro el mapa, **entonces** ese punto no aparece.

---

### HU-08 – Visualizar puntos electrónicos
**Historia presentada:** "Visualizar puntos electrónicos" (Media, 2 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 2/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ❌ No cumple. Es una variante de HU-07 y depende totalmente de ella.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. No aporta valor distinto al de HU-07.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ⚠️ Advertencia. Es tan pequeña que no justifica una historia propia.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Fusionar con HU-07 como un criterio de aceptación (marcador por categoría) o con HU-12 (filtro por categoría).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** (Fusionada en HU-07 / HU-12) Ver solo puntos de reciclaje electrónico
- **Estructura:** Como ciudadano con aparatos electrónicos en desuso, quiero ver solo los puntos de reciclaje electrónico, para saber dónde desecharlos correctamente.
- **Criterios de Aceptación:**
  1. **Dado** que estoy en el mapa, **cuando** selecciono la categoría "Electrónicos", **entonces** solo se muestran los puntos con esa categoría.

---

### HU-09 – Visualizar puntos de donación
**Historia presentada:** "Visualizar puntos de donación" (Media, 2 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 2/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ❌ No cumple. Igual que HU-08: variante de HU-07.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ⚠️ Advertencia.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Fusionar con HU-07 / HU-12.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** (Fusionada en HU-07 / HU-12) Ver solo puntos de donación de ropa
- **Estructura:** Como ciudadano que quiere donar ropa, quiero ver solo los puntos de donación, para llevar mis prendas al lugar adecuado.
- **Criterios de Aceptación:**
  1. **Dado** que estoy en el mapa, **cuando** selecciono la categoría "Donación de ropa", **entonces** solo se muestran los puntos con esa categoría.

---

### HU-10 – Ver marcadores geográficos
**Historia presentada:** "Ver marcadores geográficos" (Alta, 2 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 2/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ❌ No cumple. Los marcadores son la forma de mostrar los puntos de HU-07.
- **Negociable (N):** ⚠️ Advertencia. "Marcadores" ya describe una solución de interfaz.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Integrarla como criterio de aceptación de HU-07.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** (Fusionada en HU-07) Ubicación exacta de cada punto
- **Estructura:** Como ciudadano, quiero ver la ubicación exacta de cada punto en el mapa, para saber cómo llegar.
- **Criterios de Aceptación:**
  1. **Dado** que un punto tiene latitud y longitud, **cuando** abro el mapa, **entonces** su marcador aparece en esas coordenadas.
  2. **Dado** que hay varios puntos cercanos, **cuando** paso el cursor o toco un marcador, **entonces** se muestra el nombre del punto.

---

### HU-11 – Consultar información detallada
**Historia presentada:** "Consultar información detallada" (Alta, 3 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-07.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. No define qué información es "detallada".

#### 💡 Puntos de Mejora Accionables
- Listar los campos del detalle (nombre, dirección, horario, categorías, descripción, calificación).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Ver el detalle de un punto ecológico
- **Estructura:** Como ciudadano, quiero consultar la información completa de un punto, para saber qué recibe, cuándo atiende y si vale la pena ir.
- **Criterios de Aceptación:**
  1. **Dado** que estoy en el mapa, **cuando** selecciono un punto, **entonces** veo su nombre, dirección, horario, categorías, descripción y calificación promedio.
  2. **Dado** que un dato opcional no fue registrado (por ejemplo, horario), **cuando** veo el detalle, **entonces** el sistema muestra "No disponible" en lugar de dejar el campo vacío.

---

### HU-12 – Filtrar puntos
**Historia presentada:** "Filtrar puntos" (Alta, 3 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-07.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple si el filtro es por categoría.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. No dice por qué criterio se filtra.

#### 💡 Puntos de Mejora Accionables
- Indicar el criterio (categoría) y el caso sin resultados.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Filtrar puntos por categoría
- **Estructura:** Como ciudadano, quiero filtrar los puntos del mapa por categoría (reciclaje, donación de ropa, electrónicos), para ver solo los que me sirven.
- **Criterios de Aceptación:**
  1. **Dado** que estoy en el mapa, **cuando** selecciono una categoría, **entonces** solo se muestran los puntos de esa categoría.
  2. **Dado** que hay un filtro activo, **cuando** elijo "Todas", **entonces** se vuelven a mostrar todos los puntos aprobados.
  3. **Dado** que ninguna categoría tiene puntos, **cuando** la selecciono, **entonces** el sistema muestra "No hay puntos para esta categoría".

---

### HU-13 – Geolocalización
**Historia presentada:** "Geolocalización" (Alta, 5 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 1/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-06.
- **Negociable (N):** ⚠️ Advertencia. Es un nombre de tecnología, no una necesidad.
- **Valiosa (V):** ❌ No cumple. Una sola palabra; no se sabe quién la usa ni para qué.
- **Estimable (E):** ❌ No cumple. ¿Ubicar al usuario? ¿Validar la ubicación de una propuesta? ¿Ambas?
- **Pequeña (S):** ✅ Cumple si se acota a ubicar al usuario.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Aclarar el objetivo (supuesto: centrar el mapa en la posición del usuario para encontrar puntos cercanos). **Se solicita confirmación al equipo.**
- Agregar el caso en que el usuario niega el permiso de ubicación.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Ubicarme en el mapa para encontrar puntos cercanos
- **Estructura:** Como ciudadano, quiero que el mapa muestre mi ubicación actual, para encontrar los puntos ecológicos más cercanos a mí.
- **Criterios de Aceptación:**
  1. **Dado** que concedo el permiso de ubicación, **cuando** presiono "Mi ubicación", **entonces** el mapa se centra en mi posición y la marca.
  2. **Dado** que niego el permiso o el navegador no lo soporta, **cuando** presiono "Mi ubicación", **entonces** el sistema muestra un mensaje explicativo y el mapa sigue funcionando.
  3. **Dado** que estoy fuera de Ciudad Bolívar, **cuando** se obtiene mi ubicación, **entonces** el sistema me informa que el servicio cubre solo esta localidad.

---

### HU-14 – Proponer nuevos puntos
**Historia presentada:** "Proponer nuevos puntos" (Alta, 5 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 2/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Se solapa con HU-15 y HU-16, que son pasos del mismo flujo.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. Falta la estructura.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ⚠️ Advertencia. Si se fusiona con HU-15 y HU-16 sigue cabiendo en un sprint (10 pts).
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Fusionar HU-15 (registrar datos) y HU-16 (enviar a revisión) en esta historia.
- Incluir la validación de que el punto quede dentro de Ciudad Bolívar.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Proponer un nuevo punto ecológico
- **Estructura:** Como usuario autenticado, quiero proponer un punto marcándolo en el mapa y completando sus datos, para que la comunidad conozca lugares que aún no están registrados.
- **Criterios de Aceptación:**
  1. **Dado** que tengo sesión iniciada, **cuando** marco una ubicación dentro de Ciudad Bolívar, completo nombre, dirección y al menos una categoría y envío, **entonces** el punto se guarda con estado "pendiente".
  2. **Dado** que marco una ubicación fuera de Ciudad Bolívar, **cuando** intento enviar, **entonces** el sistema rechaza la propuesta e indica que debe estar dentro de la localidad.
  3. **Dado** que falta un campo obligatorio, **cuando** intento enviar, **entonces** el sistema señala el campo y no envía.
  4. **Dado** que envié una propuesta, **cuando** entro a "Mis puntos", **entonces** la veo con estado "pendiente".

---

### HU-15 – Registrar información de propuestas
**Historia presentada:** "Registrar información de propuestas" (Alta, 3 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 1/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ❌ No cumple. Es un paso interno de HU-14.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ❌ No cumple. Llenar un formulario no entrega valor por sí solo.
- **Estimable (E):** ⚠️ Advertencia. No lista los campos.
- **Pequeña (S):** ⚠️ Advertencia.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Fusionar con HU-14 (ver la propuesta mejorada de HU-14, criterios 1 y 3).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** (Fusionada en HU-14) Datos de la propuesta
- **Estructura:** Como usuario que propone un punto, quiero indicar nombre, dirección, horario, descripción y categorías, para que el administrador tenga la información suficiente para aprobarlo.
- **Criterios de Aceptación:**
  1. **Dado** que estoy proponiendo un punto, **cuando** completo los campos obligatorios, **entonces** el botón "Enviar" se habilita.

---

### HU-16 – Enviar propuesta a revisión
**Historia presentada:** "Enviar propuesta a revisión" (Alta, 2 pts).

#### 📊 Diagnóstico General: Rechazada
**Puntuación INVEST:** 1/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ❌ No cumple. Es el último paso de HU-14.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ❌ No cumple por sí sola.
- **Estimable (E):** ⚠️ Advertencia.
- **Pequeña (S):** ⚠️ Advertencia.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Fusionar con HU-14 (criterios 1 y 4).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** (Fusionada en HU-14) Propuesta en estado pendiente
- **Estructura:** Como usuario, quiero que mi propuesta quede en revisión, para que un administrador la valide antes de publicarla.
- **Criterios de Aceptación:**
  1. **Dado** que envié una propuesta válida, **cuando** se guarda, **entonces** queda con estado "pendiente" y no aparece en el mapa público.

---

### HU-17 – Reportar información incorrecta
**Historia presentada:** "Reportar información incorrecta" (Media, 3 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-11 (ver el detalle del punto).
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Definir los datos del reporte (motivo, descripción) y qué ve el administrador.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Reportar un punto con información incorrecta
- **Estructura:** Como usuario autenticado, quiero reportar que un punto tiene información incorrecta o ya no existe, para que el administrador la corrija y el mapa sea confiable.
- **Criterios de Aceptación:**
  1. **Dado** que veo el detalle de un punto, **cuando** presiono "Reportar", escribo el motivo y envío, **entonces** el reporte se guarda con estado "pendiente".
  2. **Dado** que envío un reporte sin motivo, **cuando** presiono "Enviar", **entonces** el sistema pide completar el motivo.
  3. **Dado** que soy administrador, **cuando** abro la sección de reportes, **entonces** veo los reportes con el punto asociado y puedo marcarlos como revisados con una respuesta al usuario.

---

### HU-18 – Ver solicitudes pendientes
**Historia presentada:** "Ver solicitudes pendientes" (Alta, 3 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-14.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia. No indica el rol (administrador).
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple.

#### 💡 Puntos de Mejora Accionables
- Indicar el rol y restringir el acceso a usuarios no administradores.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Listado de propuestas pendientes para el administrador
- **Estructura:** Como administrador, quiero ver la lista de puntos propuestos pendientes de revisión, para decidir cuáles publicar.
- **Criterios de Aceptación:**
  1. **Dado** que soy administrador, **cuando** entro al panel, **entonces** veo los puntos pendientes con nombre, proponente, fecha y ubicación.
  2. **Dado** que no hay propuestas pendientes, **cuando** entro al panel, **entonces** veo "No hay solicitudes pendientes".
  3. **Dado** que soy un usuario sin rol de administrador, **cuando** intento entrar al panel, **entonces** el sistema me niega el acceso.

---

### HU-19 – Aprobar puntos
**Historia presentada:** "Aprobar puntos" (Alta, 5 pts).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 3/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ⚠️ Advertencia. Depende de HU-18.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ⚠️ Advertencia.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple.
- **Testeable (T):** ❌ No cumple. Solo menciona aprobar; falta rechazar con motivo.

#### 💡 Puntos de Mejora Accionables
- Incluir el rechazo con motivo obligatorio.
- Enlazar con HU-21 (notificación por correo).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Aprobar o rechazar propuestas de puntos
- **Estructura:** Como administrador, quiero aprobar o rechazar los puntos propuestos indicando el motivo del rechazo, para que solo se publique información verificada.
- **Criterios de Aceptación:**
  1. **Dado** que reviso un punto pendiente, **cuando** presiono "Aprobar", **entonces** el punto cambia a "aprobado" y aparece en el mapa.
  2. **Dado** que reviso un punto pendiente, **cuando** presiono "Rechazar" y escribo el motivo, **entonces** el punto cambia a "rechazado" y el motivo queda visible para el proponente.
  3. **Dado** que intento rechazar sin motivo, **cuando** confirmo, **entonces** el sistema exige el motivo.

---

### HU-20 – Consultar historial de mis entregas
**Historia presentada:** Como usuario, quiero consultar el historial de mis entregas, con la finalidad de llevar control de mi actividad y verificar el estado de cada entrega registrada. 4 escenarios (historial con registros, historial vacío, filtrar por estado, ver detalle).

#### 📊 Diagnóstico General: Aprobada
**Puntuación INVEST:** 6/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple. Solo depende de que existan entregas (RF-011), lo cual es natural.
- **Negociable (N):** ✅ Cumple. No impone tecnología.
- **Valiosa (V):** ✅ Cumple. Rol, acción y beneficio claros.
- **Estimable (E):** ✅ Cumple. Campos y estados definidos.
- **Pequeña (S):** ✅ Cumple (3 pts).
- **Testeable (T):** ✅ Cumple. Cuatro escenarios Dado-Cuando-Entonces verificables.

#### 💡 Puntos de Mejora Accionables
- Opcional: mostrar el motivo cuando una entrega está "rechazada".
- Opcional: definir el orden (más recientes primero).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Consultar el historial de mis entregas
- **Estructura:** Como usuario, quiero consultar el historial de mis entregas, para llevar control de mi actividad y verificar el estado de cada una.
- **Criterios de Aceptación:**
  1. **Dado** que tengo entregas registradas, **cuando** entro a "Mis entregas", **entonces** veo la lista ordenada de la más reciente a la más antigua con fecha, tipo de material, punto y estado.
  2. **Dado** que no tengo entregas, **cuando** entro a "Mis entregas", **entonces** veo un mensaje indicando que aún no hay entregas registradas.
  3. **Dado** que tengo entregas en distintos estados, **cuando** selecciono un filtro (pendiente, verificada o rechazada), **entonces** solo veo las de ese estado.
  4. **Dado** que veo mi lista, **cuando** selecciono una entrega, **entonces** veo su detalle: peso, estado de conservación, fotografía, punto asociado y, si fue rechazada, el motivo.

---

### HU-21 – Notificación por correo al aprobar/rechazar un punto
**Historia presentada:** Como usuario, quiero recibir una notificación por correo al aprobar/rechazar un punto propuesto, con la finalidad de enterarme del resultado sin revisar manualmente la plataforma. 4 escenarios (aprobado, rechazado, falla en el envío, correo inválido); los escenarios mencionan "vía Resend".

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 5/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple. Depende de HU-19, dependencia natural del flujo.
- **Negociable (N):** ⚠️ Advertencia. Impone un proveedor concreto (Resend), que es una decisión técnica y no una necesidad del usuario.
- **Valiosa (V):** ✅ Cumple.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple (2 pts).
- **Testeable (T):** ✅ Cumple. Incluye escenarios de error.

#### 💡 Puntos de Mejora Accionables
- Quitar el nombre del proveedor de los criterios ("servicio de correo"). Esto además alinea la HU con la implementación real, que usa SMTP.
- Definir el contenido mínimo del correo (nombre del punto, resultado, motivo).

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Notificación por correo del resultado de mi propuesta
- **Estructura:** Como usuario que propuso un punto, quiero recibir un correo cuando sea aprobado o rechazado, para enterarme del resultado sin revisar la plataforma.
- **Criterios de Aceptación:**
  1. **Dado** que el administrador aprueba mi punto, **cuando** confirma la aprobación, **entonces** recibo un correo con el nombre del punto indicando que ya está publicado en el mapa.
  2. **Dado** que el administrador rechaza mi punto con un motivo, **cuando** confirma el rechazo, **entonces** recibo un correo con el nombre del punto y el motivo.
  3. **Dado** que el servicio de correo falla o mi correo no es válido, **cuando** el sistema intenta enviar la notificación, **entonces** registra el error y el cambio de estado del punto se mantiene.

---

### HU-22 – Dashboard de estadísticas de impacto
**Historia presentada:** Como usuario / administrador, quiero visualizar un dashboard de estadísticas de impacto, con la finalidad de conocer el impacto ambiental generado por la comunidad y motivar la participación. 4 escenarios (estadísticas generales, sin datos, filtrar por categoría, vista ampliada del administrador).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 5/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple. Lee datos existentes.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ✅ Cumple.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ⚠️ Advertencia. Combina dos roles y dos vistas (5 pts); está en el límite. Se puede dividir en "dashboard público" y "vista ampliada de administrador".
- **Testeable (T):** ✅ Cumple. Falta precisar qué entregas cuentan (¿se incluyen las pendientes o las rechazadas?).

#### 💡 Puntos de Mejora Accionables
- Aclarar que suman las entregas **no rechazadas** (verificadas y pendientes de verificación).
- Considerar dividir la vista de administrador en una historia aparte si el sprint se aprieta.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Dashboard de impacto ambiental de la comunidad
- **Estructura:** Como ciudadano, quiero ver cuántos kilogramos se han reciclado, cuántas donaciones se han hecho y cuántos puntos están activos, para conocer el impacto de la comunidad y motivarme a participar.
- **Criterios de Aceptación:**
  1. **Dado** que existen entregas no rechazadas, **cuando** entro a "Impacto", **entonces** veo el total de kg reciclados, el número de donaciones y el número de puntos activos.
  2. **Dado** que no hay entregas registradas, **cuando** entro a "Impacto", **entonces** veo los contadores en cero y un mensaje informativo.
  3. **Dado** que hay entregas de varias categorías, **cuando** selecciono una categoría, **entonces** las cifras se recalculan solo para esa categoría.
  4. **Dado** que soy administrador, **cuando** entro a "Impacto", **entonces** veo además el total de usuarios activos y de puntos pendientes de revisión.

---

### HU-23 – Calificar y reseñar un punto ecológico
**Historia presentada:** Como usuario, quiero calificar y reseñar un punto ecológico, con la finalidad de informar a otros usuarios y al administrador si el punto sigue activo y si su información es correcta. 4 escenarios (calificación exitosa, sin comentario, señalado como inactivo, calificar dos veces).

#### 📊 Diagnóstico General: Requiere Ajustes
**Puntuación INVEST:** 5/6

#### 🔍 Evaluación por Criterio
- **Independiente (I):** ✅ Cumple.
- **Negociable (N):** ✅ Cumple.
- **Valiosa (V):** ✅ Cumple.
- **Estimable (E):** ✅ Cumple.
- **Pequeña (S):** ✅ Cumple (3 pts).
- **Testeable (T):** ⚠️ Advertencia. El escenario 3 dice "varias reseñas" y "umbral configurado" sin valores concretos; no se puede verificar con un dato esperado.

#### 💡 Puntos de Mejora Accionables
- Definir el umbral: qué es una reseña negativa (1 o 2 estrellas), cuántas (3) y en qué periodo (30 días).
- Indicar que solo usuarios autenticados pueden reseñar.

#### 🛠️ Propuesta de Historia Mejorada
- **Título sugerido:** Calificar y reseñar un punto ecológico
- **Estructura:** Como usuario autenticado, quiero calificar un punto de 1 a 5 estrellas con un comentario opcional, para informar a otros usuarios y al administrador si el punto sigue activo y su información es correcta.
- **Criterios de Aceptación:**
  1. **Dado** que veo el detalle de un punto, **cuando** elijo una calificación, escribo un comentario y presiono "Enviar", **entonces** se guarda mi reseña y se actualiza el promedio del punto.
  2. **Dado** que solo elijo las estrellas, **cuando** presiono "Enviar", **entonces** se guarda la calificación sin comentario.
  3. **Dado** que ya califiqué ese punto, **cuando** vuelvo a calificarlo, **entonces** se edita mi reseña anterior en lugar de crear otra.
  4. **Dado** que un punto recibe 3 o más reseñas de 1 o 2 estrellas en los últimos 30 días, **cuando** se registra la reseña que alcanza el umbral, **entonces** el punto queda marcado para revisión prioritaria del administrador.
  5. **Dado** que no tengo sesión iniciada, **cuando** intento reseñar, **entonces** el sistema me pide iniciar sesión.
