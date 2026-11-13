# Notes de la versió

El que canvia per a tu en cada versió de l’app. La versió més nova va primer.

## Unreleased

No change.

## 1.13.6 - 2026-11-13

- Bodega té una adreça nova: `bodega.polarisworks.duckdns.org`. Instal·la l'app des d'allà i treu la icona antiga. Amb un compte, les teves llistes tornen quan inicies la sessió. Sense compte, passa-les amb **Exporta** i **Importa** a **Configuració**.
- L'app d'Android 1.1.0 obre l'adreça nova. Descarrega `bodega-1.1.0.apk` de github.com/polaris-works/shopping-list/releases i instal·la-la sobre l'anterior. Comença buida: inicia la sessió per recuperar les teves llistes, o fes servir **Importa**.

## 1.13.4 - 2026-11-13

- Bodega també és una app d’Android. Baixa el fitxer `bodega-1.0.0.apk` de github.com/polaris-works/shopping-list/releases i instal·la’l: veuràs les mateixes llistes.

## 1.13.2 - 2026-11-09

- **Actualitza** de **Configuració** torna a funcionar després d’una versió que mou fitxers de l’app. Abans podia dir «No s’ha pogut actualitzar.» encara que la versió nova estigués a punt.

## 1.13.1 - 2026-11-09

- Al mòbil, **Compra** s’assembla més al disseny: una barra a dalt amb el botó **Acaba la compra** (en lloc dels tres punts), un dock amb la botiga a l’esquerra i sense fletxes, files més altes amb la quantitat més gran, i **Comprats** obert des del principi. Un article comprat ja no mostra la nansa: **Edita** continua en lliscar-lo. L’avís amb **Desfés** surt a dalt i porta una marca de fet.
- En pantalles amples, la capçalera de **Receptes** s’assembla més al disseny: el cercador ocupa la seva pròpia línia, el botó **Filtres** mostra o amaga els filtres, i sota el títol es veu si les receptes es desen en aquest dispositiu o se sincronitzen.
- En pantalles amples, **Receptes** s’assembla més al disseny: cada recepta és una targeta amb els botons al peu, i el panell d’una recepta té el botó **Afegeix a Compra**, que diu quants productes afegeix. A totes les pantalles, la recepta mostra quants dels seus productes són a la llista i marca cadascun amb un punt verd.
- A **Menú**, en pantalles més amples que un mòbil, el panell **Setmanes anteriors** mostra les tres darreres setmanes amb àpats, cadascuna amb un botó **Repetir aquesta setmana**. La targeta **Generació automàtica de cistella** diu quants productes afegeix **Omple cistella** i substitueix el panell **Per a la cistella**.
- A pantalles amples, **Menú** s’assembla més al disseny: cada dia és una targeta, cada àpat mostra el seu tipus en un requadre i el seu estat en una píndola, i el resum de la setmana té una barra de progrés.
- A **Menú**, la fletxa › porta a les setmanes següents, fins a quatre setmanes endavant. Pots planificar-ne els àpats, omplir la cistella amb ells o buidar-los, com a la setmana actual.
- En pantalles amples, **Configuració** té el disseny d’escriptori: una columna centrada, amb cada grup sota el seu títol.
- En pantalles amples, els botons d’afegir ja no desapareixen quan s’obre un full, i la capçalera i el menú lateral no es mouen.
- En pantalles amples, els filtres de botiga de **Compra** són més baixos.
- En pantalles amples, **Receptes**, **Menú** i **Configuració** ocupen tota l’amplada, com **Compra**.
- En pantalles amples, sota els panells de **Compra**, una targeta petita mostra quant ocupen les teves llistes al dispositiu.
- En pantalles amples, els panells de **Compra** s’assemblen més al disseny: **Veure** porta una fletxa, els noms de **Propera compra** tenen un traç més fi i el botó per moure-ho tot porta una icona de llista.
- En pantalles amples, la capçalera de **Compra** és com el disseny: sobre el fons de la pàgina, un títol més gran, botons amb cantonades més rectes i botigues amb lletra més petita. El botó d’afegir diu **Afegeix**.
- Amb un ratolí, el botó ⋮ d’un article ja no tapa la quantitat: té el seu lloc abans de la nansa.
- Amb un ratolí, un clic en un article de **Compra** obre **Edita**. Per marcar-lo com a comprat, fes clic al cercle. Arrossegar amb el ratolí continua movent l’article. Amb el dit, tocar l’article continua marcant-lo.
- En pantalles amples d’uns 1024 px, el títol de la capçalera ja no es talla: el camp de cerca s’estreny i, si cal, mostra només la lupa.
- En pantalles amples, la llista i els panells de **Compra** són com el disseny: més aire al voltant de la llista i entre els grups, panells més amples, etiquetes i quantitats més clares i la barra de cada recepta més gruixuda i verda.
- Cada secció té la seva adreça: `#/compra`, `#/recetas`, `#/menu` i `#/ajustes`. En tornar a carregar continues a la mateixa secció. El botó Enrere del mòbil torna primer a **Compra** i després surt de l’app.
- En pantalles amples, la barra lateral és com el disseny: una mica més ampla, la secció actual amb un fons més marcat i una barra verda, el nombre d’articles en una píndola i l’estat de la sincronització sota una línia.
- Amb un teclat: de l'1 al 4 obren les seccions, N afegeix i / cerca. En un article seleccionat, la tecla de menú o Maj+F10 en mostra les accions i Supr l'elimina.
- Amb un ratolí, fes clic dret en un article o fes servir el seu botó ⋮ per veure'n les accions. Arrossegar la capçalera amb el ratolí ja no canvia de secció.
- A **Receptes**, cada producte que afegeixes comença amb majúscula: «arròs» es desa com «Arròs».
- En pantalles amples, **Compra** ocupa tota l’amplada. La barra lateral té un fons suau, una línia d’estat sota **Bodega**, el botó per afegir i a baix una targeta amb l’estat de la sincronització.
- En pantalles amples, les files de **Compra** són com el disseny: nom més compacte, «cada compra» al costat del nom i la quantitat en lletra d’amplada fixa. Cada grup diu quants articles li queden («3 art.»). El llapis de cada fila és ara una nansa de sis punts; en tocar-la s’obre **Edita**.
- La capçalera de **Compra** diu quant queda per comprar en verd, sense barra. En pantalles amples té un camp de cerca (s’obre amb Ctrl+K o ⌘K), el botó **Acaba la compra** i les botigues sota el títol.
- A **Compra**, pots posposar un producte per a la propera compra: llisca la fila o fes servir **Posposar** a **Edita**. En pantalles amples, **Propera compra** els llista amb un + per portar-los, i **Receptes a la llista** mostra quants ingredients de cada recepta ja tens.
- A **Compra**, el nom de cada producte té més espai: es talla menys i ocupa menys línies.
- Colors nous: un fons de paper càlid amb línies gris verdós suaus, en el tema clar i en el fosc.
- A **Compra**, el nom de cada producte ocupa una línia, i la seva quantitat és una etiqueta suau.
- A **Compra**, els productes comprats són en una targeta pròpia, sota una marca de fet.
- Els botons de baix de **Compra** suren sobre la llista, i l'avís després de marcar és fosc.
- **Edita** mostra cada camp com una caixa amb el nom a dins, l'interruptor de repetir com una targeta, i les botigues com etiquetes que afegeixes amb + i treus amb ×.
- A **Receptes**, els botons d'una recepta són al costat del nom, i els productes ocupen tota l'amplada de la targeta.
- **Menú** mostra quants àpats de la setmana són planificats i quants lliures, una icona a cada àpat per a una recepta o un plat, i un calendari a la setmana.
- **Configuració** mostra una icona a cada grup, marca **Esborrar totes les dades** com a irreversible i explica **Instal·la l’aplicació**.
- En una pantalla ampla, la secció actual destaca amb una barra verda, i cada grup de **Compra** té el títol dins la targeta.

