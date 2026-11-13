Set up my Android app "Bodega" in Google Play Console, up to a closed test. I am signed in to my personal developer account. Work in this tab only.

Rules:
- Ask me before every button that creates, publishes or sends something: "Create app", "Save" on a declaration, "Start rollout", "Send for review", "Send changes for review". Show me what you are about to submit, then wait for my "yes".
- Never type a password, and never accept a payment or a legal agreement for me. Stop and ask.
- File uploads (the app bundle, the icon, the graphics, the screenshots) are mine. When a step needs a file, stop, name the file and the field, and wait until I say it is uploaded.
- When a field is not covered below, stop and ask. Do not guess.
- At the end, list what is done, what is waiting for me, and any warning Play Console shows.

## 1. Create the app

Home → Create app:
- App name: Bodega - Lista de la compra
- Default language: Spanish (Spain) – es-ES
- App or game: App
- Free or paid: Free
- Declarations: show them to me and wait for my "yes" before you tick them.

## 2. Main store listing (Grow users → Store presence → Main store listing), es-ES

- App name: Bodega - Lista de la compra
- Short description: Lista de la compra que se prepara sola para la próxima vez
- Full description (paste exactly, keep the line breaks and bullets):

Bodega es una lista de la compra pensada para el móvil. Funciona en la tienda sin conexión.

Una sola lista, Compra, para el viaje a la tienda. Al terminar la compra, Bodega guarda lo que compras cada vez y lo que no compraste, así la lista de la próxima compra ya está casi lista.

Qué puedes hacer:
• Añadir artículos con búsqueda, sin duplicados.
• Ordenar la lista por nombre o a tu manera, y agruparla por receta o por tienda.
• Indicar en qué tiendas compras cada artículo y ver una lista para cada tienda.
• Guardar recetas que envían sus ingredientes a la lista.
• Planificar el menú de la semana, que también llena la lista.
• Marcar artículos que compras en cada compra.
• Hacer una copia de seguridad en un archivo y recuperarla.
• Usar la app en siete idiomas: español, catalán, inglés, francés, alemán, italiano y portugués.

Cuenta opcional:
• Sin cuenta, tus datos se quedan solo en el dispositivo.
• Con cuenta de Google, la lista se sincroniza entre tus dispositivos y puedes compartirla con otras personas por correo.

Sin anuncios, sin seguimiento y sin notificaciones.

- App icon (512×512): I upload `icons/icon-512.png`.
- Feature graphic (1024×500): I upload `docs/play/feature-graphic.png`.
- Phone screenshots: I upload them.
- Save, after my "yes".

Store settings (Store presence → Store settings):
- Category: App, Shopping.
- Contact email: ask me which address to use.
- Website: https://bodega.polarisworks.duckdns.org/

## 3. App content (Policy and programs → App content)

- Privacy policy: https://bodega.polarisworks.duckdns.org/privacy.html
- App access: All functionality is available without special access. (Sign-in with Google is optional; every function works with no account.)
- Ads: No, the app does not contain ads.
- Content rating: email for the questionnaire = the contact email I gave you. Category: "All other app types" (utility / productivity). Answer "No" to violence, sexuality, language, controlled substances, gambling. User interaction: users do not interact or share content publicly; a list can be shared by email only with named people the user chooses. No location sharing. No digital purchases. Show me the answers before you submit.
- Target audience and content: 18 and over only. The app is not designed for children. No appeal to children.
- News app: No. COVID-19 apps: not one. Government app: No. Financial features: none. Health: none. Advertising ID: No, the app does not use the advertising ID.
- Data safety:
  - Does the app collect or share user data? Yes (only when the user creates an account).
  - Is all data encrypted in transit? Yes.
  - Can users request deletion? Yes. Deletion URL: https://bodega.polarisworks.duckdns.org/privacy.html
  - Account creation: the app lets users create an account (with Google). Account deletion URL: https://bodega.polarisworks.duckdns.org/privacy.html
  - Data types collected (not shared with third parties; it goes only to the developer's own server):
    - Personal info → Email address: collected, required for an account, purpose "Account management". Not processed ephemerally.
    - App activity → Other user-generated content (the lists, recipes and weekly menu): collected, optional (only with an account), purpose "App functionality".
  - Nothing else is collected. No location, no contacts, no device IDs, no crash logs, no analytics.
  - Show me the summary before you submit.

## 4. Closed test (Test and release → Testing → Closed testing)

- Create a closed testing track (or use "Closed testing - Alpha"). Name the release: 1.1.0 (2).
- App bundle: I upload `twa/out/bodega-1.1.0.aab`. When Play asks about Play App Signing, choose "Use Google-generated key" (the default) and tell me.
- Release notes, es-ES: "Primera versión en Google Play."
- Testers: create an email list named "Bodega testers". Ask me for the addresses (at least 12).
- Countries: Spain.
- Feedback URL or email: ask me.
- Review the release, show me every error and warning, and wait for my "yes" before "Start rollout to Closed testing".

## 5. After the upload

Go to Test and release → Setup → App integrity → App signing. Copy the "SHA-256 certificate fingerprint" of the **App signing key certificate**, and also the one of the **Upload key certificate**. Give me both, exactly as shown. The upload key should be 25:F4:9C:8E:6D:FA:8B:FA:F1:4F:97:4C:FB:DB:B0:A7:C2:00:FB:93:30:F7:4E:0E:97:0A:BC:7E:E6:39:E3:50; tell me if it is different.
