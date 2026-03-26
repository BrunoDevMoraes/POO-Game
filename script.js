document.addEventListener('DOMContentLoaded', () => {
  // Elementos da UI
  const codeEditor = document.getElementById('code-editor');

  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      const spaces = '  ';
      codeEditor.value =
        codeEditor.value.substring(0, start) +
        spaces +
        codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd =
        start + spaces.length;
    }
  });

  const battleBtn = document.getElementById('battle-btn');
  const battleLog = document.getElementById('battle-log');
  const missionTitle = document.getElementById('mission-title');
  const missionDescription = document.getElementById('mission-description');
  const attackButtonsContainer = document.getElementById('attack-buttons');

  // Telas
  const welcomeScreen = document.getElementById('welcome-screen');
  const saveFoundScreen = document.getElementById('save-found-screen'); // NOVO
  const startScreen = document.getElementById('start-screen');
  const mapScreen = document.getElementById('map-screen');
  const gameScreen = document.getElementById('game-screen');
  const allyModal = document.getElementById('ally-modal');
  const winScreen = document.getElementById('win-screen');
  const itemQuizModal = document.getElementById('item-quiz-modal');

  // Botões
  const playGameBtn = document.getElementById('play-game-btn');
  const continueGameBtn = document.getElementById('continue-game-btn'); // NOVO
  const restartSaveBtn = document.getElementById('restart-save-btn'); // NOVO
  const returnToMapBtn = document.getElementById('return-to-map-btn');
  const battleWonBtn = document.getElementById('battle-won-btn');
  const closeAllyModalBtn = document.getElementById('close-ally-modal-btn');
  const restartGameBtn = document.getElementById('restart-game-btn');
  const closeQuizModalBtn = document.getElementById('close-quiz-modal-btn');

  // Elementos do Mapa
  const mapGrid = document.getElementById('map-grid');
  const mapMessage = document.getElementById('map-message');
  const winSprite = document.getElementById('win-sprite');

  // Elementos do Modal do Aliado
  const allyTip = document.getElementById('ally-tip');
  const allyPageIndicator = document.getElementById('ally-page-indicator');
  const allyPaginationControls = document.getElementById(
    'ally-pagination-controls',
  );
  const allyPrevBtn = document.getElementById('ally-prev-btn');
  const allyNextBtn = document.getElementById('ally-next-btn');

  // Elementos do Quiz
  const quizModalBorder = document.getElementById('item-quiz-modal-border');
  const quizModalTitle = document.getElementById('quiz-modal-title');
  const quizQuestion = document.getElementById('quiz-question');
  const quizOptions = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');

  // Variáveis de estado
  let currentLevel = 0;
  let playerMonster, enemyMonster;
  let chosenPooketmonData = null;
  let isCreationMode = false;
  let savedCreationCode = null;
  let savedLevel2Code = null;
  let savedLevel3Code = null;
  let savedLevel4Code = null;
  let pooketmonCreated = false;
  let collectedItemIds = [];

  // Variáveis para Rastrear Bônus de Itens
  let accumulatedHpBonus = 0;
  let accumulatedDanoBonus = 0;

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Estado da Paginação do Aliado
  let currentAllyPage = 0;
  let currentAllyDialogue = [];

  // Lógica de Inicialização
  function checkSaveOnStartup() {
    if (localStorage.getItem('pooketSave')) {
      welcomeScreen.classList.add('hidden');
      saveFoundScreen.classList.remove('hidden');
    }
  }
  checkSaveOnStartup();

  function saveGame() {
    const gameState = {
      currentLevel,
      chosenPooketmonData,
      enemiesDefeated,
      playerPosition,
      currentRoomId,
      accumulatedHpBonus,
      accumulatedDanoBonus,
      pooketmonCreated,
      savedCreationCode,
      savedLevel2Code,
      savedLevel3Code,
      savedLevel4Code,
      collectedItemIds,
    };
    localStorage.setItem('pooketSave', JSON.stringify(gameState));
    console.log('Jogo Salvo!');
  }

  function loadGame() {
    const saved = localStorage.getItem('pooketSave');
    if (!saved) return false;
    try {
      const state = JSON.parse(saved);
      currentLevel = state.currentLevel;
      chosenPooketmonData = state.chosenPooketmonData;
      enemiesDefeated = state.enemiesDefeated;
      playerPosition = state.playerPosition;
      currentRoomId = state.currentRoomId;
      accumulatedHpBonus = state.accumulatedHpBonus;
      accumulatedDanoBonus = state.accumulatedDanoBonus;
      pooketmonCreated = state.pooketmonCreated;
      savedCreationCode = state.savedCreationCode;
      savedLevel2Code = state.savedLevel2Code;
      savedLevel3Code = state.savedLevel3Code;
      savedLevel4Code = state.savedLevel4Code;
      collectedItemIds = state.collectedItemIds || [];

      restoreMapState();
      return true;
    } catch (e) {
      console.error('Erro ao carregar save:', e);
      return false;
    }
  }

  function restoreMapState() {
    // Remove itens já coletados do mapa visual
    // Itera sobre todas as salas (chaves do ROOM_DATA)
    Object.keys(ROOM_DATA).forEach((roomId) => {
      const room = ROOM_DATA[roomId];
      for (let y = 0; y < room.layout.length; y++) {
        for (let x = 0; x < room.layout[y].length; x++) {
          const tile = room.layout[y][x];
          if (collectedItemIds.includes(tile)) {
            room.layout[y][x] = '_';
          }
        }
      }
    });
  }

  const STARTER_POOKETMONS = {
    flamos: {
      name: 'Flamos',
      sprite: 'assets/fogo1.png',
      baseHealth: 100,
      attacks: [
        { name: 'Brasa', dano: 15 },
        { name: 'Arranhão', dano: 10 },
      ],
      evolutionName: 'Infernix',
      evolutionSprite: 'assets/fogo2.png',
      finalSprite: 'assets/fogo3.png',
      evolutionAttacks: [
        { name: 'Lança-chamas', dano: 40 },
        { name: 'Garra de Fogo', dano: 30 },
      ],
    },
    aquaz: {
      name: 'Aquaz',
      sprite: 'assets/agua1.png',
      baseHealth: 100,
      attacks: [
        { name: "Jato d'Água", dano: 15 },
        { name: 'Mordida', dano: 11 },
      ],
      evolutionName: 'Leviata',
      evolutionSprite: 'assets/agua2.png',
      finalSprite: 'assets/agua3.png',
      evolutionAttacks: [
        { name: 'Hidro-bomba', dano: 42 },
        { name: 'Cauda de Água', dano: 28 },
      ],
    },
    folion: {
      name: 'Folion',
      sprite: 'assets/planta1.png',
      baseHealth: 100,
      attacks: [
        { name: 'Folha Navalha', dano: 15 },
        { name: 'Chicote de Cipó', dano: 12 },
      ],
      evolutionName: 'Arborath',
      evolutionSprite: 'assets/planta2.png',
      finalSprite: 'assets/planta3.png',
      evolutionAttacks: [
        { name: 'Raio Solar', dano: 45 },
        { name: 'Espinhos', dano: 25 },
      ],
    },
  };

  const levels = [
    {
      title: 'Nível 1: Classes e Objetos',
      description:
        'Vamos começar! Defina a classe `Monstro`. No construtor, receba `nome`, `vida` e `ataques` e armazene-os usando `this`. Por fim, crie a instância do seu POOketmon.',
      starterCodeTemplate: (
        pooket,
      ) => `// Olá, ${pooket.name}! Bem-vindo ao laboratório.
    // Para criar um POOketmon, precisamos de sua "planta" (Classe).

    // 1. Declare uma nova classe chamada 'Monstro'.

    // 2. Toda classe precisa de um 'constructor' para ser criada.
    //    O nosso deve aceitar os parâmetros básicos: 'nome', 'vida', 'ataques'.

    // 3. Dentro do constructor, o objeto precisa "lembrar" quem ele é.
    //    Use 'this' para guardar os parâmetros que você recebeu.

    // 4. Também precisamos de um atributo extra para a batalha:
    //    - 'vidaMaxima' (deve ser o mesmo valor inicial de 'vida')
    //    (O 'sprite' será adicionado por nós!)

    // 5. Agora, fora da classe, você precisa "construir" o seu monstro.
    //    Declare uma variável chamada 'meuMonstro'.

    // 6. Atribua a ela uma *nova instância* da sua classe Monstro por meio de *new Monstro(...)*
    //    No lugar de ... passe os valores do seu ${pooket.name}:
    //    - Nome: "${pooket.name}"
    //    - Vida: ${pooket.baseHealth} (Deve estar entre 70 e 100)
    //    - Ataques (Defina APENAS UM ataque com dano entre 15 e 20):
    //      [ { nome: "${pooket.attacks[0].name}", dano: ${pooket.attacks[0].dano} } ]

    // Boa sorte, programador!

    `,
      enemyCode: `new Monstro("Britix", 80, [{ nome: "Pancada", dano: 12 }])`,
      enemySprite: 'assets/inimigo1_pedra.png',
      validation: (player) =>
        player.vida > 0 && player.nome === chosenPooketmonData.name,
      successMessage:
        'Você criou seu monstro! `this` é usado para definir os atributos de uma instância.',
    },
    {
      title: 'Nível 2: Métodos com Parâmetros',
      description:
        'Seu monstro precisa atacar! Crie um método `atacar(alvo, ataqueEscolhido)`. Ele deve reduzir a vida do `alvo` baseado no `dano` do `ataqueEscolhido`.',
      starterCodeTemplate: (pooket) =>
        `// ADICIONE O MÉTODO atacar(alvo, ataqueEscolhido) DENTRO DA CLASSE Monstro\n// DICA: Acesse a vida usando 'alvo.vida' e o dano usando 'ataqueEscolhido.dano'.\n`,
      enemyCode: `new Monstro("Britorix", 150, [{ nome: "Esmagar", dano: 20 }, { nome: "Arremessar Pedra", dano: 15 }])`,
      enemySprite: 'assets/inimigo2_pedra.png',
      validation: (player) =>
        player.vida > 0 && typeof player.atacar === 'function',
      successMessage:
        'Excelente! Métodos definem o comportamento dos seus objetos.',
    },
    {
      title: 'Nível 3: Herança',
      description:
        'Hora de evoluir! Crie a classe `${pooket.evolutionName}` usando `extends Monstro`. No `constructor`, chame `super()` com a vida e ataque. Crie um método para adicionar um novo ataque. Por fim, instancie a evolução e adicione um novo ataque à ela.',
      starterCodeTemplate: (pooket) =>
        `// 1. Crie a classe ${
          pooket.evolutionName
        } que estende (extends) a classe Monstro.\n// 2. No constructor, use super(nome, ${
          pooket.baseHealth + 50
        }, [...]) para passar a vida e ataque.\n// 3. O atributo ataques é um array (lista), crie um método para adicionar um novo ataque à esta lista: adicionaAtaque(nome, dano)\n//    (Novos ataques sugeridos: ${pooket.evolutionAttacks
          .map((a) => a.name)
          .join(
            ', ',
          )})\n// 4. Crie a instância da evolução: const meuMonstroEvoluido = new ${
          pooket.evolutionName
        }("${
          pooket.evolutionName
        }");\n// 5. Utilize meuMonstroEvoluido.adicionaAtaque("Ataque Especial", 40);\n`,
      enemyCode: `new Monstro("Britadorix", 200, [{ nome: "Racha Crânio", dano: 40 }])`,
      enemySprite: 'assets/inimigo3_pedra.png',
      validation: (player) => {
        if (player.vida <= 0) return false;
        if (player.constructor.name !== chosenPooketmonData.evolutionName) {
          throw new Error(
            `A classe de evolução deve se chamar '${chosenPooketmonData.evolutionName}' (e não '${player.constructor.name}').`,
          );
        }
        if (!player.ataques || player.ataques.length < 2) {
          throw new Error(
            'Você não adicionou o novo ataque na instância! Use o método que você criou (ex: meuMonstroEvoluido.addMove(...)).',
          );
        }
        return true;
      },
      successMessage:
        'Perfeito! A herança permite reutilizar código e criar especializações.',
    },
    {
      title: 'Nível 4: Polimorfismo',
      description:
        'Polimorfismo! Sua evolução ganhou um poder vampírico. Vá até a classe `${pooket.evolutionName}`, sobrescreva o método `atacar` para causar dano E curar seu monstro em 50% do dano causado.',
      starterCodeTemplate: (pooket) =>
        `// 1. Encontre a classe ${pooket.evolutionName} no seu código acima.\n// 2. Dentro dela, escreva o método atacar(alvo, ataqueEscolhido).\n// 3. Implemente a lógica: reduza a vida do alvo (dano normal) e aumente a sua vida (this.vida) em metade do dano.\n`,
      enemyCode: `new Monstro("Phantom", 180, [{ nome: "Soco Fantasma", dano: 50 }])`,
      enemySprite: 'assets/inimigo4_fantasma.png',
      validation: (player) => {
        if (player.vida <= 0) return false;
        if (player.constructor.name !== chosenPooketmonData.evolutionName) {
          throw new Error(
            `Você deve modificar a classe '${chosenPooketmonData.evolutionName}', não criar outra!`,
          );
        }
        const proto = Object.getPrototypeOf(player);
        if (!proto.hasOwnProperty('atacar')) {
          throw new Error(
            `O método 'atacar' não foi encontrado dentro da classe ${chosenPooketmonData.evolutionName}. Certifique-se de escrevê-lo dentro da classe!`,
          );
        }
        return true;
      },
      successMessage:
        'Fantástico! Você sobrescreveu o método herdado e alterou seu comportamento. Isso é Polimorfismo!',
    },
  ];

  const ROOM_DATA = {
    introRoom: {
      layout: [
        ['W', 'W', 'D', 'W', 'W'],
        ['W', '_', '_', 'A_INTRO', 'W'],
        ['W', '_', 'P', '_', 'W'],
        ['W', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        { x: 2, y: 0, targetRoomId: 'labRoom', targetX: 1, targetY: 3 },
      ],
    },
    labRoom: {
      layout: [
        ['W', 'W', 'W', 'W', 'W', 'W'],
        ['W', '_', '_', '_', 'S', 'W'],
        ['W', '_', '_', '_', '_', 'W'],
        ['W', 'D', 'W', 'D', 'W', 'W'],
      ],
      portals: [
        {
          x: 3,
          y: 3,
          targetRoomId: 'hubRoom',
          targetX: 1,
          targetY: 1,
          requiresPooketmonCreation: true,
        },
        { x: 1, y: 3, targetRoomId: 'introRoom', targetX: 2, targetY: 2 },
      ],
    },
    hubRoom: {
      layout: [
        ['W', 'D', 'W', 'W', 'W'],
        ['W', '_', '_', '_', 'W'],
        ['W', '_', '_', '_', 'W'],
        ['W', '_', 'D', '_', 'W'],
        ['W', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        { x: 1, y: 0, targetRoomId: 'labRoom', targetX: 3, targetY: 2 },
        { x: 2, y: 3, targetRoomId: 'meadow', targetX: 4, targetY: 6 },
      ],
    },
    meadow: {
      layout: [
        ['W', 'W', 'W', 'W', 'D', 'W', 'W', 'W', 'W', 'W'],
        ['W', '_', '_', '_', '_', '_', '_', '_', 'H0', 'W'],
        ['W', 'A0', '_', 'W', 'W', '_', '_', 'S0', '_', 'W'],
        ['W', '_', '_', '_', '_', '_', '_', '_', '_', 'W'],
        ['W', '_', '_', '_', 'E0', '_', '_', '_', '_', 'W'],
        ['W', '_', '_', '_', '_', '_', '_', '_', '_', 'W'],
        ['W', 'W', 'W', 'W', 'D', 'W', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        {
          x: 4,
          y: 0,
          targetRoomId: 'forestPath',
          targetX: 1,
          targetY: 4,
          requiresEnemy: 0,
        },
        { x: 4, y: 6, targetRoomId: 'hubRoom', targetX: 2, targetY: 2 },
      ],
    },
    forestPath: {
      layout: [
        ['W', 'D', 'W', 'W', 'W', 'W'],
        ['W', '_', 'W', 'W', 'A1', 'W'],
        ['W', '_', '_', '_', '_', 'W'],
        ['W', '_', 'W', 'W', 'E1', 'W'],
        ['W', 'D', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        {
          x: 1,
          y: 0,
          targetRoomId: 'deepForest',
          targetX: 1,
          targetY: 1,
          requiresEnemy: 1,
        },
        { x: 1, y: 4, targetRoomId: 'meadow', targetX: 4, targetY: 1 },
      ],
    },
    deepForest: {
      layout: [
        ['W', 'D', 'W', 'W', 'W', 'W', 'W'],
        ['W', '_', '_', '_', '_', 'S1', 'W'],
        ['W', 'W', 'W', '_', 'W', 'W', 'W'],
        ['W', 'A2', '_', '_', '_', 'A4', 'W'],
        ['W', 'W', 'W', '_', 'W', 'W', 'W'],
        ['W', '_', '_', '_', 'E2', '_', 'W'],
        ['W', 'W', 'D', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        {
          x: 1,
          y: 0,
          targetRoomId: 'forestPath',
          targetX: 1,
          targetY: 1,
        },
        {
          x: 2,
          y: 6,
          targetRoomId: 'castleApproach',
          targetX: 1,
          targetY: 5,
          requiresEnemy: 2,
        },
      ],
    },
    castleApproach: {
      layout: [
        ['W', 'W', 'W', 'D', 'W', 'W', 'W'],
        ['W', '_', '_', '_', '_', 'H1', 'W'],
        ['W', '_', '_', 'W', 'W', '_', 'W'],
        ['W', '_', 'A3', '_', '_', '_', 'W'],
        ['W', '_', '_', '_', 'E3', '_', 'W'],
        ['W', 'D', '_', '_', '_', '_', 'W'],
        ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ],
      portals: [
        {
          x: 3,
          y: 0,
          targetRoomId: 'castleGate',
          targetX: 2,
          targetY: 1,
          requiresEnemy: 3,
        },
        {
          x: 1,
          y: 5,
          targetRoomId: 'deepForest',
          targetX: 2,
          targetY: 5,
        },
      ],
    },
    castleGate: {
      layout: [
        ['W', 'W', 'C', 'W', 'W'],
        ['W', '_', '_', '_', 'W'],
        ['W', '_', '_', '_', 'W'],
        ['W', 'W', 'D', 'W', 'W'],
      ],
      portals: [
        {
          x: 2,
          y: 3,
          targetRoomId: 'castleApproach',
          targetX: 3,
          targetY: 1,
        },
      ],
    },
  };

  const TILE_ICONS = {
    W: '🧱',
    _: '',
    P: '😎',
    C: '🏰',
    D: '🚪',
    S: '👨‍🔬',
    A_INTRO: '🧙',
    E0: '👺',
    E1: '🗿',
    E2: '🤺',
    E3: '🔩',
    A0: '🧙',
    A1: '🧙',
    A2: '🧙',
    A3: '🧙',
    A4: '🧙',
    H0: '💖',
    H1: '💖',
    S0: '⚔️',
    S1: '⚔️',
  };

  const ALLY_TIPS = {
    A_INTRO: [
      'Olá, estudante! Bem-vindo! Em breve, o Cientista Chefe 👨‍🔬 pedirá que você crie seu próprio POOketmon.',
      "Para isso, você usará uma **Classe** de JavaScript. Pense em uma Classe como uma 'forma de biscoito'. Ela define a *estrutura* (como 'nome' e 'vida').",
      "Aqui está a sintaxe básica em JavaScript:<br><br><code class='text-cyan-300' style='text-align: left; display: inline-block;'>class NomeDaClasse {<br>  constructor(parametro1) {<br>    this.propriedade = parametro1;<br>  }<br>}</code>",
      "O 'biscoito' que você cria dela é o **Objeto**.<br><br><code class='text-cyan-300' style='text-align: left; display: inline-block;'>const meuBiscoito = new Biscoito('Cookie', [{ farinha: 100, ovo: 1, chocolate: 300 }])</code><br><br>Você usará a palavra-chave `class` (para definir a forma) e `constructor` (o que 'monta' o objeto) para começar. Com a palavra `new` seguida do nome da Classe você indica que quer criar um novo Objeto.",
      'Sinta-se à vontade para copiar trechos de código dos conselhos, caso considere proveitoso!',
    ],
    A0: 'Olá, jovem treinador! Lembre-se: uma **Classe** é como a planta de uma casa. Um **Objeto** (ou instância) é a casa construída a partir dessa planta. Você pode construir várias casas (objetos) da mesma planta (classe)!',
    A1: [
      "Vejo que está forte! Sabia que **Métodos** são como as 'ações' de um objeto? Ao definir um método na sua classe, você dá a *todos* os monstros dessa classe uma nova habilidade.",
      'Para criar um método, você o escreve dentro da classe, mas **fora** do `constructor`. Diferente de funções normais, você não precisa escrever a palavra `function`.',
      "Aqui está a sintaxe para criar um método:<br><br><code class='text-yellow-300' style='text-align: left; display: inline-block;'>class Monstro {<br>  constructor(...) { ... }<br><br>  nomeDoMetodo(alvo) {<br>    // O código da ação vai aqui<br>    console.log('Ataquei!');<br>  }<br>}</code>",
    ],
    A2: [
      "A **Herança** é um superpoder da POO! Ela permite que você crie uma classe 'Evolução' (Filha) baseada na classe 'Monstro' (Mãe).",
      'Isso economiza tempo: a Filha ganha automaticamente toda a vida e os ataques da Mãe. Para fazer isso, usamos a palavra-chave `extends`.',
      'O segredo está no `constructor`: a classe Filha precisa chamar `super()` para ativar o construtor da Mãe. Se você esquecer do `super()`, a herança quebra!',
      "Aqui está a sintaxe de Herança:<br><br><code class='text-purple-300' style='text-align: left; display: inline-block;'>class Evolucao extends Monstro {<br>  constructor(nome) {<br>    super(nome, 150, [...]);<br>  }<br>}</code>",
    ],
    A3: "O **Polimorfismo** é um pilar da POO! Significa 'muitas formas'. Permite que uma classe filha 'sobrescreva' (override) um método da classe mãe, dando a ele um comportamento totalmente novo, mesmo que tenha o *mesmo nome*.",
    A4: [
      'Psiu! Quer aprender um truque para lidar com listas (Arrays)? 🎒',
      'Imagine que você tem uma lista de itens, como uma mochila. Para colocar um item novo nela, usamos o comando `.push()`.',
      "Veja este exemplo simples:<br><br><code class='text-pink-300' style='text-align: left; display: inline-block;'>let mochila = ['Poção', 'Mapa'];<br><br>// Adiciona 'Espada' ao final da lista<br>mochila.push('Espada');</code>",
      "Isso 'empurra' o novo item para o final da lista. Você pode usar essa mesma lógica para adicionar novos ataques à lista do seu monstro!",
    ],
  };

  const ITEM_QUIZZES = {
    H0: {
      question:
        "Em POO, qual pilar se refere a 'esconder' a complexidade interna de um objeto e expor apenas as operações necessárias?",
      options: [
        { text: 'Herança', isCorrect: false },
        { text: 'Polimorfismo', isCorrect: false },
        { text: 'Encapsulamento', isCorrect: true },
        { text: 'Abstração', isCorrect: false },
      ],
      correctFeedback: 'Correto! Encapsulamento protege os dados.',
      incorrectFeedback: 'Incorreto. A resposta era Encapsulamento.',
    },
    H1: {
      question:
        'Qual palavra-chave (keyword) é usada em muitas linguagens para criar uma nova *instância* (objeto) de uma *classe*?',
      options: [
        { text: 'new', isCorrect: true },
        { text: 'create', isCorrect: false },
        { text: 'build', isCorrect: false },
        { text: 'this', isCorrect: false },
      ],
      correctFeedback: 'Exato! `new` é usado para criar novos objetos.',
      incorrectFeedback: 'Quase! A palavra-chave comum é `new`.',
    },
    S0: {
      question:
        "Qual pilar da POO permite que uma classe 'filha' herde características e comportamentos de uma classe 'mãe'?",
      options: [
        { text: 'Encapsulamento', isCorrect: false },
        { text: 'Herança', isCorrect: true },
        { text: 'Polimorfismo', isCorrect: false },
        { text: 'Abstração', isCorrect: false },
      ],
      correctFeedback: 'Correto! Herança (`extends`) permite reuso de código.',
      incorrectFeedback: 'Incorreto. A resposta é Herança.',
    },
    S1: {
      question:
        'Quando uma classe filha fornece sua própria implementação para um método que já existe na classe mãe, isso é chamado de...?',
      options: [
        { text: 'Sobrecarga (Overloading)', isCorrect: false },
        { text: 'Encapsulamento', isCorrect: false },
        { text: 'Sobrescrita (Overriding)', isCorrect: true },
        { text: 'Construção (Constructing)', isCorrect: false },
      ],
      correctFeedback: 'Exato! Isso é Sobrescrita, um exemplo de Polimorfismo.',
      incorrectFeedback: 'Quase! O termo correto é Sobrescrita (Overriding).',
    },
  };

  let playerPosition = { x: 2, y: 2 };
  let currentRoomId = 'introRoom';
  let enemiesDefeated = [false, false, false, false];
  let mapMessageTimeout;

  function initializeMap() {
    if (ROOM_DATA.introRoom.layout[2][2] === 'P') {
      ROOM_DATA.introRoom.layout[2][2] = '_';
    }

    renderMap();
    mapScreen.classList.remove('hidden');

    document.removeEventListener('keydown', handleMapMovement);
    document.addEventListener('keydown', handleMapMovement);
  }

  function renderMap() {
    mapGrid.innerHTML = '';
    const room = ROOM_DATA[currentRoomId];
    if (!room) {
      console.error('Sala não encontrada:', currentRoomId);
      return;
    }
    const layout = room.layout;
    mapGrid.style.gridTemplateColumns = `repeat(${layout[0].length}, 50px)`;
    mapGrid.style.gridTemplateRows = `repeat(${layout.length}, 50px)`;
    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y].length; x++) {
        const tile = document.createElement('div');
        tile.className = 'map-tile';
        let tileType = layout[y][x];
        if (x === playerPosition.x && y === playerPosition.y) {
          tile.textContent = TILE_ICONS['P'];
          tile.classList.add('player');
        } else {
          if (tileType.startsWith('E')) {
            const enemyIndex = parseInt(tileType[1]);
            if (enemiesDefeated[enemyIndex]) tileType = '_';
          }
          tile.textContent = TILE_ICONS[tileType] || '';
          if (tileType === 'W') tile.classList.add('wall');
          if (tileType === 'D') tile.classList.add('door');
          if (tileType === 'S') tile.classList.add('scientist');
          if (tileType.startsWith('E')) tile.classList.add('enemy');
          if (tileType.startsWith('A')) tile.classList.add('ally');
          if (tileType === 'C') tile.classList.add('goal');
          if (tileType.startsWith('H')) tile.classList.add('item-health');
          if (tileType.startsWith('S')) tile.classList.add('item-strength');
        }
        mapGrid.appendChild(tile);
      }
    }
  }

  function handleMapMovement(event) {
    if (
      mapScreen.classList.contains('hidden') ||
      !allyModal.classList.contains('hidden') ||
      !itemQuizModal.classList.contains('hidden') ||
      !startScreen.classList.contains('hidden') ||
      !saveFoundScreen.classList.contains('hidden')
    ) {
      return;
    }
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        movePlayer(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        movePlayer(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePlayer(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePlayer(1, 0);
        break;
    }
  }

  function movePlayer(dx, dy) {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    clearTimeout(mapMessageTimeout);
    mapMessage.textContent = '';
    const room = ROOM_DATA[currentRoomId];
    const layout = room.layout;
    if (
      newY < 0 ||
      newY >= layout.length ||
      newX < 0 ||
      newX >= layout[0].length
    )
      return;
    const targetTile = layout[newY][newX];

    if (targetTile === 'W') return;
    if (targetTile === 'D') {
      const portal = room.portals.find((p) => p.x === newX && p.y === newY);
      if (portal) {
        if (portal.requiresPooketmonCreation && !pooketmonCreated) {
          showMapMessage(
            'Você deve criar seu POOketmon com o cientista (👨‍🔬) primeiro!',
          );
          return;
        }
        const requiredEnemyIndex = portal.requiresEnemy;
        if (
          requiredEnemyIndex !== undefined &&
          !enemiesDefeated[requiredEnemyIndex]
        ) {
          const enemyIcon = TILE_ICONS['E' + requiredEnemyIndex] || '??';
          showMapMessage(
            `Você deve derrotar o Mestre ${enemyIcon} para usar esta porta!`,
          );
          return;
        }
        currentRoomId = portal.targetRoomId;
        playerPosition.x = portal.targetX;
        playerPosition.y = portal.targetY;
        saveGame(); // CHECKPOINT: Mudança de Sala
        renderMap();
        return;
      }
    }
    if (targetTile === 'S') {
      if (!chosenPooketmonData) {
        startScreen.classList.remove('hidden');
        return;
      }
      if (!pooketmonCreated) {
        showCreationScreen();
        return;
      }
      showMapMessage('O cientista 👨‍🔬 está ocupado com seus estudos.');
      return;
    }
    if (targetTile.startsWith('E')) {
      const enemyIndex = parseInt(targetTile[1]);
      if (!enemiesDefeated[enemyIndex]) {
        for (let i = 0; i < enemyIndex; i++) {
          if (!enemiesDefeated[i]) {
            const enemyIcon = TILE_ICONS['E' + i] || '??';
            showMapMessage(
              `Você deve derrotar o Mestre ${i} (${enemyIcon}) primeiro!`,
            );
            return;
          }
        }
        currentLevel = enemyIndex;
        showGameScreen();
        return;
      }
    }
    if (targetTile.startsWith('A')) {
      showAllyModal(ALLY_TIPS[targetTile]);
      return;
    }
    if (targetTile.startsWith('H')) {
      const quizId = targetTile;
      if (ITEM_QUIZZES[quizId]) {
        showItemQuiz(quizId, newX, newY);
        return;
      }
    }
    if (targetTile.startsWith('S')) {
      const quizId = targetTile;
      if (ITEM_QUIZZES[quizId]) {
        showItemQuiz(quizId, newX, newY);
        return;
      }
    }
    if (targetTile === 'C') {
      const allDefeated = enemiesDefeated.every((status) => status === true);
      if (allDefeated) {
        showWinScreen();
      } else {
        showMapMessage('Você deve derrotar todos os 4 Mestres 👺 para entrar!');
      }
      return;
    }
    playerPosition.x = newX;
    playerPosition.y = newY;
    saveGame(); // CHECKPOINT: Movimento
    renderMap();
  }

  function showMapMessage(message) {
    mapMessage.textContent = message;
    mapMessageTimeout = setTimeout(() => {
      mapMessage.textContent = '';
    }, 3000);
  }

  function showAllyModal(tip) {
    if (Array.isArray(tip)) {
      currentAllyDialogue = tip;
    } else {
      currentAllyDialogue = [tip];
    }
    currentAllyPage = 0;
    renderAllyPage();
    allyModal.classList.remove('hidden');
  }

  function renderAllyPage() {
    if (!currentAllyDialogue[currentAllyPage]) return;
    allyTip.innerHTML = currentAllyDialogue[currentAllyPage];
    const totalPages = currentAllyDialogue.length;
    if (totalPages > 1) {
      allyPageIndicator.textContent = `Página ${
        currentAllyPage + 1
      } de ${totalPages}`;
      allyPaginationControls.classList.remove('hidden');
      if (currentAllyPage > 0)
        allyPrevBtn.classList.remove('hidden', 'is-disabled');
      else allyPrevBtn.classList.add('hidden', 'is-disabled');
      if (currentAllyPage < totalPages - 1)
        allyNextBtn.classList.remove('hidden', 'is-disabled');
      else allyNextBtn.classList.add('hidden', 'is-disabled');
      if (currentAllyPage === totalPages - 1)
        closeAllyModalBtn.classList.remove('hidden');
      else closeAllyModalBtn.classList.add('hidden');
    } else {
      allyPageIndicator.textContent = '';
      allyPaginationControls.classList.add('hidden');
      closeAllyModalBtn.classList.remove('hidden');
    }
  }

  function showItemQuiz(quizId, itemX, itemY) {
    const quizData = ITEM_QUIZZES[quizId];
    if (!quizData) return;
    if (quizId.startsWith('H')) {
      quizModalTitle.textContent = '💖 Desafio da Poção!';
      quizModalTitle.className = 'pixel-font text-2xl text-blue-400 mb-6';
      quizModalBorder.className =
        'map-container bg-gray-800 p-8 shadow-lg border-4 border-blue-400 h-full flex flex-col justify-center items-center';
    } else if (quizId.startsWith('S')) {
      quizModalTitle.textContent = '⚔️ Desafio da Espada!';
      quizModalTitle.className = 'pixel-font text-2xl text-yellow-400 mb-6';
      quizModalBorder.className =
        'map-container bg-gray-800 p-8 shadow-lg border-4 border-yellow-400 h-full flex flex-col justify-center items-center';
    }
    quizQuestion.textContent = quizData.question;
    quizOptions.innerHTML = '';
    quizFeedback.textContent = '';
    closeQuizModalBtn.classList.add('hidden');
    quizData.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'nes-btn is-primary';
      btn.textContent = option.text;
      btn.onclick = () =>
        handleQuizAnswer(option, quizData, quizId, itemX, itemY);
      quizOptions.appendChild(btn);
    });
    itemQuizModal.classList.remove('hidden');
  }

  function handleQuizAnswer(chosenOption, quizData, quizId, itemX, itemY) {
    const buttons = quizOptions.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      if (btn.textContent === chosenOption.text) {
        btn.classList.add(
          chosenOption.isCorrect ? 'is-correct' : 'is-incorrect',
        );
      } else if (
        quizData.options.find((opt) => opt.text === btn.textContent).isCorrect
      ) {
        btn.classList.add('is-correct');
      }
    });
    if (chosenOption.isCorrect) {
      quizFeedback.textContent = quizData.correctFeedback;
      quizFeedback.style.color = '#92cc41';
      ROOM_DATA[currentRoomId].layout[itemY][itemX] = '_';
      collectedItemIds.push(quizId); // REGISTRA ITEM

      if (quizId.startsWith('H')) {
        accumulatedHpBonus += 20;
        chosenPooketmonData.baseHealth += 20;
        if (savedCreationCode) {
          const regex = /(new\s+Monstro\s*\([^,]+,\s*)(\d+)/;
          savedCreationCode = savedCreationCode.replace(
            regex,
            (match, prefix, valorAtual) => {
              const novoValor = parseInt(valorAtual) + 20;
              return `${prefix}${novoValor}`;
            },
          );
        }
        showMapMessage('Você acertou! Vida Base +20!');
      } else if (quizId.startsWith('S')) {
        accumulatedDanoBonus += 3;
        chosenPooketmonData.attacks.forEach((att) => (att.dano += 3));
        chosenPooketmonData.evolutionAttacks.forEach((att) => (att.dano += 3));
        if (savedCreationCode) {
          const regex = /dano:\s*(\d+)/g;
          savedCreationCode = savedCreationCode.replace(
            regex,
            (match, valorStr) => {
              const novoDano = parseInt(valorStr) + 3;
              return `dano: ${novoDano}`;
            },
          );
        }
        showMapMessage('Você acertou! Dano de Ataque +3!');
      }
      saveGame(); // CHECKPOINT: Item Coletado
    } else {
      quizFeedback.textContent = quizData.incorrectFeedback;
      quizFeedback.style.color = '#e76e55';
      showMapMessage('Resposta incorreta... Tente novamente mais tarde.');
    }
    closeQuizModalBtn.classList.remove('hidden');
  }

  function showGameScreen() {
    mapScreen.classList.add('hidden');
    document.removeEventListener('keydown', handleMapMovement);
    gameScreen.classList.remove('hidden');

    if (isCreationMode) {
      gameScreen.classList.remove('game-screen-normal-mode');
      gameScreen.classList.add('game-screen-creation-mode');
      setupLevel(0);
    } else {
      gameScreen.classList.remove('game-screen-creation-mode');
      gameScreen.classList.add('game-screen-normal-mode');
      setupLevel(currentLevel);
    }
  }

  function showCreationScreen() {
    isCreationMode = true;
    currentLevel = 0;
    showGameScreen();
  }

  function showMapScreenFromGame() {
    gameScreen.classList.add('hidden');
    mapScreen.classList.remove('hidden');
    document.addEventListener('keydown', handleMapMovement);
    renderMap();
  }

  function showWinScreen() {
    mapScreen.classList.add('hidden');
    winSprite.innerHTML = '';

    if (chosenPooketmonData) {
      const img = document.createElement('img');
      img.src = chosenPooketmonData.finalSprite;
      img.alt = 'Vencedor';
      img.className = 'monster-sprite mx-auto';
      img.onerror = function () {
        this.style.display = 'none';
        this.parentNode.innerHTML = '🏆';
      };
      winSprite.appendChild(img);
    } else {
      winSprite.textContent = '🏆';
    }
    winScreen.classList.remove('hidden');
  }

  function validateCreationCode() {
    resetUI();
    logMessage('Testando seu código de criação...', 'info');
    try {
      const playerCode = codeEditor.value;
      if (!playerCode.includes('class Monstro')) {
        throw new Error(
          "A classe não foi definida com o nome 'Monstro'. Lembre-se: `class Monstro { ... }`",
        );
      }
      if (!playerCode.includes('new Monstro')) {
        throw new Error("A instância não foi criada com 'new Monstro(...)'.");
      }

      const fullPlayerCode = `${playerCode}\nreturn meuMonstro;`;
      const playerFactory = new Function(fullPlayerCode);
      const testMonster = playerFactory();

      if (!testMonster || testMonster.nome !== chosenPooketmonData.name) {
        throw new Error(
          `O 'nome' do monstro (${
            testMonster ? testMonster.nome : 'null'
          }) não bate com o POOketmon escolhido (${chosenPooketmonData.name}).`,
        );
      }
      if (!testMonster.ataques || !Array.isArray(testMonster.ataques)) {
        throw new Error('O monstro deve ter uma lista (array) de ataques.');
      }
      if (
        !testMonster.vidaMaxima ||
        testMonster.vidaMaxima !== testMonster.vida
      ) {
        throw new Error(
          "O monstro não possui 'vidaMaxima' ou ela não é igual à 'vida' inicial.",
        );
      }

      const minAllowedLife = 70 + accumulatedHpBonus;
      const maxAllowedLife = 100 + accumulatedHpBonus;

      if (
        testMonster.vida < minAllowedLife ||
        testMonster.vida > maxAllowedLife
      ) {
        throw new Error(
          `Regra de Balanceamento: A vida inicial deve estar entre ${minAllowedLife} e ${maxAllowedLife} (considerando bônus)!`,
        );
      }

      if (testMonster.ataques.length !== 1) {
        throw new Error(
          'Regra de Balanceamento: No nível 0, defina exatamente UM ataque.',
        );
      }

      const minAllowedDano = 15 + accumulatedDanoBonus;
      const maxAllowedDano = 20 + accumulatedDanoBonus;

      if (
        testMonster.ataques[0].dano < minAllowedDano ||
        testMonster.ataques[0].dano > maxAllowedDano
      ) {
        throw new Error(
          `Regra de Balanceamento: O dano do ataque inicial deve estar entre ${minAllowedDano} e ${maxAllowedDano} (considerando bônus)!`,
        );
      }

      testMonster.sprite = chosenPooketmonData.sprite;
      logMessage(
        "Sprite '" + testMonster.sprite + "' associado automaticamente!",
        'info',
      );

      savedCreationCode = playerCode;
      pooketmonCreated = true;
      logMessage('Sucesso! Seu POOketmon foi criado!', 'victory');
      logMessage(`Pronto! Seu POOketmon está guardado na POOketbola!`);

      isCreationMode = false;
      saveGame(); // CHECKPOINT: Criação

      setTimeout(() => {
        showMapScreenFromGame();
        showMapMessage(
          `Você criou ${chosenPooketmonData.name}! A porta do laboratório está aberta.`,
        );
      }, 2500);
    } catch (e) {
      logMessage(`Erro no seu código: ${e.message}`, 'defeat');
      console.error(e);
    }
  }

  function startBattle() {
    resetUI();
    const level = levels[currentLevel];
    try {
      const playerCode = codeEditor.value;

      let instanceVarName = 'meuMonstro';
      if (currentLevel >= 2) {
        // Níveis 3 e 4 (Herança e Polimorfismo)
        instanceVarName = 'meuMonstroEvoluido';
      }

      const fullPlayerCode = `${playerCode}\nreturn ${instanceVarName};`;
      const playerFactory = new Function(fullPlayerCode);
      playerMonster = playerFactory();

      if (!playerMonster) {
        throw new Error(
          `A variável '${instanceVarName}' está indefinida. Certifique-se de criar uma instância: 'const ${instanceVarName} = new SuaClasse(...);'`,
        );
      }

      if (
        playerMonster.constructor.name === 'Monstro' &&
        playerMonster.ataques.length > 1
      ) {
        throw new Error(
          "Regra de POO: A classe base 'Monstro' só suporta 1 ataque.",
        );
      }

      if (currentLevel === 2) {
        if (
          playerMonster.constructor.name !== chosenPooketmonData.evolutionName
        ) {
          throw new Error(
            `Para este nível, sua classe deve se chamar '${chosenPooketmonData.evolutionName}' (e não '${playerMonster.constructor.name}').`,
          );
        }
      }

      if (!playerMonster.sprite) {
        if (playerMonster.constructor.name === 'Slime') {
          playerMonster.sprite = 'assets/slime.png';
        } else if (chosenPooketmonData) {
          if (currentLevel <= 1) {
            playerMonster.sprite = chosenPooketmonData.sprite;
          } else if (currentLevel === 2) {
            playerMonster.sprite = chosenPooketmonData.evolutionSprite;
          } else if (currentLevel === 3) {
            playerMonster.sprite = chosenPooketmonData.finalSprite;
          }
        } else {
          playerMonster.sprite = '❓';
        }
      }

      if (currentLevel === 0) {
        if (accumulatedHpBonus > 0 && playerMonster.vida <= 100) {
          playerMonster.vidaMaxima += accumulatedHpBonus;
          playerMonster.vida += accumulatedHpBonus;
        }
        if (
          accumulatedDanoBonus > 0 &&
          playerMonster.ataques.length > 0 &&
          playerMonster.ataques[0].dano <= 20
        ) {
          playerMonster.ataques[0].dano += accumulatedDanoBonus;
        }
      }

      if (currentLevel === 1) {
        if (typeof playerMonster.atacar !== 'function') {
          throw new Error(
            "Para lutar neste nível, você PRECISA implementar o método 'atacar(alvo, ataqueEscolhido)' dentro da sua classe!",
          );
        }
      }

      class EnemyMonstro {
        constructor(nome, vida, ataques) {
          this.nome = nome;
          this.vida = vida;
          this.ataques = ataques;
          this.vidaMaxima = vida;
          this.sprite = level.enemySprite;
        }
        atacar(alvo, ataqueEscolhido) {
          const danoCausado = ataqueEscolhido.dano;
          alvo.vida -= danoCausado;
          console.log(
            `${this.nome} usou ${ataqueEscolhido.nome} causando ${danoCausado} de dano!`,
          );
        }
      }
      const Monstro = EnemyMonstro;
      enemyMonster = eval(level.enemyCode);

      if (!playerMonster || !Array.isArray(playerMonster.ataques))
        throw new Error(
          "Seu monstro não foi criado corretamente ou não possui um array de 'ataques'.",
        );
    } catch (e) {
      logMessage(`Erro no seu código: ${e.message}`, 'defeat');
      console.error(e);
      return;
    }
    battleBtn.classList.add('is-disabled');
    battleBtn.disabled = true;
    returnToMapBtn.classList.add('is-disabled');
    updateMonsterUI('player-monster', playerMonster);
    updateMonsterUI('enemy-monster', enemyMonster);
    displayAttackButtons(playerMonster);
    logMessage(`A batalha contra ${enemyMonster.nome} começa!`);
    logMessage('Sua vez de atacar.', 'info');
  }

  async function handlePlayerTurn(attackIndex) {
    toggleAttackButtons(false);
    const chosenAttack = playerMonster.ataques[attackIndex];
    await performAttack(playerMonster, enemyMonster, chosenAttack, true);
    if (enemyMonster.vida <= 0) {
      endBattle(true);
      return;
    }
    logMessage('Vez do inimigo...', 'info');
    await sleep(1500);
    const enemyAttack =
      enemyMonster.ataques[
        Math.floor(Math.random() * enemyMonster.ataques.length)
      ];
    await performAttack(enemyMonster, playerMonster, enemyAttack, false);
    if (playerMonster.vida <= 0) {
      endBattle(false);
      return;
    }
    logMessage('Sua vez de atacar.', 'info');
    toggleAttackButtons(true);
  }
  async function performAttack(attacker, target, attack, isPlayer) {
    if (!attacker || !target || !attack) {
      console.error('Ataque inválido', attacker, target, attack);
      logMessage('Erro no ataque, pulando turno.', 'defeat');
      return;
    }
    const attackerSprite = document.getElementById(
      isPlayer ? 'player-monster-sprite' : 'enemy-monster-sprite',
    );
    const targetSprite = document.getElementById(
      isPlayer ? 'enemy-monster-sprite' : 'player-monster-sprite',
    );
    attackerSprite.classList.add(
      isPlayer ? 'attacking-player' : 'attacking-enemy',
    );
    await sleep(200);
    attackerSprite.classList.remove(
      isPlayer ? 'attacking-player' : 'attacking-enemy',
    );
    if (target.vida > 0) {
      targetSprite.classList.add('hit');
    }
    const originalLog = console.log;
    let attackLog = '';
    console.log = (msg) => {
      attackLog = msg;
    };
    try {
      if (typeof attacker.atacar === 'function') {
        attacker.atacar(target, attack);
      } else {
        if (isPlayer && currentLevel >= 1) {
          throw new Error(
            "O método 'atacar' não foi encontrado ou não é uma função válida.",
          );
        }
        target.vida -= attack.dano;
        attackLog = `${attacker.nome} usou ${attack.nome} e causou ${attack.dano} de dano!`;
      }

      if (attacker.vida > attacker.vidaMaxima) {
        attacker.vida = attacker.vidaMaxima;
      }
      if (target.vida > target.vidaMaxima) {
        target.vida = target.vidaMaxima;
      }
    } catch (e) {
      console.log = originalLog;
      logMessage(`Erro no método atacar: ${e.message}`, 'defeat');
      console.error(e);
      toggleAttackButtons(true);
      return;
    }
    console.log = originalLog;
    if (attackLog) {
      logMessage(attackLog, isPlayer ? 'player' : 'enemy');
    } else {
      logMessage(
        `${attacker.nome} atacou ${target.nome}!`,
        isPlayer ? 'player' : 'enemy',
      );
    }
    updateHealthBar(isPlayer ? 'enemy-monster' : 'player-monster', target);
    updateHealthBar(isPlayer ? 'player-monster' : 'enemy-monster', attacker);
    await sleep(400);
    targetSprite.classList.remove('hit');
  }
  function endBattle(playerWon) {
    toggleAttackButtons(false);
    const level = levels[currentLevel];
    let validationPassed = false;
    try {
      validationPassed = level.validation(playerMonster);
    } catch (e) {
      logMessage(`Erro na validação: ${e.message}`, 'defeat');
    }
    if (playerWon && validationPassed) {
      logMessage(`VITÓRIA! ${level.successMessage}`, 'victory');

      if (chosenPooketmonData && currentLevel !== 1) {
        let currentCode = codeEditor.value;
        let updatedAny = false;
        let msgLevelUp = 'Subiu de Nível! ';

        chosenPooketmonData.baseHealth += 25;

        const regexLevelUp =
          /(new\s+\w+\s*\([^,]+,\s*|super\s*\([^,]+,\s*)(\d+)/g;
        currentCode = currentCode.replace(
          regexLevelUp,
          (match, prefix, valorAtual) => {
            const novoValor = parseInt(valorAtual) + 25;
            updatedAny = true;
            return `${prefix}${novoValor}`;
          },
        );
        msgLevelUp += '+25 Vida';

        chosenPooketmonData.attacks.forEach((att) => (att.dano += 20));

        const regexDano = /dano:\s*(\d+)/g;
        currentCode = currentCode.replace(regexDano, (match, valorAtual) => {
          const novoValor = parseInt(valorAtual) + 20;
          updatedAny = true;
          return `dano: ${novoValor}`;
        });
        msgLevelUp += ' e +20 Dano em todos os ataques';

        if (updatedAny) {
          codeEditor.value = currentCode;
          logMessage(msgLevelUp + ' adicionados ao seu código!', 'victory');
        }
      }

      enemiesDefeated[currentLevel] = true;
      battleWonBtn.classList.remove('hidden');
      returnToMapBtn.classList.add('hidden');

      savedCreationCode = codeEditor.value;
      saveGame(); // CHECKPOINT: Vitória
    } else if (playerWon && !validationPassed) {
      logMessage(
        'Você venceu, mas algo no seu código não atendeu aos requisitos da missão. Revise e tente novamente!',
        'defeat',
      );
      battleBtn.classList.remove('is-disabled');
      battleBtn.disabled = false;
      returnToMapBtn.classList.remove('hidden');
      returnToMapBtn.classList.remove('is-disabled');
    } else {
      logMessage('DERROTA! Revise seu código e tente novamente.', 'defeat');
      battleBtn.classList.remove('is-disabled');
      battleBtn.disabled = false;

      returnToMapBtn.classList.remove('hidden');
      returnToMapBtn.classList.remove('is-disabled');

      if (currentLevel === 0) {
        battleBtn.classList.add('hidden');
        logMessage('Volte ao cientista 👨‍🔬 para editar seu código.', 'info');
      }
    }
  }

  function displayAttackButtons(monster) {
    attackButtonsContainer.innerHTML = '';
    if (!monster || !monster.ataques) return;
    monster.ataques.forEach((ataque, index) => {
      const btn = document.createElement('button');
      btn.className = 'nes-btn attack-btn';
      btn.textContent = `${ataque.nome} (${ataque.dano})`;
      btn.onclick = () => handlePlayerTurn(index);
      attackButtonsContainer.appendChild(btn);
    });
  }
  function toggleAttackButtons(enabled) {
    const buttons = attackButtonsContainer.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.disabled = !enabled;
      if (!enabled) btn.classList.add('is-disabled');
      else btn.classList.remove('is-disabled');
    });
  }
  function logMessage(message, type = 'info') {
    const p = document.createElement('p');
    p.textContent = `> ${message}`;
    if (type === 'player') p.style.color = '#63b3ed';
    if (type === 'enemy') p.style.color = '#f56565';
    if (type === 'victory') p.style.color = '#92cc41';
    if (type === 'defeat') p.style.color = '#fc8181';
    battleLog.appendChild(p);
    battleLog.scrollTop = battleLog.scrollHeight;
  }

  function updateMonsterUI(cardId, monster) {
    const card = document.getElementById(`${cardId}-card`);
    card.classList.remove('opacity-50');
    document.getElementById(`${cardId}-name`).textContent = monster.nome;

    const spriteElement = document.getElementById(`${cardId}-sprite`);
    spriteElement.src = monster.sprite;
    spriteElement.style.display = 'block';

    updateHealthBar(cardId, monster);
  }

  function updateHealthBar(cardId, monster) {
    const hpBar = document.getElementById(`${cardId}-hp-bar`);
    const hpText = document.getElementById(`${cardId}-hp-text`);
    const hp = Math.max(0, monster.vida);
    const maxHp = monster.vidaMaxima;
    const percentage = (hp / maxHp) * 100;
    hpBar.style.width = `${percentage}%`;
    hpText.textContent = `${hp}/${maxHp}`;
    if (percentage < 30) hpBar.classList.add('low');
    else hpBar.classList.remove('low');
  }

  function resetUI() {
    battleLog.innerHTML = '';
    attackButtonsContainer.innerHTML = '';
    if (isCreationMode) return;

    ['player-monster', 'enemy-monster'].forEach((cardId) => {
      const card = document.getElementById(`${cardId}-card`);
      card.classList.add('opacity-50');
      document.getElementById(`${cardId}-name`).textContent =
        cardId === 'player-monster' ? 'Seu Monstro' : 'Inimigo';
      document.getElementById(`${cardId}-sprite`).src = '';
      const hpBar = document.getElementById(`${cardId}-hp-bar`);
      hpBar.style.width = '100%';
      hpBar.classList.remove('low');
      document.getElementById(`${cardId}-hp-text`).textContent = '--/--';
    });
  }

  function setupLevel(levelIndex) {
    const level = levels[levelIndex];
    let description = level.description;

    let codeToLoad = level.starterCodeTemplate(chosenPooketmonData);

    // LÓGICA DE RESTAURAÇÃO DE RASCUNHO (TODOS OS NÍVEIS)
    // Nível 2: Métodos com Parâmetros
    if (levelIndex === 1 && savedLevel2Code) {
      codeToLoad = savedLevel2Code;
      logMessage('Seu código do Nível 2 (Métodos) foi restaurado.', 'info');
    }
    // Nível 3: Herança
    else if (levelIndex === 2 && savedLevel3Code) {
      codeToLoad = savedLevel3Code;
      logMessage('Seu código do Nível 3 (Herança) foi restaurado.', 'info');
    }
    // Nível 4: Polimorfismo
    else if (levelIndex === 3 && savedLevel4Code) {
      codeToLoad = savedLevel4Code;
      logMessage(
        'Seu código do Nível 4 (Polimorfismo) foi restaurado.',
        'info',
      );
    }
    // Caso padrão: Reconstrói a partir do Nível 0 se não houver rascunho específico
    else if (savedCreationCode && levelIndex > 0) {
      let cleanCode = savedCreationCode;

      // Lista de assinaturas de comentários de instrução para remover
      const instructionSignatures = [
        'Olá, ',
        'Bem-vindo ao laboratório.',
        'Para criar um POOketmon, precisamos',
        '1. Declare uma nova classe',
        '2. Toda classe precisa',
        'O nosso deve aceitar',
        '3. Dentro do constructor',
        "Use 'this' para guardar",
        '4. Também precisamos de um',
        "- 'vidaMaxima'",
        "(O 'sprite' será",
        '5. Agora, fora da classe',
        'Declare uma variável chamada',
        '6. Atribua a ela uma',
        'No lugar de ... passe',
        '- Nome:',
        '- Vida:',
        '- Ataques (Defina',
        'Boa sorte, programador!',
        'ADICIONE O MÉTODO',
        'DICA: Acesse a vida',
        '1. Crie a classe',
        'que estende (extends)',
        '2. No constructor, use super',
        '3. O atributo ataques é um array',
        '(Novos ataques sugeridos',
        '4. Crie a instância da evolução',
        '5. Utilize meuMonstroEvoluido',
        'LEMBRETE: Para acessar',
        '1. Encontre a classe',
        'no seu código acima',
        '2. Dentro dela, escreva o método',
        '3. Implemente a lógica',
      ];

      const lines = cleanCode.split('\n');
      const filteredLines = lines.filter((line) => {
        const trimmed = line.trim();
        // Se não for comentário, mantém
        if (!trimmed.startsWith('//')) return true;

        // Se for comentário, verifica se contém alguma assinatura de instrução
        // Verifica também se é a linha específica do array de ataques do exemplo
        if (trimmed.includes('[ { nome:') && trimmed.includes('dano:'))
          return false;

        for (const sig of instructionSignatures) {
          if (trimmed.includes(sig)) return false;
        }
        return true;
      });

      cleanCode = filteredLines.join('\n');

      cleanCode = cleanCode.replace(/\n{3,}/g, '\n\n');

      codeToLoad = cleanCode.trimEnd() + '\n\n' + codeToLoad;

      if (levelIndex >= 2) {
        codeToLoad = codeToLoad.replace(
          'const meuMonstro = new Monstro',
          '// const meuMonstro = new Monstro',
        );
      }
    }

    document.getElementById('mission-area').style.display = 'block';
    codeEditor.style.display = 'block';
    if (codeEditor.previousElementSibling) {
      codeEditor.previousElementSibling.style.display = 'block';
    }
    battleBtn.classList.remove('hidden');
    returnToMapBtn.classList.remove('hidden');

    if (isCreationMode) {
      missionTitle.textContent = 'Nível 0: Crie seu POOketmon!';
      description = `Hora de criar seu ${chosenPooketmonData.name}! Complete o construtor da classe 'Monstro' e crie sua instância.`;
      battleBtn.textContent = 'Testar e Criar!';

      if (savedCreationCode) {
        codeToLoad = savedCreationCode;
        logMessage('Seu código anterior foi restaurado.', 'info');
      }
    } else {
      if (levelIndex === 0) {
        if (savedCreationCode) {
          codeToLoad = savedCreationCode;
        } else {
          logMessage(
            'ERRO: Código de criação não encontrado. Volte ao cientista.',
            'defeat',
          );
          showMapScreenFromGame();
          return;
        }

        document.getElementById('mission-area').style.display = 'none';
        codeEditor.style.display = 'none';
        if (codeEditor.previousElementSibling) {
          codeEditor.previousElementSibling.style.display = 'none';
        }
        battleBtn.classList.add('hidden');
        returnToMapBtn.classList.add('hidden');

        logMessage(
          'Batalha Nível 0 (Goblin) iniciando com seu código criado...',
          'info',
        );
        codeEditor.value = codeToLoad;

        setTimeout(startBattle, 500);
        return;
      } else {
        if (chosenPooketmonData) {
          description = description.replace(
            '${pooket.evolutionName}',
            chosenPooketmonData.evolutionName,
          );
        }

        missionTitle.textContent = level.title;
        battleBtn.textContent = 'Batalhar!';
      }
    }

    missionDescription.textContent = description;
    codeEditor.value = codeToLoad;

    resetUI();
    battleWonBtn.classList.add('hidden');
    battleBtn.classList.remove('is-disabled');
    battleBtn.disabled = false;
    returnToMapBtn.classList.remove('is-disabled');
  }

  function handlePooketmonChoice(pooketId) {
    chosenPooketmonData = JSON.parse(
      JSON.stringify(STARTER_POOKETMONS[pooketId]),
    );
    startScreen.classList.add('hidden');
    showCreationScreen();
    saveGame(); // CHECKPOINT: Escolha
  }

  function handleMainButtonAction() {
    if (isCreationMode) {
      validateCreationCode();
    } else {
      startBattle();
    }
  }

  function restartGame() {
    localStorage.removeItem('pooketSave'); // LIMPA SAVE

    chosenPooketmonData = null;
    enemiesDefeated = [false, false, false, false];
    currentLevel = 0;
    isCreationMode = false;
    pooketmonCreated = false;
    collectedItemIds = [];

    winScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    allyModal.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');

    document.removeEventListener('keydown', handleMapMovement);

    window.location.reload();
  }

  // Event Listeners
  battleBtn.addEventListener('click', handleMainButtonAction);

  playGameBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    initializeMap();
  });

  continueGameBtn.addEventListener('click', () => {
    if (loadGame()) {
      saveFoundScreen.classList.add('hidden');
      initializeMap();
    } else {
      saveFoundScreen.classList.add('hidden');
      welcomeScreen.classList.remove('hidden');
    }
  });

  restartSaveBtn.addEventListener('click', () => {
    localStorage.removeItem('pooketSave');
    saveFoundScreen.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
  });

  battleWonBtn.addEventListener('click', () => {
    showMapScreenFromGame();
  });
  returnToMapBtn.addEventListener('click', () => {
    if (isCreationMode) {
      savedCreationCode = codeEditor.value;
      isCreationMode = false;
      logMessage('Código salvo. Voltando ao mapa...', 'info');
    }
    // LÓGICA DE SALVAR RASCUNHOS (Níveis 2, 3 e 4)
    else if (currentLevel === 1) {
      savedLevel2Code = codeEditor.value;
      logMessage('Rascunho do Nível 2 salvo. Voltando ao mapa...', 'info');
    } else if (currentLevel === 2) {
      savedLevel3Code = codeEditor.value;
      logMessage('Rascunho do Nível 3 salvo. Voltando ao mapa...', 'info');
    } else if (currentLevel === 3) {
      savedLevel4Code = codeEditor.value;
      logMessage('Rascunho do Nível 4 salvo. Voltando ao mapa...', 'info');
    }
    saveGame(); // CHECKPOINT: Sair do editor
    showMapScreenFromGame();
  });
  allyPrevBtn.addEventListener('click', () => {
    if (currentAllyPage > 0) {
      currentAllyPage--;
      renderAllyPage();
    }
  });
  allyNextBtn.addEventListener('click', () => {
    if (currentAllyPage < currentAllyDialogue.length - 1) {
      currentAllyPage++;
      renderAllyPage();
    }
  });
  closeAllyModalBtn.addEventListener('click', () => {
    allyModal.classList.add('hidden');
  });
  closeQuizModalBtn.addEventListener('click', () => {
    itemQuizModal.classList.add('hidden');
    renderMap();
  });
  restartGameBtn.addEventListener('click', restartGame);
  document
    .getElementById('select-flamos')
    .addEventListener('click', () => handlePooketmonChoice('flamos'));
  document
    .getElementById('select-aquaz')
    .addEventListener('click', () => handlePooketmonChoice('aquaz'));
  document
    .getElementById('select-folion')
    .addEventListener('click', () => handlePooketmonChoice('folion'));
});
