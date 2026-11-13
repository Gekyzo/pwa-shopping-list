# Notas de la versión

Lo que cambia para ti en cada versión de la app. La versión más nueva va primero.

## Unreleased

No change.

## 1.13.4 - 2026-11-13

- Bodega también es una app de Android. Descarga el archivo `bodega-1.0.0.apk` de github.com/polaris-works/shopping-list/releases e instálalo: verás las mismas listas.

## 1.13.2 - 2026-11-09

- **Actualizar** de **Ajustes** vuelve a funcionar tras una versión que mueve archivos de la app. Antes podía decir «No se pudo actualizar.» aunque la versión nueva estuviera lista.

## 1.13.1 - 2026-11-09

- En el móvil, **Compra** se parece más al diseño: una barra arriba con el botón **Terminar compra** (en lugar de los tres puntos), un dock con la tienda a la izquierda y sin flechas, filas más altas con la cantidad más grande, y **Comprados** abierto desde el principio. Un artículo comprado ya no muestra el asa: **Editar** sigue al deslizarlo. El aviso con **Deshacer** sale arriba y lleva una marca de hecho.
- En pantallas anchas, la cabecera de **Recetas** se parece más al diseño: el buscador ocupa su propia línea, el botón **Filtros** muestra u oculta los filtros, y bajo el título se ve si las recetas se guardan en este dispositivo o se sincronizan.
- En pantallas anchas, **Recetas** se parece más al diseño: cada receta es una tarjeta con sus botones al pie, y el panel de una receta tiene el botón **Añadir a Compra**, que dice cuántos productos añade. En todas las pantallas, la receta muestra cuántos de sus productos están en la lista y marca cada uno con un punto verde.
- En **Menú**, en pantallas más anchas que un móvil, el panel **Semanas anteriores** muestra las tres últimas semanas con comidas y un botón **Repetir esta semana** en cada una. La tarjeta **Generación automática de cesta** dice cuántos productos añade **Llenar cesta** y sustituye al panel **Para la cesta**.
- En pantallas anchas, **Menú** se parece más al diseño: cada día es una tarjeta, cada comida muestra su tipo en un recuadro y su estado en una píldora, y el resumen de la semana lleva una barra de progreso.
- En **Menú**, la flecha › lleva a las próximas semanas, hasta cuatro semanas por delante. Puedes planificar sus comidas, llenar la cesta con ellas o vaciarlas, como en la semana actual.
- En pantallas anchas, **Ajustes** tiene el diseño de escritorio: una columna centrada, con cada grupo bajo su título.
- En pantallas anchas, los botones de añadir ya no desaparecen al abrir una hoja, y la cabecera y el menú lateral no se mueven.
- En pantallas anchas, los filtros de tienda de **Compra** son más bajos.
- En pantallas anchas, **Recetas**, **Menú** y **Ajustes** ocupan todo el ancho, como **Compra**.
- En pantallas anchas, una tarjeta pequeña bajo los paneles de **Compra** muestra cuánto ocupan tus listas en el dispositivo.
- En pantallas anchas, los paneles de **Compra** se parecen más al diseño: **Ver** lleva una flecha, los nombres de **Próxima compra** tienen un trazo más fino y el botón para moverlo todo lleva un icono de lista.
- En pantallas anchas, la cabecera de **Compra** es como el diseño: sobre el fondo de la página, un título más grande, botones con esquinas más rectas y tiendas con letra más pequeña. El botón de añadir dice **Añadir**.
- Con un ratón, el botón ⋮ de un artículo ya no tapa la cantidad: tiene su propio sitio antes del asa.
- Con un ratón, un clic en un artículo de **Compra** abre **Editar**. Para marcarlo como comprado, haz clic en el círculo. Arrastrar con el ratón sigue moviendo el artículo. Con el dedo, tocar el artículo sigue marcándolo.
- En pantallas anchas de unos 1024 px, el título de la cabecera ya no se corta: el campo de búsqueda se estrecha y, si hace falta, muestra solo la lupa.
- En pantallas anchas, la lista y los paneles de **Compra** son como el diseño: más aire alrededor de la lista y entre los grupos, paneles más anchos, etiquetas y cantidades más claras, la barra de cada receta más gruesa y verde.
- Cada sección tiene su propia dirección: `#/compra`, `#/recetas`, `#/menu` y `#/ajustes`. Al recargar sigues en la misma sección. El botón Atrás del móvil vuelve primero a **Compra** y después sale de la app.
- En pantallas anchas, la barra lateral es como el diseño: algo más ancha, la sección actual con un fondo más marcado y una barra verde, el número de artículos en una píldora y el estado de la sincronización bajo una línea.
- Con un teclado: de 1 a 4 abren las secciones, N añade y / busca. En un artículo seleccionado, la tecla de menú o Mayús+F10 muestra sus acciones y Supr lo elimina.
- Con un ratón, haz clic derecho en un artículo o usa su botón ⋮ para ver sus acciones. Arrastrar la cabecera con el ratón ya no cambia de sección.
- En **Recetas**, cada producto que añades empieza por mayúscula: «arroz» se guarda como «Arroz».
- En pantallas anchas, **Compra** ocupa todo el ancho. La barra lateral tiene un fondo suave, una línea de estado bajo **Bodega**, el botón para añadir y abajo una tarjeta con el estado de la sincronización.
- En pantallas anchas, las filas de **Compra** son como el diseño: nombre más compacto, «cada compra» junto al nombre y la cantidad en letra de ancho fijo. Cada grupo dice cuántos artículos le quedan («3 art.»). El lápiz de cada fila es ahora un asa de seis puntos; al tocarla se abre **Editar**.
- La cabecera de **Compra** dice cuánto queda por comprar en verde, sin barra. En pantallas anchas tiene un campo de búsqueda (abre con Ctrl+K o ⌘K), el botón **Terminar compra** y las tiendas debajo del título.
- En **Compra**, puedes posponer un producto para la próxima compra: desliza la fila o usa **Posponer** en **Editar**. En pantallas anchas, **Próxima compra** los lista con un + para traerlos, y **Recetas en la lista** muestra cuántos ingredientes de cada receta tienes ya.
- En **Compra**, el nombre de cada producto tiene más sitio: se corta menos y ocupa menos líneas.
- Colores nuevos: un fondo de papel cálido con líneas gris verdoso suaves, en el tema claro y en el oscuro.
- En **Compra**, el nombre de cada producto ocupa una línea, y su cantidad es una etiqueta suave.
- En **Compra**, los productos comprados están en una tarjeta propia, bajo una marca de hecho.
- Los botones de abajo de **Compra** flotan sobre la lista, y el aviso tras marcar es oscuro.
- **Editar** muestra cada campo como una caja con su nombre dentro, el interruptor de repetir como una tarjeta, y las tiendas como etiquetas que añades con + y quitas con ×.
- En **Recetas**, los botones de una receta están junto a su nombre, y sus productos ocupan todo el ancho de la tarjeta.
- **Menú** muestra cuántas comidas de la semana están planificadas y cuántas libres, un icono en cada comida para una receta o un plato, y un calendario en la semana.
- **Ajustes** muestra un icono en cada grupo, marca **Borrar todos los datos** como irreversible y explica **Instalar la aplicación**.
- En una pantalla ancha, la sección actual destaca con una barra verde, y cada grupo de **Compra** tiene su título dentro de su tarjeta.

