# Notas da versão

O que muda para si em cada versão da app. A versão mais recente vem primeiro.

## Unreleased

- Quando inicia sessão com o Google entra logo: uma conta já não espera pela aprovação.

## 1.13.7 - 2026-11-14

- Em **Menu**, uma refeição cuja receita foi apagada noutro dispositivo já não conta como planeada. O cabeçalho, o resumo da semana, **Esvaziar o menu** e **Encher cesto** coincidem com o que vês.
- A política de privacidade descreve agora a lista partilhada e o início de sessão com o Google.

## 1.13.6 - 2026-11-13

- O Bodega tem um endereço novo: `bodega.polarisworks.duckdns.org`. Instala a app a partir daí e remove o ícone antigo. Com uma conta, as tuas listas voltam quando inicias sessão. Sem conta, passa-as com **Exportar** e **Importar** em **Definições**.
- A app Android 1.1.0 abre o endereço novo. Descarrega `bodega-1.1.0.apk` de github.com/polaris-works/shopping-list/releases e instala-a por cima da anterior. Começa vazia: inicia sessão para recuperares as tuas listas, ou usa **Importar**.

## 1.13.4 - 2026-11-13

- O Bodega também é uma app Android. Descarrega o ficheiro `bodega-1.0.0.apk` de github.com/polaris-works/shopping-list/releases e instala-o: vês as mesmas listas.

## 1.13.2 - 2026-11-09

- **Atualizar** em **Definições** volta a funcionar depois de uma versão que muda ficheiros da app de sítio. Antes podia dizer «Não foi possível atualizar.» mesmo com a versão nova pronta.

## 1.13.1 - 2026-11-09

- No telemóvel, **Compras** parece-se mais com o design: uma barra em cima com o botão **Terminar compras** (em vez dos três pontos), um dock com a loja à esquerda e sem setas, linhas mais altas com a quantidade maior, e **Comprados** aberto desde o início. Um artigo comprado já não mostra a pega: **Editar** continua ao deslizá-lo. A mensagem com **Anular** aparece em cima, com um visto.
- Em ecrãs largos, o cabeçalho de **Receitas** parece-se mais com o design: a pesquisa tem a sua própria linha, o botão **Filtros** mostra ou esconde os filtros, e por baixo do título vê-se se as receitas ficam neste dispositivo ou são sincronizadas.
- Em ecrãs largos, **Receitas** parece-se mais com o design: cada receita é um cartão com os botões em baixo, e o painel de uma receita tem o botão **Adicionar a Compras**, que diz quantos produtos adiciona. Em todos os ecrãs, uma receita mostra quantos dos seus produtos estão na lista e marca cada um com um ponto verde.
- Em **Menu**, em ecrãs mais largos do que um telemóvel, o painel **Semanas anteriores** mostra as três últimas semanas com refeições, cada uma com o botão **Repetir esta semana**. O cartão **Cesto automático** diz quantos produtos **Encher cesto** adiciona e substitui o painel **Para o cesto**.
- Em ecrãs largos, **Menu** fica mais parecido com o design: cada dia é um cartão, cada refeição mostra o seu tipo num quadrado e o seu estado numa pílula, e o resumo da semana tem uma barra de progresso.
- Em **Menu**, a seta › leva às próximas semanas, até quatro semanas à frente. Podes planear as suas refeições, encher o cesto com elas ou esvaziá-las, como na semana atual.
- Em ecrãs largos, **Definições** tem o design de computador: uma coluna centrada, com cada grupo sob o seu título.
- Em ecrãs largos, os botões de adicionar já não desaparecem ao abrir uma folha, e o cabeçalho e o menu lateral não se movem.
- Em ecrãs largos, os filtros de loja de **Compras** são mais baixos.
- Em ecrãs largos, **Receitas**, **Menu** e **Definições** ocupam toda a largura, como **Compras**.
- Em ecrãs largos, um pequeno cartão sob os painéis de **Compras** mostra quanto espaço as suas listas ocupam no dispositivo.
- Em ecrãs largos, os painéis de **Compras** seguem o design mais de perto: **Ver** tem uma seta, os nomes em **Próximas compras** são menos carregados e o botão que move tudo mostra um ícone de lista.
- Em ecrãs largos, o cabeçalho de **Compras** segue o design: sobre o fundo da página, um título maior, botões com cantos mais retos e lojas em letra mais pequena. O botão de adicionar diz **Adicionar**.
- Com um rato, o botão ⋮ de um artigo já não tapa a quantidade: tem o seu próprio lugar antes da pega.
- Com um rato, um clique num artigo de **Compras** abre **Editar**. Para o marcar como comprado, clica no círculo. Arrastar com o rato continua a mover o artigo. Com o dedo, tocar no artigo continua a marcá-lo.
- Em ecrãs largos de cerca de 1024 px, o título do cabeçalho já não é cortado: o campo de pesquisa fica mais estreito e, se for preciso, mostra só a lupa.
- Em ecrãs largos, a lista e os painéis de **Compras** seguem o design: mais espaço à volta da lista e entre os grupos, painéis mais largos, etiquetas e quantidades mais claras e uma barra verde mais grossa para cada receita.
- Cada secção tem o seu próprio endereço: `#/compra`, `#/recetas`, `#/menu` e `#/ajustes`. Ao recarregar continuas na mesma secção. O botão Voltar do telemóvel volta primeiro a **Compras** e depois sai da app.
- Em ecrãs largos, a barra lateral segue o design: um pouco mais larga, a secção atual com um fundo mais marcado e uma barra verde, o número de artigos numa pílula e o estado da sincronização por baixo de uma linha.
- Com um teclado: de 1 a 4 abrem as secções, N adiciona e / pesquisa. Num artigo selecionado, a tecla de menu ou Shift+F10 mostra as suas ações e Delete elimina-o.
- Com um rato, clica com o botão direito num artigo ou usa o seu botão ⋮ para ver as suas ações. Arrastar o cabeçalho com o rato já não muda de secção.
- Em **Receitas**, cada produto que adicionas começa com maiúscula: «arroz» fica guardado como «Arroz».
- Em ecrãs largos, **Compras** ocupa toda a largura. A barra lateral tem um fundo suave, uma linha de estado por baixo de **Bodega**, o botão para adicionar e, em baixo, um cartão com o estado da sincronização.
- Em ecrãs largos, as linhas de **Compras** seguem o desenho: nome mais compacto, «em cada compra» ao lado do nome e a quantidade em letra de largura fixa. Cada grupo diz quantos artigos lhe faltam («3 art.»). O lápis de cada linha é agora uma pega de seis pontos; um toque abre **Editar**.
- O cabeçalho de **Compras** diz a verde quanto falta comprar, sem barra. Em ecrãs largos tem um campo de pesquisa (abre com Ctrl+K ou ⌘K), o botão **Terminar compras** e as lojas por baixo do título.
- Em **Compras**, podes adiar um produto para a próxima compra: desliza a linha ou usa **Adiar** em **Editar**. Em ecrãs largos, **Próximas compras** lista-os com um + para os trazer, e **Receitas na lista** mostra quantos ingredientes de cada receita já tens.
- Em **Compras**, o nome de cada produto tem mais espaço: é cortado menos e ocupa menos linhas.
- Cores novas: um fundo de papel quente com linhas cinza-esverdeadas suaves, no tema claro e no escuro.
- Em **Compras**, o nome de cada produto ocupa uma linha, e a quantidade é uma etiqueta suave.
- Em **Compras**, os produtos comprados ficam num cartão próprio, sob uma marca de feito.
- Os botões em baixo de **Compras** flutuam sobre a lista, e o aviso depois de marcar é escuro.
- **Editar** mostra cada campo como uma caixa com o nome dentro, o interruptor de repetir como um cartão, e as lojas como etiquetas que adicionas com + e tiras com ×.
- Em **Receitas**, os botões de uma receita ficam ao lado do nome, e os produtos ocupam toda a largura do cartão.
- **Menu** mostra quantas refeições da semana estão planeadas e quantas livres, um ícone em cada refeição para uma receita ou um prato, e um calendário na semana.
- **Definições** mostra um ícone em cada grupo, marca **Apagar todos os dados** como irreversível e explica **Instalar a aplicação**.
- Num ecrã largo, a secção atual destaca-se com uma barra verde, e cada grupo de **Compras** tem o título dentro do seu cartão.