## 1.13.0 - 2026-11-05

- L’app es muda a `bodega.artisandevs.duckdns.org`. A l’adreça antiga, **Moure les meves dades** copia la teva llista a la nova; amb compte, primer envia els teus canvis i després inicies sessió allà.

## 1.12.1 - 2026-11-03

- Un aspecte nou: fons de paper càlid, la lletra Hanken Grotesk més gran, caselles rodones i un verd maragda per al que has comprat i l'acció principal.
- `Receptes`, `Menú` i `Configuració` segueixen l'aspecte nou: un botó verd envia una recepta a la llista, els àpats són fitxes més altes i les fletxes de `Configuració` es veuen millor.
- La barra mostra uns coberts per a `Receptes` i un llibre obert per a `Menú`, i les accions que esborren dades es veuen en vermell.
- Cada fila de `Configuració` comença amb una icona, i la capçalera de cada secció de la botiga mostra una icona del seu tipus: fruita, làctics, pa, neteja i altres.
- A `Menú`, la barra de la setmana mostra els seus dies i cada dia la seva data. Cada àpat diu si és una recepta o una anotació ràpida, i un àpat lliure mostra un ⊕.
- A `Receptes`, cada recepta mostra els seus productes i la marca «a la llista», i uns xips filtren les receptes: `Totes`, `A la llista` i `Amb enllaç`.

## 1.12.0 - 2026-11-03

- En una setmana passada de **Menú**, **Repetir aquesta setmana** copia els seus àpats a la setmana actual. Si te'n penedeixes, toca **Desfés**.

## 1.11.0 - 2026-11-03

- **Menú** comença buit cada dilluns. Amb les fletxes de dalt veus el menú de les setmanes anteriors, fins a 26 setmanes enrere.

## 1.10.2 - 2026-10-31

- A Novetats, els noms dels botons es veuen en negreta, sense asteriscs.

## 1.10.1 - 2026-10-30

