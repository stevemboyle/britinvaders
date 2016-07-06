
//---------------------------------------------------------------------
// INITIALIZE THE GAME
//---------------------------------------------------------------------

  var game = new Game();

  function init() {
    game.init();
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
    this.background.src = "images/grass1.png";
    this.spaceship.src = "images/tiniest_americans.png";
    this.bullet.src = "images/bullet.png";
    this.enemy.src = "images/brit.gif";
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
      this.context.clearRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
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
// QUAD TREE!
//---------------------------------------------------------------------

  // See here: http://gamedev.tutsplus.com/tutorials/implementation/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space/

  /**
   * QuadTree object.
   *
   * The quadrant indexes are numbered as below:
   *     |
   *  1  |  0
   * ----+----
   *  2  |  3
   *     |
   */

  function QuadTree(boundBox, lvl) {
  	var maxObjects = 10;
  	this.bounds = boundBox || {
  		x: 0,
  		y: 0,
  		width: 0,
  		height: 0
  	};

  	var objects = [];
  	this.nodes = [];
  	var level = lvl || 0;
  	var maxLevels = 5;

  	 // Clears the quadTree and all nodes of objects

  	this.clear = function() {
  		objects = [];

  		for (var i = 0; i < this.nodes.length; i++) {
  			this.nodes[i].clear();
  		}

  		this.nodes = [];
  	};

  	 // Get all objects in the quadTree

  	this.getAllObjects = function(returnedObjects) {
  		for (var i = 0; i < this.nodes.length; i++) {
  			this.nodes[i].getAllObjects(returnedObjects);
  		}

  		for (var i = 0, len = objects.length; i < len; i++) {
  			returnedObjects.push(objects[i]);
  		}

  		return returnedObjects;
  	};

  	// Return all objects that the object could collide with

  	this.findObjects = function(returnedObjects, obj) {
  		if (typeof obj === "undefined") {
  			console.log("UNDEFINED OBJECT");
  			return;
  		}

  		var index = this.getIndex(obj);
  		if (index != -1 && this.nodes.length) {
  			this.nodes[index].findObjects(returnedObjects, obj);
  		}

  		for (var i = 0, len = objects.length; i < len; i++) {
  			returnedObjects.push(objects[i]);
  		}

  		return returnedObjects;
  	};

  	// Insert the object into the quadTree. If the tree
  	// excedes the capacity, it will split and add all
    // objects to their corresponding nodes.

  	this.insert = function(obj) {
  		if (typeof obj === "undefined") {
  			return;
  		}

  		if (obj instanceof Array) {
  			for (var i = 0, len = obj.length; i < len; i++) {
  				this.insert(obj[i]);
  			}

  			return;
  		}

  		if (this.nodes.length) {
  			var index = this.getIndex(obj);

  			// Only add the object to a subnode if it can fit completely
  			// within one
  			if (index != -1) {
  				this.nodes[index].insert(obj);
  				return;
  			}
  		}

  		objects.push(obj);

  		// Prevent infinite splitting
  		if (objects.length > maxObjects && level < maxLevels) {
  			if (this.nodes[0] == null) {
  				this.split();
  			}

  			var i = 0;
  			while (i < objects.length) {

  				var index = this.getIndex(objects[i]);
  				if (index != -1) {
  					this.nodes[index].insert((objects.splice(i,1))[0]);
  				}
  				else {
  					i++;
  				}
  			}
  		}
  	};

  	 // Determine which node the object belongs to. -1 means
  	 // object cannot completely fit within a node and is part
     // of the current node

  	this.getIndex = function(obj) {

  		var index = -1;
  		var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
  		var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

  		// Object can fit completely within the top quadrant
  		var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);

      // Object can fit completely within the bottom quandrant
  		var bottomQuadrant = (obj.y > horizontalMidpoint);

  		// Object can fit completely within the left quadrants
  		if (obj.x < verticalMidpoint &&
  				obj.x + obj.width < verticalMidpoint) {

  			if (topQuadrant) {
  				index = 1;
  			}

  			else if (bottomQuadrant) {
  				index = 2;
  			}

  		}

  		// Object can fix completely within the right quandrants
  		else if (obj.x > verticalMidpoint) {

  			if (topQuadrant) {
  				index = 0;
  			}

  			else if (bottomQuadrant) {
  				index = 3;
  			}

  		}

  		return index;
  	};

  	// Splits the node into 4 subnodes

  	this.split = function() {
  		var subWidth = (this.bounds.width / 2) | 0;
  		var subHeight = (this.bounds.height / 2) | 0;

  		this.nodes[0] = new QuadTree({
  			x: this.bounds.x + subWidth,
  			y: this.bounds.y,
  			width: subWidth,
  			height: subHeight
  		}, level+1);

  		this.nodes[1] = new QuadTree({
  			x: this.bounds.x,
  			y: this.bounds.y,
  			width: subWidth,
  			height: subHeight
  		}, level+1);

  		this.nodes[2] = new QuadTree({
  			x: this.bounds.x,
  			y: this.bounds.y + subHeight,
  			width: subWidth,
  			height: subHeight
  		}, level+1);

  		this.nodes[3] = new QuadTree({
  			x: this.bounds.x + subWidth,
  			y: this.bounds.y + subHeight,
  			width: subWidth,
  			height: subHeight
  		}, level+1);

  	};
  }


