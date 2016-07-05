
//---------------------------------------------------------------------
// INITIALIZE THE GAME
//---------------------------------------------------------------------

  var game = new Game();

//---------------------------------------------------------------------
// START THE GAME
//---------------------------------------------------------------------

  function init() {
    if ( game.init() ) {
      game.start();
    }
  }

//---------------------------------------------------------------------
// IMAGE REPOSITORY
//---------------------------------------------------------------------

  var imageRepository = new function() {

    // The Images
    this.background = new Image();
    this.spaceship = new Image();
    this.bullet = new Image();
    this.enemy = new Image();
    this.enemyBullet = new Image();

    // Ensure the images have loaded before the game begins.
    var numImages = 5;
    var numLoaded = 0;
    function imageLoaded() {
      numLoaded++;
      if ( numLoaded === numImages ) {
        window.init();
      }
    }

    this.background.onload = function() {
      imageLoaded();
    };

    this.spaceship.onload = function() {
      imageLoaded();
    };

    this.bullet.onload = function() {
      imageLoaded();
    };

    this.enemy.onload = function() {
      imageLoaded();
    };

    this.enemyBullet.onload = function() {
      imageLoaded();
    };

    // Image Sources
    this.background.src = "images/background.png";
    this.spaceship.src = "images/ship.png";
    this.bullet.src = "images/bullet.png";
    this.enemy.src = "images/enemy.png";
    this.enemyBullet.src = "images/bullet_enemy.png";
  };

//---------------------------------------------------------------------
// DRAWABLE: THE BASE CLASS FOR ALL DRAWABLE OBJECTS
//---------------------------------------------------------------------

  function Drawable() {
    this.init = function(x, y, width, height) {

      // Defaults
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    };

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Collision Logic
    this.collidableWith = "";
    this.isColliding = false;
    this.type = "";

    // This abstract function will be implemented in child objects.
    this.draw = function() {
    };
    this.move = function() {
    };
    this.isCollidableWith = function(object) {
      return ( this.collidableWith === object.type );
    };
  }

//---------------------------------------------------------------------
// BACKGROUND
//---------------------------------------------------------------------

  // The Background object is a child of the Drawable object.
  function Background () {
    this.speed = 1;

    this.draw = function(){

      // The illusion of moving is created by panning the image.
      this.y += this.speed;
      this.context.drawImage(imageRepository.background, this.x, this.y);

      // We draw another image at the top edge of the first image.
      this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);

      // Reset if the image scrolls off the screen.
      if ( this.y >= this.canvasHeight ) {
        this.y = 0;
      }

    };
  }

  // Inherit from Drawable
  Background.prototype = new Drawable();

//---------------------------------------------------------------------
// THE BULLET
//---------------------------------------------------------------------

  function Bullet(object) {

    // If the bullet is in use, this should be true.
    this.alive = false;
    var self = object;

    // Set the bullet values.
    this.spawn = function(x, y, speed) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.alive = true;
    };

    // Move and draw the bullet until it moves off-screen.
    this.draw = function() {
      this.context.clearRect(this.x, this.y, this.width, this.height);
      this.y -= this.speed;

      if ( this.isColliding ) {
        return true;
      }

      else if ( self === "bullet" && this.y <= 0 - this.height ) {
        return true;
      }

      else if ( self === "enemyBullet" && this.y >= this.canvasHeight ) {
        return true;
      }

      else {

        if ( self === "bullet" ) {
          this.context.drawImage(imageRepository.bullet, this.x, this.y);
        }

        else if ( self === "enemyBullet" ) {
          this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
        }

        return false;
      }
    };

    // Reset the bullet values.
    this.clear = function() {
      this.x = 0;
      this.y = 0;
      this.speed = 0;
      this.alive = false;
      this.isColliding = false;
    };
  }

  Bullet.prototype = new Drawable();