- En una tauleta o un ordinador, els marges de la pantalla són els mateixos que a les altres apps: la llista, els panells i els fulls queden a la mateixa distància del menú lateral.

## 1.10.0 - 2026-10-30

- Una recepta amb enllaç mostra un botó ▶ al costat d’«Afegeix a Compra» que obre el vídeo a l’instant. A la fitxa de la recepta, una targeta damunt del camp Enllaç mostra «Mira el vídeo» i el web de l’enllaç, com youtube.com.

## 1.9.1 - 2026-10-27

- L'app torna a obrir-se després d'actualitzar a la 1.9.0 si l'obres des d'una drecera. Les actualitzacions arriben també per les dreceres.

## 1.9.0 - 2026-10-27

- Si comparteixes una llista, un article que és a la teva llista i a la compartida apareix ara en una sola fila a Totes, amb les dues etiquetes. Cada llista té el seu color. Un ajust nou tria si en marcar o treure aquesta fila canvia només la teva llista o les dues.

## 1.8.0 - 2026-10-26

- En pantalles amples, Configuració ja no mostra dues barres de desplaçament.
- En una tauleta, un plegable o un ordinador, les seccions són sempre a l'esquerra. En un ordinador, Bodega ocupa un marc centrat amb una barra lateral amb els noms de les seccions i el que encara has de comprar.
- En pantalles amples, Compra mostra el que queda a cada botiga i el que torna a la propera compra, i Menú el que afegeix «Omple cistella».
- El títol de la pestanya i de l'app instal·lada ara és «Llista de la compra - Bodega».
- En una tauleta o un ordinador, una recepta s'obre en un tauler al costat de la llista de receptes, i pots passar d'una a una altra sense tancar-lo.
- En una tauleta, un plegable o un ordinador, el botó per afegir és a la capçalera, i els fulls com Afegeix s'obren al costat de la llista sense tapar-la.
- En pantalles amples, Configuració mostra cada grup amb la seva explicació al costat.

## 1.7.1 - 2026-10-26

- Quan cerques a Compra, la llista es queda a dalt i ja no baixa fins al camp de cerca.
- Si et conviden a compartir una altra llista mentre comparteixes la teva, ara pots treure aquestes persones a la mateixa invitació i després acceptar-la.

## 1.7.0 - 2026-10-25

- Pots fer servir l'app sense compte: toca **Fes-la servir sense compte** a Inicia la sessió. Les teves llistes es queden en aquest dispositiu. Inicia la sessió més tard des de Configuració per sincronitzar-les.
- Ja no s'inicia la sessió amb correu i contrasenya. Si ho feies servir, inicia la sessió amb Google amb el mateix correu: conserves el teu compte i les teves llistes.

## 1.6.0 - 2026-10-25

- Quan acceptes una llista compartida, la teva llista es queda. A `Compra` veus les dues juntes: `Totes`, `La meva llista` i la llista de l’altra persona són xips a dalt, amb el que falta per comprar a cadascuna. A `Totes`, cada article diu de quina llista és, i el que afegeixes va a la teva llista. Si també comparteix receptes i menú, `Receptes` i `Menú` mostren els de les dues llistes, cadascun amb la seva llista: una recepta compartida envia els productes a la llista compartida.
- Quan convides algú a `Compartir lista`, tries què comparteixes: `Només Compra` o `Compra, Receptes i Menú`. Pots canviar-ho després amb un toc a la persona. Si algú rebutja la invitació o deixa de compartir, veus `Cancel·lada` i pots `Torna a convidar`.

## 1.5.0 - 2026-10-25

- Pots compartir la teva llista amb altres persones: a `Ajustes` › `Cuenta` › `Compartir lista` escriu el seu correu. Quan accepten, veuen i canvien la mateixa llista, les receptes i el menú als seus dispositius.

## 1.4.1 - 2026-10-24

- Si el servidor demana esperar uns segons en pujar una llista llarga, l’app no mostra «Sense connexió» i torna a provar-ho sola.
- A `Ajustes` › `Cuenta`, el correu i l’hora de l’última sincronització ja no se sobreposen en un telèfon: l’hora va sota el correu, i un correu llarg es trenca en diverses línies.
- La nota «Sense connexió» ja desapareix sola quan una sincronització arriba al servidor, també si el telèfon no avisa que ha recuperat la xarxa, i en tornar a l’app.

## 1.4.0 - 2026-10-24

- Inicia la sessió per tenir les llistes a tots els dispositius. Sol·licita accés amb el teu correu o amb Google; l’administrador aprova cada compte. Un canvi en un dispositiu arriba als altres en segons, i sense connexió els canvis es desen i s’envien després. Si ja tens una llista, continua al dispositiu, i l’avís `Inicia la sessió per sincronitzar` et porta a iniciar la sessió.
- `Configuració` › `Ajuda` › `Novetats` mostra què canvia en cada versió. Després d’una actualització, s’obre sola una vegada.