//---------------------------------------------------------------------
// OUR OBJECT POOL
//---------------------------------------------------------------------

  function Pool(maxSize) {

    // The maximum amount of bullets.
    var size = maxSize;

    // Our pool
    var pool = [];

    this.getPool = function() {
      var object = [];
      for ( var i = 0; i < size; i++ ) {
        if ( pool[i].alive ) {
          object.push(pool[i]);
        }
      }
      return object;
    };

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
// CHECK READY STATE
//---------------------------------------------------------------------

  function checkReadyState() {
    if ( game.gameOverAudio.readyState === 4 &&
         game.backgroundAudio.readyState === 4 ) {
           window.clearInterval(game.checkAudio);
           document.getElementById('loading').style.display = "none";
           game.start();
    }
  }

//---------------------------------------------------------------------
// OUR SOUND POOL
//---------------------------------------------------------------------

  function SoundPool(maxSize) {
    var size = maxSize;
    var pool = [];
    this.pool = pool;
    var currentSound = 0;

    this.init = function(object) {
      if (object === "laser") {
        for ( var i = 0; i < size; i++ ) {
          var laser = new Audio("sounds/laser.wav");
          laser.volume = .12;
          laser.load();
          pool[i] = laser;
        }
      }
      else if (object === "explosion") {
        for ( var i = 0; i < size; i++ ) {
          var explosion = new Audio("sounds/explosion.wav");
          explosion.volume = .1;
          explosion.load();
          pool[i] = explosion;
        }
      }
    };

    this.get = function() {
      if ( pool[currentSound].currentTime === 0 || pool[currentSound].ended ) {
        pool[currentSound].play();
      }
      currentSound = (currentSound + 1) % size;
    };
  }

//---------------------------------------------------------------------
// THE SHIP
//---------------------------------------------------------------------

  function Ship() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    var fireRate = 15;
    var counter = 0;
    this.collidableWith = "enemyBullet";
    this.type = "ship";

    this.init = function(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.alive = true;
      this.isColliding = false;
      this.bulletPool.init("bullet");
    };

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

      }

      // Redraw the ship.
      if ( !this.isColliding ) {
        this.draw();
      } else {
        this.alive = false;
        game.gameOver();
      }

      // Pew pew!
      if ( KEY_STATUS.space && counter >= fireRate  && !this.isColliding ) {
        this.fire();
        counter = 0;
      }

    };

    // Fire two!
    this.fire = function() {
      this.bulletPool.getTwo( (this.x + 6), this.y, 3,
                              (this.x + 33), this.y, 3 );

      // Make a cool noise!
      game.laser.get();
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

      if ( !this.isColliding ){
        this.context.drawImage(imageRepository.enemy, this.x, this.y);

        // Every movement, there is a chance the enemy will shoot:
        chance = Math.floor( Math.random() * 101 );
        if ( chance/100 < percentFire ) {
          this.fire();
        }

        return false;
      }

      else {

        // Score!
        game.playerScore += 10;

        // Boom!
        game.explosion.get();
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
      this.isColliding = false;
    };

  }

  Enemy.prototype = new Drawable();