//---------------------------------------------------------------------
// OUR POOL OF BULLETS
//---------------------------------------------------------------------

  function Pool(maxSize) {

    // The maximum amount of bullets.
    var size = maxSize;

    // Our pool
    var pool = [];

    this.init = function(object) {

      if ( object === "bullet" ) {

        for ( var i = 0; i < size; i++ ) {

          // Initialize a new bullet.
          var bullet = new Bullet("bullet");

          bullet.init(0, 0, imageRepository.bullet.width,
                            imageRepository.bullet.height);

          bullet.collidableWith = "enemy";
          bullet.type = "bullet";

          // Place the bullet in the pool.
          pool[i] = bullet;
        }

      } else if ( object === "enemy" ) {

        for ( var i = 0; i < size; i++ ) {

          // Initialize a new enemy.
          var enemy = new Enemy();

          enemy.init(0, 0, imageRepository.enemy.width,
                            imageRepository.enemy.height);

          // Place the enemy in the pool.
          pool[i] =  enemy;
        }

      } else if ( object === "enemyBullet" ) {

        for ( var i = 0; i < size; i++ ) {

          // Initialize a new bullet.
          var bullet = new Bullet("enemyBullet");

          bullet.init(0, 0, imageRepository.enemyBullet.width,
                            imageRepository.enemyBullet.height);

          bullet.collidableWith = "ship";
          bullet.type = "enemyBullet";

          // Place the bullet in the pool.
          pool[i] = bullet;
        }

      }

    };

    this.getPool = function() {
      var object = [];
      for ( var i = 0; i < size; i++ ) {
        if ( pool[i].alive ) {
          object.push(pool[i]);
        }
      }
      return object;
    };

    // Gets the last item in the list.
    // Initializes it.
    // Pushes it to the front of the array.
    this.get = function(x, y, speed) {
      if ( !pool[size - 1].alive ) {
        pool[size - 1].spawn(x, y, speed);
        pool.unshift(pool.pop());
      }
    };

    // The ship can fire two bullets at once.
    this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
      if ( !pool[size - 1].alive && !pool[size - 2].alive ) {
        this.get(x1, y1, speed1);
        this.get(x2, y2, speed2);
      }
    };

    // Draws the bullets in the canvas area.
    // When a bullet goes offscreen,
    // we clear it and push it to the front of the array.
    this.animate = function() {
      for ( var i = 0; i < size; i++ ){
        if ( pool[i].alive ) {
          if ( pool[i].draw() ) {
            pool[i].clear();
            pool.push((pool.splice(i, 1))[0]);
          }
        } else {
          break;
        }
      }
    };

  }

//---------------------------------------------------------------------
// THE SHIP
//---------------------------------------------------------------------

  function Ship() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    this.bulletPool.init("bullet");

    var fireRate = 15;
    var counter = 0;

    this.draw = function() {
      this.context.drawImage(imageRepository.spaceship, this.x, this.y);
    };

    this.move = function() {
      counter++;

      if ( KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.up ) {
        this.context.clearRect(this.x, this.y, this.width, this.height);

        if ( KEY_STATUS.left ) {

          // Move
          this.x -= this.speed;

          // Keep the player on screen.
          if ( this.x <= 0 ) {
            this.x = 0;
          }

        } else if ( KEY_STATUS.right ) {

          // Move
          this.x += this.speed;

          // Keep the player on screen.
          if ( this.x >= this.canvasWidth - this.width ) {
            this.x = this.canvasWidth - this.width;
          }

        } else if ( KEY_STATUS.up ) {

          // Move
          this.y -= this.speed;

          // Keep the player on screen.
          if ( this.y <= this.canvasHeight/4*3) {
            this.y = this.canvasHeight/4*3;
          }

        } else if ( KEY_STATUS.down ) {

          // Move
          this.y += this.speed;

          // Keep the player on screen.
          if ( this.y >= this.canvasHeight - this.height ) {
            this.y = this.canvasHeight - this.height;
          }

        }

        // Redraw the ship.
        if ( !this.isColliding ) {
          this.draw();
        }

      }

      // Pew pew!
      if ( KEY_STATUS.space && counter >= fireRate ) {
        this.fire();
        counter = 0;
      }

    };

    // Fire two!
    this.fire = function() {
      this.bulletPool.getTwo( (this.x + 6), this.y, 3,
                              (this.x + 33), this.y, 3 );
    };

  }

  Ship.prototype = new Drawable();

//---------------------------------------------------------------------
// THE ENEMY SHIPS
//---------------------------------------------------------------------

  function Enemy() {
    var percentFire = .01;
    var chance = 0;
    this.alive = false;
    this.collidableWith = "bullet";
    this.type = "enemy";

    this.spawn = function(x, y, speed) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.speedX = 0;
      this.speedY = speed;
      this.alive = true;
      this.leftEdge = this.x - 90;
      this.rightEdge = this.x + 90;
      this.bottomEdge = this.y + 140;
    };

    this.draw = function() {
      this.context.clearRect(this.x - 1, this.y, this.width + 1, this.height );
      this.x += this.speedX;
      this.y += this.speedY;

      if ( this.x <= this.leftEdge ) {
        this.speedX = this.speed;
      }

      else if ( this.x >= this.rightEdge + this.width ) {
        this.speedX = -this.speed;
      }

      else if ( this.y >= this.bottomEdge ) {
        this.speed = 1.5;
        this.speedY = 0;
        this.y -= 5;
        this.speedX = -this.speed;
      }

      if ( !this.Colliding ){
        this.context.drawImage(imageRepository.enemy, this.x, this.y);

        // Every movement, there is a chance the enemy will shoot:
        chance = Math.floor( Math.random() * 101 );
        if ( chance/100 < percentFire ) {
          this.fire();
        }

        return false;
      }

      else {
        return true;
      }

    };

    this.fire = function() {
      game.enemyBulletPool.get( (this.x + this.width / 2), (this.y + this.height), -2.5 );
    };

    this.clear = function() {
      this.x = 0;
      this.y = 0;
      this.speed = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.alive = false;
    };

  }

  Enemy.prototype = new Drawable();