## 1.13.0 - 2026-11-05

- La app se muda a `bodega.artisandevs.duckdns.org`. En la dirección antigua, **Mover mis datos** copia tu lista a la nueva; con cuenta, envía antes tus cambios y luego inicias sesión allí.

## 1.12.1 - 2026-11-03

- Nuevo aspecto: fondo de papel cálido, la letra Hanken Grotesk más grande, casillas redondas y un verde esmeralda para lo comprado y la acción principal.
- `Recetas`, `Menú` y `Ajustes` siguen el nuevo aspecto: un botón verde envía una receta a la lista, las comidas son fichas más altas y las flechas de `Ajustes` se ven mejor.
- La barra muestra unos cubiertos para `Recetas` y un libro abierto para `Menú`, y las acciones que borran datos se ven en rojo.
- Cada fila de `Ajustes` empieza con un icono, y la cabecera de cada sección de la tienda muestra un icono de su tipo: fruta, lácteos, pan, limpieza y otros.
- En `Menú`, la barra de la semana muestra sus días y cada día su fecha. Cada comida dice si es una receta o una anotación rápida, y una comida libre muestra un ⊕.
- En `Recetas`, cada receta muestra sus productos y la marca «en la lista», y unos chips filtran las recetas: `Todas`, `En la lista` y `Con enlace`.

## 1.12.0 - 2026-11-03

- En una semana pasada de **Menú**, **Repetir esta semana** copia sus comidas a la semana actual. Si te arrepientes, pulsa **Deshacer**.

## 1.11.0 - 2026-11-03

- **Menú** empieza vacío cada lunes. Con las flechas de arriba ves el menú de las semanas anteriores, hasta 26 semanas atrás.

## 1.10.2 - 2026-10-31

- En Novedades, los nombres de los botones se ven en negrita, sin asteriscos.

## 1.10.1 - 2026-10-30

- En una tableta o un ordenador, los márgenes de la pantalla son los mismos que en las otras apps: la lista, los paneles y las hojas quedan a la misma distancia del menú lateral.