//---------------------------------------------------------------------
// THE GAME OBJECT
//---------------------------------------------------------------------

 function Game(){

   this.init = function(){

     // Keep track of score
     this.playerScore = 0;

     // Audio: Laser
     this.laser = new SoundPool(10);
     this.laser.init("laser");

     // Audio: Explosion
     this.explosion = new SoundPool(20);
     this.explosion.init("explosion");

     // Audio: Background Audio
     this.backgroundAudio = new Audio("sounds/kick_shock.wav");
     this.backgroundAudio.loop = true;
     this.backgroundAudio.volume = .25;
     this.backgroundAudio.load();

     // Audio: Game Over Audio
     this.gameOverAudio = new Audio("sounds/game_over.wav");
     this.gameOverAudio.loop = true;
     this.gameOverAudio.volume = .25;
     this.gameOverAudio.load();

     // Check Audio
     this.checkAudio = window.setInterval(function(){
       checkReadyState()
     }, 1000);

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

       this.shipStartX = this.shipCanvas.width / 2 - imageRepository.spaceship.width;
       this.shipStartY = this.shipCanvas.height / 4 * 3 + imageRepository.spaceship.height * 2;
       this.ship.init(this.shipStartX, this.shipStartY,
                      imageRepository.spaceship.width,
                      imageRepository.spaceship.height);

       this.enemyPool = new Pool(30);
       this.enemyPool.init("enemy");
       this.spawnWave();

       this.enemyBulletPool = new Pool(50);
       this.enemyBulletPool.init("enemyBullet");

       // Start QuadTree
       this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});


       // Return true if the canvas is supported.
       return true;

     } else {

       // Return false if the canvas is not supported.
       return false;
     }
   };

   // Spawn new enemies
   this.spawnWave = function() {
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
   };

   // Start the animation loop.
   this.start = function() {
     this.ship.draw();
     this.backgroundAudio.play();
     animate();
   };

   // Restart
   this.restart = function() {
     this.gameOverAudio.pause();

     document.getElementById("game-over").style.display = "none";
     this.backgroundContext.clearRect(0, 0, this.backgroundCanvas.width,
                                            this.backgroundCanvas.height);
     this.shipContext.clearRect(0, 0, this.shipCanvas.width,
                                      this.shipCanvas.height);
     this.mainContext.clearRect(0, 0, this.mainCanvas.width,
                                      this.mainCanvas.height);

     this.quadTree.clear();

     this.background.init(0, 0);
     this.ship.init(this.shipStartX, this.shipStartY,
                    imageRepository.spaceship.width,
                    imageRepository.spaceship.height);
     this.enemyPool.init("enemy");
     this.spawnWave();
     this.enemyBulletPool.init("enemyBullet");
     this.playerScore = 0;
     this.backgroundAudio.currentTime = 0;
     this.backgroundAudio.play();

     // GO!
     this.start();
   };

   // Game Over
   this.gameOver = function() {
     this.backgroundAudio.pause();
     this.gameOverAudio.currentTime = 0;
     this.gameOverAudio.play();
     document.getElementById("game-over").style.display = "block";
   };

 }

//---------------------------------------------------------------------
// THE ANIMATION LOOP
//---------------------------------------------------------------------

  function animate() {

    // Show the score
    document.getElementById('score').innerHTML = game.playerScore;

    // Insert objects into quadtree
    game.quadTree.clear();
    game.quadTree.insert(game.ship);
    game.quadTree.insert(game.ship.bulletPool.getPool());
    game.quadTree.insert(game.enemyPool.getPool());
    game.quadTree.insert(game.enemyBulletPool.getPool());

    detectCollision();

    // If we're out of enemies, spawn more!
    if ( game.enemyPool.getPool().length === 0 ) {
      game.spawnWave();
    }

    // Animate game objects
    if (game.ship.alive) {
  		requestAnimFrame( animate );
  		game.background.draw();
  		game.ship.move();
  		game.ship.bulletPool.animate();
  		game.enemyPool.animate();
  		game.enemyBulletPool.animate();
  	}
  }

//---------------------------------------------------------------------
// COLLISION DETECTION
//---------------------------------------------------------------------

  function detectCollision() {
    var objects = [];
    game.quadTree.getAllObjects(objects);

    for (var x = 0, len = objects.length; x < len; x++) {
      game.quadTree.findObjects(obj = [], objects[x]);

      for (y = 0, length = obj.length; y < length; y++) {

        // Collision Detection Algorithm
        if (objects[x].collidableWith === obj[y].type &&
          (objects[x].x < obj[y].x + obj[y].width &&
             objects[x].x + objects[x].width > obj[y].x &&
           objects[x].y < obj[y].y + obj[y].height &&
           objects[x].y + objects[x].height > obj[y].y)) {
          objects[x].isColliding = true;
          obj[y].isColliding = true;
        }
      }
    }
  };

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