//---------------------------------------------------------------------
// THE GAME OBJECT
//---------------------------------------------------------------------

 function Game(){

   this.init = function(){

     // Get the canvas element.
     this.backgroundCanvas = document.getElementById('background');
     this.shipCanvas = document.getElementById('ship');
     this.mainCanvas = document.getElementById('main');

     // Make sure that the canvas is supported.
     if ( this.backgroundCanvas.getContext ) {

       // Get the context.
       this.backgroundContext = this.backgroundCanvas.getContext('2d');
       this.shipContext = this.shipCanvas.getContext('2d');
       this.mainContext = this.mainCanvas.getContext('2d');

       // Initialize objects.
       Background.prototype.context = this.backgroundContext;
       Background.prototype.canvasWidth = this.backgroundCanvas.width;
       Background.prototype.canvasHeight = this.backgroundCanvas.height;

       Ship.prototype.context = this.shipContext;
       Ship.prototype.canvasWidth = this.shipCanvas.width;
       Ship.prototype.canvasHeight = this.shipCanvas.height;

       Bullet.prototype.context = this.mainContext;
       Bullet.prototype.canvasWidth = this.mainCanvas.width;
       Bullet.prototype.canvasHeight = this.mainCanvas.height;

       Enemy.prototype.context = this.mainContext;
       Enemy.prototype.canvasWidth = this.mainCanvas.width;
       Enemy.prototype.canvasHeight = this.mainCanvas.height;

       // Initialize the background objects.
       this.background = new Background();

       // Set the draw point to 0, 0
       this.background.init(0, 0);

       // Initialize the ship
       this.ship = new Ship();

       var shipStartX = this.shipCanvas.width / 2 - imageRepository.spaceship.width;
       var shipStartY = this.shipCanvas.height / 4 * 3 + imageRepository.spaceship.height * 2;
       this.ship.init(shipStartX, shipStartY,
                      imageRepository.spaceship.width,
                      imageRepository.spaceship.height);

       this.enemyPool = new Pool(30);
       this.enemyPool.init("enemy");
       var height = imageRepository.enemy.height;
       var width = imageRepository.enemy.width;
       var x = 100;
       var y = -height;
       var spacer = y * 1.5;

       for ( var i = 1; i <= 18; i++ ) {
         this.enemyPool.get( x, y, 2 );
         x += width + 25;
         if ( i % 6 === 0 ) {
           x = 100;
           y += spacer;
         }
       }

       this.enemyBulletPool = new Pool(50);
       this.enemyBulletPool.init("enemyBullet");

       // Return true if the canvas is supported.
       return true;

     } else {

       // Return false if the canvas is not supported.
       return false;
     }
   };

   // Start the animation loop.
   this.start = function() {
     this.ship.draw();
     animate();
   };

 }

//---------------------------------------------------------------------
// THE ANIMATION LOOP
//---------------------------------------------------------------------

  function animate() {
    requestAnimFrame ( animate );
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();
  }

//---------------------------------------------------------------------
// KEY CODES
//---------------------------------------------------------------------

  var KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
  };

//---------------------------------------------------------------------
// KEY STATUS
//---------------------------------------------------------------------

  KEY_STATUS = {};
  for ( code in KEY_CODES ) {
    KEY_STATUS[KEY_CODES[code]] = false;
  }


//---------------------------------------------------------------------
// KEY DOWN AND UP
//---------------------------------------------------------------------

  document.onkeydown = function(event) {
    var keyCode = ( event.keyCode ) ? event.keyCode : event.charCode;
    if ( KEY_CODES[keyCode] ) {
      event.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  };

  document.onkeyup = function(event) {
    var keyCode = ( event.keyCode ) ? event.keyCode : event.charCode;
    if ( KEY_CODES[keyCode] ) {
      event.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  };

//---------------------------------------------------------------------
// REQUEST THE ANIMATION FRAME
//---------------------------------------------------------------------

  // See here: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

  window.requestAnimFrame = (function(){
  	return  window.requestAnimationFrame   ||
  			window.webkitRequestAnimationFrame ||
  			window.mozRequestAnimationFrame    ||
  			window.oRequestAnimationFrame      ||
  			window.msRequestAnimationFrame     ||
  			function(/* function */ callback, /* DOMElement */ element){
  				window.setTimeout(callback, 1000 / 60);
  			};
  })();