## 1.10.0 - 2026-10-30

- Una receta con enlace muestra un botón ▶ junto a «Añadir a Compra» que abre el vídeo al momento. En la ficha de la receta, una tarjeta encima del campo Enlace muestra «Ver vídeo» y la web del enlace, como youtube.com.

## 1.9.1 - 2026-10-27

- La app vuelve a abrirse tras actualizar a la 1.9.0 si la abres desde un acceso directo. Las actualizaciones llegan también por los accesos directos.

## 1.9.0 - 2026-10-27

- Si compartes una lista, un artículo que está en tu lista y en la compartida aparece ahora en una sola fila en Todas, con las dos etiquetas. Cada lista tiene su color. Un ajuste nuevo elige si al marcar o quitar esa fila cambia solo tu lista o las dos.

## 1.8.0 - 2026-10-26

- En pantallas anchas, Ajustes ya no muestra dos barras de desplazamiento.
- En una tableta, un plegable o un ordenador, las secciones están siempre a la izquierda. En un ordenador, Bodega ocupa un marco centrado con una barra lateral con los nombres de las secciones y lo que te queda por comprar.
- En pantallas anchas, Compra muestra lo que queda en cada tienda y lo que vuelve en la próxima compra, y Menú lo que añade «Llenar cesta».
- El título de la pestaña y de la app instalada es ahora «Lista de la compra - Bodega».
- En una tableta o un ordenador, una receta se abre en un panel junto a la lista de recetas, y puedes pasar de una a otra sin cerrarlo.
- En una tableta, un plegable o un ordenador, el botón para añadir está en la cabecera, y las hojas como Añadir se abren junto a la lista sin taparla.
- En pantallas anchas, Ajustes muestra cada grupo con su explicación al lado.

## 1.7.1 - 2026-10-26

- Al buscar en Compra, la lista se queda arriba y ya no baja hasta el campo de búsqueda.
- Si te invitan a compartir otra lista mientras compartes la tuya, ahora puedes quitar a esas personas en la misma invitación y después aceptarla.

## 1.7.0 - 2026-10-25

- Puedes usar la app sin cuenta: toca **Usar sin cuenta** en Iniciar sesión. Tus listas se quedan en este dispositivo. Inicia sesión más tarde desde Ajustes para sincronizarlas.
- Ya no se inicia sesión con correo y contraseña. Si lo usabas, inicia sesión con Google con el mismo correo: conservas tu cuenta y tus listas.

## 1.6.0 - 2026-10-25

- Cuando aceptas una lista compartida, tu propia lista se queda. En `Compra` ves las dos juntas: `Todas`, `Mi lista` y la lista de la otra persona son chips arriba, con lo que falta por comprar en cada una. En `Todas`, cada artículo dice de qué lista es, y lo que añades va a tu lista. Si también comparte recetas y menú, `Recetas` y `Menú` muestran los de las dos listas, cada uno con su lista: una receta compartida envía sus productos a la lista compartida.
- Al invitar a alguien en `Compartir lista`, eliges qué compartes: `Solo Compra` o `Compra, Recetas y Menú`. Puedes cambiarlo después con un toque en la persona. Si alguien rechaza la invitación o deja de compartir, ves `Cancelada` y puedes `Invitar de nuevo`.

## 1.5.0 - 2026-10-25

- Puedes compartir tu lista con otras personas: en `Ajustes` › `Cuenta` › `Compartir lista` escribe su correo. Cuando aceptan, ven y cambian la misma lista, las recetas y el menú en sus dispositivos.

## 1.4.1 - 2026-10-24

- Si el servidor pide esperar unos segundos al subir una lista larga, la app ya no muestra «Sin conexión» y lo reintenta sola.
- En `Ajustes` › `Cuenta`, el correo y la hora de la última sincronización ya no se superponen en un teléfono: la hora va debajo del correo, y un correo largo se parte en varias líneas.
- La nota «Sin conexión» ahora se quita sola cuando una sincronización llega al servidor, también si el teléfono no avisa de que volvió la red, y al volver a la app.

## 1.4.0 - 2026-10-24

- Inicia sesión para tener tus listas en todos tus dispositivos. Pide acceso con tu correo o con Google; el administrador aprueba cada cuenta. Un cambio en un dispositivo llega a los demás en segundos, y sin conexión los cambios se guardan y se envían después. Si ya tienes una lista, sigue en el dispositivo, y el aviso `Inicia sesión para sincronizar` te lleva a iniciar sesión.
- `Ajustes` › `Ayuda` › `Novedades` muestra lo que cambia en cada versión. Tras una actualización, se abre sola una vez.
