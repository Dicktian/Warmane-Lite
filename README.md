# WarmaneBot Lite

**Bot de Discord para consultar personajes de Warmane.** Una aplicación ligera desarrollada en JavaScript con Node.js y discord.js, diseñada para mostrar información de personajes mediante comandos de Discord, sin base de datos ni panel web.

**Versión:** 2.9.0  
**Compatibilidad:** Node.js 20 o superior · Discord.js 14  
**Idioma:** interfaz en español  
**Reinos seleccionables:** Icecrown, Lordaeron, Blackrock y Onyxia  
**Ejecución:** local en Windows, Linux o macOS, o en un servidor externo

> Este proyecto es independiente y no está afiliado oficialmente a Warmane ni a Discord. Los datos disponibles dependen de la API pública de Warmane.

## Funcionalidades

### `/character`

Consulta información de un personaje indicando su nombre y reino. La respuesta se presenta como un mensaje integrado (*embed*) con dos botones:

**Resumen**
- Nombre y reino.
- Nivel, clase y raza.
- Hermandad y facción.
- Puntos de logro.
- Profesiones y nivel de habilidad, cuando la API los proporciona.

**Equipamiento**
- Lista de objetos equipados organizada en dos columnas.
- Nombres de los objetos tal como los devuelve Warmane; algunos pueden aparecer en inglés.
- Si falta información, el bot indica que no está disponible.

**No incluye:** talentos, glifos, nivel de objeto promedio (*ilvl*) ni GearScore.

### `/servertime`

Muestra una hora calculada usando la variable `SERVER_UTC_OFFSET`. **No sincroniza el reloj con los servidores de Warmane**: la precisión depende de que el desfase UTC esté configurado correctamente.

### Características técnicas

- Comandos de barra (`/`) de Discord.
- Interfaz en español para los campos y botones.
- Caché de consultas de personajes de **60 segundos**.
- Consultas a `armory.warmane.com` por HTTPS.
- Sin MongoDB ni otras bases de datos.
- Requiere conexión a Internet para Discord y la API de Warmane.

## Requisitos

1. Node.js **20 o superior** y npm.
2. Una aplicación con bot creada en [Discord Developer Portal](https://discord.com/developers/applications).
3. Un servidor de Discord donde tengas permisos para añadir el bot.
4. Conexión a Internet.

## Instalación local

### 1. Descargar el proyecto

Clona el repositorio o descarga el ZIP desde GitHub:

```bash
git clone https://github.com/Dicktian/Bot_warmame.git
cd Bot_warmame
```

> Si el contenido descargado está dentro de una subcarpeta, abre en la terminal **la carpeta que contiene `package.json`**.

### 2. Instalar dependencias

```bash
npm install
```

En PowerShell, si la política de ejecución bloquea `npm`, utiliza `npm.cmd install`.

### 3. Configurar las variables de entorno

Copia `.env.example` como `.env` y edita los valores:

```ini
DISCORD_TOKEN=TU_TOKEN_PRIVADO
DISCORD_CLIENT_ID=ID_DE_TU_APLICACION
DISCORD_GUILD_ID=ID_DE_TU_SERVIDOR
SERVER_UTC_OFFSET=0
```

| Variable | Descripción |
|---|---|
| `DISCORD_TOKEN` | Token secreto de la aplicación, obtenido en la sección **Bot** del Developer Portal |
| `DISCORD_CLIENT_ID` | **Application ID** de Discord |
| `DISCORD_GUILD_ID` | Opcional: ID de un servidor de pruebas para registrar comandos allí |
| `SERVER_UTC_OFFSET` | Desfase horario respecto de UTC utilizado por `/servertime` |

**Seguridad:** no publiques `.env`, tokens, contraseñas ni claves en GitHub. Si un token se filtra, regénéralo desde el Developer Portal.

### 4. Añadir el bot al servidor

En el Developer Portal, abre **OAuth2 → URL Generator**, selecciona los ámbitos `bot` y `applications.commands` y concede los permisos necesarios para ver canales, enviar mensajes e insertar enlaces. Abre la URL generada y selecciona tu servidor.

### 5. Ejecutar el bot

```bash
npm start
```

Para comprobar la sintaxis del código:

```bash
npm run check
```

Cuando la conexión se establezca, la consola mostrará un mensaje indicando el usuario de Discord conectado. Mantén la terminal abierta. Para detenerlo, presiona **Ctrl + C**.

#### Nota para Windows con Node.js portátil

Si `node` no se reconoce porque utilizas Node.js descomprimido sin instalarlo, añade temporalmente su carpeta a `PATH` en PowerShell:

```powershell
$env:Path = "C:\ruta\a\node-vXX-win-x64;$env:Path"
npm.cmd install
npm.cmd start
```

Reemplaza la ruta de ejemplo por la ubicación real de `node.exe`.

## Uso en Discord

### Consultar un personaje

1. En un canal donde el bot tenga acceso, escribe `/character`.
2. Completa `name` con el nombre del personaje.
3. Selecciona `realm` entre los reinos disponibles.
4. Envía el comando.
5. Utiliza **Resumen** y **Equipamiento** para cambiar de vista.

Ejemplo: personaje `Comunxanxo`, reino `Icecrown`.

### Consultar la hora configurada

Escribe `/servertime`. El bot responderá con la hora calculada a partir del desfase UTC definido en `.env`.

## Solución de problemas

| Problema | Qué revisar |
|---|---|
| `node` o `npm` no se reconoce | Instalación de Node.js o variable `PATH` |
| `Cannot find package 'discord.js'` | Ejecutar `npm install` en la carpeta correcta |
| `Invalid Token` | Valor de `DISCORD_TOKEN`; regenerarlo si se filtró |
| `Missing Access` | `DISCORD_GUILD_ID`, invitación del bot y permisos |
| No aparecen los comandos | IDs, ámbitos `applications.commands` y registro de comandos |
| El personaje no muestra datos | Nombre, reino, conectividad y disponibilidad de la API |
| Objetos en inglés | Warmane puede entregar nombres sin traducción al español |
| Bot desconectado | Comprobar que el proceso siga ejecutándose |

## Ejecución continua

**Local:** el bot funciona mientras el computador esté encendido y el proceso siga activo.  
**24/7:** puedes desplegarlo en un VPS o plataforma que permita ejecutar procesos Node.js continuamente. Configura allí las variables de entorno como secretos, no como archivos públicos.

## Estructura del proyecto

```text
Bot_warmame_Lite/
├── src/
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

El archivo `.env` se crea localmente y **no debe incluirse en el repositorio**.

## Licencia

No se incluye una licencia de código abierto en esta distribución. Si deseas permitir reutilización y contribuciones bajo condiciones específicas, añade un archivo `LICENSE` al repositorio.
