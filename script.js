// TODO
// jest blad, ktory uniemozliwia szybki ruch.
// idac w dol mozna wcisnc szybko prawo i gora
// przez co nastepny ruch zostanie odczytany jako w sanke
// prawdzi to do kolizji i konca gry.
// aktualnie jest zabepieczenie, polegajace, ze mozna
// wybrac kierunek raz na klatkę, ale jest to złe.
// przy wolnej grze nie mozna zmienic decyzji
// i ciezko jest zrobic dwa ruchy po sobie .
// mozna by zrobic jakąs kolejke na dwa ruchy, ale więcej wrarunkow
// przy wciskaniu klawiszy

// - set interval na request frame animation.
//    trzeba dodatkowe oblizcenia do kontroli fps.
// https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
// - warunek win - jesli brak empty fields - komuniakt wygrales
// - zwiekszac predkosc co iles pkt


window.addEventListener("load", () => {
  run();
}, false);

const run = () => {
  let RENDER_SPEED = 100;
  let gameStarted = false;
  let lost = false;
  let canvas = document.getElementById('game');
  let ctx = canvas.getContext('2d');
  let intervalRef;
  let points = 0;

  const BOARD_SIZE = 10;
  const BOARD_START_X = 50;
  const BOARD_START_Y = 100;
  const THROUGH_WALL = false;
  const RECT_SIZE = 18;
  const FIELD_SIZE = 20;

  const KEY_UP = 38;
  const KEY_DOWN = 40;
  const KEY_LEFT = 37;
  const KEY_RIGHT = 39;
  const KEY_ENTER = 13;
  const KEY_ESC = 27;

  const MV_UP = [-1,0];
  const MV_DOWN = [1,0];
  const MV_LEFT = [0,-1];
  const MV_RIGHT = [0,1];
  let moveDirection = MV_RIGHT;

  // [ Y - od gory, X - od lewej ]
  const SN_POS = [1,1];
  const SN_LEN = 3;
  let snake = [];
  let lastPostition = [];
  let foodPosition = [];
  let board = [];

  const drawMainMenu = () => {
    clearCanvas();

    ctx.font = "50px Impact";
    ctx.fillStyle = "#0099CC";
    ctx.textAlign = "center";
    ctx.fillText("snake game", canvas.width/2, canvas.height/2);

    ctx.font = "20px Arial";
    ctx.fillText("Press 'Enter' to start", canvas.width/2, canvas.height/2 + 50);
    ctx.fillText("Press 'ESC' to menu", canvas.width/2, canvas.height/2 + 70);
  }

  const clearCanvas = () => {
  	ctx.clearRect(0, 0, 640, 360);
  }

  let eventTimestamp = 0;

  window.addEventListener("keydown", (ev) => {
    let time = Date.now() - eventTimestamp;
    if (time > RENDER_SPEED) {
      if (ev.keyCode == KEY_ENTER && !gameStarted) { startGame(); }
      if (ev.keyCode == KEY_ESC && gameStarted) { stopGame(); }
      if (ev.keyCode == KEY_UP) {moveDirection = (moveDirection === MV_DOWN ? MV_DOWN : MV_UP);}
      if (ev.keyCode == KEY_DOWN) {moveDirection = (moveDirection === MV_UP ? MV_UP : MV_DOWN);}
      if (ev.keyCode == KEY_LEFT) {moveDirection = (moveDirection === MV_RIGHT ? MV_RIGHT : MV_LEFT);}
      if (ev.keyCode == KEY_RIGHT) {moveDirection = (moveDirection === MV_LEFT ? MV_LEFT : MV_RIGHT);}
      eventTimestamp = Date.now();
    }
  });

  const initSnake = () => {
    snake = [];
    moveDirection = MV_RIGHT;
    for (let i = 0; i < SN_LEN; i++) {
      snake[i] = [SN_POS[0], SN_POS[1] - i];
    }
  } // end of initSnake

  const initBoard = () => {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      board[i] = [];
    }
    clearBoard();
  } // end of initBoard

  const clearBoard = () => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        board[i][j] = 0;
      }
    }
  } // end of clearBoard

  const putSnake = () => {
    snake.map((el) => {
      board[el[0]][el[1]] = 1
    })
  } // end of putSnake

  const putFood = () => {
    let y = foodPosition[0];
    let x = foodPosition[1];
    board[y][x] = 2;
  } // end of putFood

  const updateBoard = () => {
    clearBoard();
    putSnake();
    putFood();
  } // end of updateBoard

  const drawRect = (y, x, color) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.rect(x, y, RECT_SIZE, RECT_SIZE);
    ctx.fill();
    ctx.closePath();
  }


  const drawBoard = () => {
    // let disp = "";
    // for (let i = 0; i < BOARD_SIZE; i++) {
    //   disp += "\n";
    //   for (let j = 0; j < BOARD_SIZE; j++) {
    //     disp += board[i][j] + " ";
    //   }
    // }
    // console.log(disp);
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.rect(BOARD_START_X, BOARD_START_Y, BOARD_SIZE*FIELD_SIZE, BOARD_SIZE*FIELD_SIZE);
    ctx.stroke();
    ctx.closePath();

    for (let i = 0; i < BOARD_SIZE; i++)
      for (let j = 0; j < BOARD_SIZE; j++) {
        let x = BOARD_START_Y + i*FIELD_SIZE;
        let y = BOARD_START_X + j*FIELD_SIZE;
        if(board[i][j] == 0) {
          // drawRect(x, y, "white")
        } else if(board[i][j] == 1) {
          drawRect(x, y, "blue")
        } else if(board[i][j] == 2) {
          drawRect(x, y, "red")
        }
      }

    displayPoints();
  } // end of drawBoard

  const moveSnake = (direction) => {
    console.log('move snake');
    lastPostition = [snake[snake.length - 1][0], snake[snake.length - 1][1]];
    let y = snake[0][0];
    let x = snake[0][1];

    y +=  direction[0];
    x +=  direction[1];

    if(THROUGH_WALL) {
      if(x >= BOARD_SIZE  ) {x = 0;}
      if(x < 0) {x = BOARD_SIZE - 1;}
      if(y >= BOARD_SIZE ) {y = 0; console.log(y);}
      if(y < 0) {y = BOARD_SIZE - 1;}
    }

    for(let i = snake.length - 1; i > 0; i--) {
      snake[i][0] = snake[i-1][0];
      snake[i][1] = snake[i-1][1];
    }
    snake[0][0] = y;
    snake[0][1] = x;
  } // end of moveSnake

  const isCollisionWithBoard = (y, x) => {
    if(y >= BOARD_SIZE) return true;
    else if(x >= BOARD_SIZE) return true;
    else if(y < 0) return true;
    else if(x < 0) return true;
    else return false;
  } // end of isCollisionWithBoard

  const isCollisionWithSnake = (y, x, snake) => {
    for(let i = 1; i < snake.length; i++) {
      if(snake[i][0] == y)
        if(snake[i][1] == x) {console.log('collsiion with snake ', y ,x); return true; }
    }
    return false;
  } // end of isCollisionWithSnake

  const isFood = (y, x, snake) => {
    if (board[y][x] == 2) { return true; }
  }

  const eat = () => {
    points += 10;
    // if (RENDER_SPEED > 99 ) { RENDER_SPEED -= 5; }
    extendSnake();
    foodPosition = randomFoodPosition();
    // console.log('position ', y);
  }

  const extendSnake = () => {
      snake.push(lastPostition);
  }

  const getEmptyFields = () => {
    let emptyFields = [];

    for(let i = 0; i < BOARD_SIZE; i++)
      for(let j = 0; j < BOARD_SIZE; j++) {
        if(board[i][j] == 0) { emptyFields.push([i,j]); }
    }
    return emptyFields;
  }

  const randomFoodPosition = () => {
    let emptyFields = getEmptyFields();
    let idx = Math.floor(Math.random() * (emptyFields.length - 1));
    return emptyFields[idx];
  }

  const loop  = () => {
    moveSnake(moveDirection);
    const y = snake[0][0];
    const x = snake[0][1];
    if(isCollisionWithBoard(y, x) ||
       isCollisionWithSnake(y, x, snake)) {
         lose();
        //  break;
    } else {
      if(isFood(y, x, snake)) { eat(); }
      updateBoard();
      drawBoard();
    }
  }

  const startGame = () => {
    gameStarted = true;
    lost = false;
    initBoard();
    initSnake();
    putSnake();
    foodPosition = randomFoodPosition();
    putFood();
    points = 0;

    // requestAnimationFrame(gameLoop);
    // gameLoop();

    intervalRef = setInterval(() => {
      clearCanvas();
      loop();
    }, RENDER_SPEED)
  }

  // const gameLoop = () => {
  //   requestAnimationFrame(gameLoop);
  //   loop();
  // }

  const stopGame = () => {
    gameStarted = false;
    clearInterval(intervalRef);
    drawMainMenu();
  }

  const lose = () => {
    clearInterval(intervalRef);
    lost = true;
    lostMessage();
  }

  const lostMessage = (msg) => {
    ctx.font = "50px Impact";
    ctx.fillStyle = "#0099CC";
    ctx.textAlign = "center";
    ctx.fillText("You lost!", canvas.width/2, canvas.height/2);

    ctx.font = "20px Arial";
    ctx.fillText("You scored " + points + " points", canvas.width/2, canvas.height/2 + 50);
    ctx.fillText("Press 'ESC' to main menu", canvas.width/2, canvas.height/2 + 70);
  }

  const displayPoints = () => {
    ctx.fillStyle = "#0099CC";
    ctx.font = "20px Arial";
    ctx.fillText("Points: " + points, canvas.width-50, 20);
  }

  drawMainMenu();
} // end of run