## 1.13.0 - 2026-11-05

- A app muda-se para `bodega.artisandevs.duckdns.org`. No endereço antigo, **Mover os meus dados** copia a tua lista para o novo; com conta, envia primeiro as tuas alterações e depois inicias sessão lá.

## 1.12.1 - 2026-11-03

- Um novo visual: fundo de papel quente, a letra Hanken Grotesk maior, caixas redondas e um verde-esmeralda para os artigos comprados e a ação principal.
- `Receitas`, `Menu` e `Definições` seguem o novo visual: um botão verde envia uma receita para a lista, as refeições são cartões mais altos e as setas de `Definições` veem-se melhor.
- A barra mostra talheres para `Receitas` e um livro aberto para `Menu`, e as ações que apagam dados aparecem a vermelho.
- Cada linha de `Definições` começa com um ícone, e o cabeçalho de cada secção da loja mostra um ícone do seu tipo: fruta, laticínios, pão, limpeza e outros.
- Em `Menu`, a barra da semana mostra os seus dias e cada dia a sua data. Cada refeição diz se é uma receita ou uma nota rápida, e uma refeição livre mostra um ⊕.
- Em `Receitas`, cada receita mostra os seus produtos e a marca «na lista», e uns chips filtram as receitas: `Todas`, `Na lista` e `Com ligação`.

## 1.12.0 - 2026-11-03

- Numa semana anterior do **Menu**, **Repetir esta semana** copia as refeições para a semana atual. Se mudares de ideias, toca em **Anular**.

## 1.11.0 - 2026-11-03

- **Menu** começa vazio a cada segunda-feira. Com as setas no topo vês o menu das semanas anteriores, até 26 semanas atrás.

## 1.10.2 - 2026-10-31

- Em Novidades, os nomes dos botões aparecem a negrito, sem asteriscos.

## 1.10.1 - 2026-10-30

- Num tablet ou num computador, as margens do ecrã são as mesmas das outras apps: a lista, os painéis e as folhas ficam à mesma distância do menu lateral.

## 1.10.0 - 2026-10-30

- Uma receita com ligação mostra um botão ▶ ao lado de «Adicionar a Compras» que abre o vídeo de imediato. Na ficha da receita, um cartão acima do campo Ligação mostra «Ver vídeo» e o site da ligação, como youtube.com.

## 1.9.1 - 2026-10-27

- A app volta a abrir depois da atualização para a 1.9.0 quando a abres a partir de um atalho. As atualizações chegam agora também pelos atalhos.

## 1.9.0 - 2026-10-27

- Se partilhas uma lista, um artigo que está na tua lista e na partilhada aparece agora numa só linha em Todas, com as duas etiquetas. Cada lista tem a sua cor. Uma nova definição escolhe se marcar ou eliminar essa linha muda só a tua lista ou as duas.

## 1.8.0 - 2026-10-26

- Em ecrãs largos, as Definições já não mostram duas barras de deslocamento.
- Num tablet, num dobrável ou num computador, as secções ficam sempre à esquerda. No computador, a Bodega fica numa moldura centrada com uma barra lateral com os nomes das secções e o que ainda tens de comprar.
- Em ecrãs largos, Compras mostra o que falta em cada loja e o que volta nas próximas compras, e Menu o que «Encher cesto» adiciona.
- O título do separador e da app instalada é agora «Lista de compras - Bodega».
- Num tablet ou num computador, uma receita abre num painel ao lado da lista de receitas, e podes passar de uma para outra sem o fechar.
- Num tablet, num dobrável ou num computador, o botão para adicionar está no cabeçalho, e as folhas como Adicionar abrem ao lado da lista sem a tapar.
- Em ecrãs largos, as Definições mostram cada grupo com a sua explicação ao lado.

## 1.7.1 - 2026-10-26

- Ao pesquisar em Compras, a lista fica no topo e já não desce até ao campo de pesquisa.
- Se alguém te convidar a partilhar a lista enquanto partilhas a tua, agora podes remover essas pessoas no próprio convite e depois aceitá-lo.

## 1.7.0 - 2026-10-25

- Podes usar a app sem conta: toca em **Usar sem conta** em Iniciar sessão. As tuas listas ficam neste dispositivo. Inicia sessão mais tarde nas Definições para as sincronizar.
- Já não há início de sessão com email e palavra-passe. Se o usavas, inicia sessão com o Google com o mesmo email: manténs a tua conta e as tuas listas.

## 1.6.0 - 2026-10-25

- Quando aceitas uma lista partilhada, a tua própria lista fica. Em `Compras` vês as duas lado a lado: `Todas`, `A minha lista` e a lista da outra pessoa são chips em cima, cada uma com o que falta comprar. Em `Todas`, cada artigo mostra a sua lista, e o que adicionas vai para a tua lista. Se as receitas e o menu também forem partilhados, `Receitas` e `Menu` mostram os das duas listas, cada um com a sua lista: uma receita partilhada envia os produtos para a lista partilhada.
- Quando convidas alguém em `Compartir lista`, escolhes o que partilhas: `Só Compras` ou `Compras, Receitas e Menu`. Podes mudar depois com um toque na pessoa. Se alguém recusar o convite ou deixar de partilhar, vês `Cancelada` e podes `Convidar de novo`.

## 1.5.0 - 2026-10-25

- Podes partilhar a tua lista com outras pessoas: em `Ajustes` › `Cuenta` › `Compartir lista` escreve o email delas. Quando aceitam, veem e alteram a mesma lista, as receitas e o menu nos seus dispositivos.

## 1.4.1 - 2026-10-24

- Se o servidor pedir para esperar alguns segundos ao enviar uma lista longa, a app já não mostra «Sem ligação» e tenta de novo sozinha.
- Em `Definições` › `Conta`, o e-mail e a hora da última sincronização já não se sobrepõem num telemóvel: a hora fica por baixo do e-mail, e um e-mail longo passa para várias linhas.
- A nota «Sem ligação» agora desaparece sozinha quando uma sincronização chega ao servidor, mesmo que o telemóvel não avise que a rede voltou, e ao voltar à app.

## 1.4.0 - 2026-10-24

- Inicie sessão para ter as suas listas em todos os seus dispositivos. Peça acesso com o seu email ou com o Google; o administrador aprova cada conta. Uma alteração num dispositivo chega aos outros em segundos, e sem ligação as alterações ficam guardadas e são enviadas depois. Se já tem uma lista, ela fica no dispositivo, e o aviso `Inicie sessão para sincronizar` leva-o ao início de sessão.
- `Definições` › `Ajuda` › `Novidades` mostra o que muda em cada versão. Depois de uma atualização, abre-se sozinha uma vez.
