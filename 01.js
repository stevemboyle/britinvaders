
//---------------------------------------------------------------------
// INITIALIZE AND START THE GAME
//---------------------------------------------------------------------

  var game = new Game();

//---------------------------------------------------------------------
// INITIALIZE
//---------------------------------------------------------------------

  function init() {
    if (game.init() ){
      game.start();
    }
  }

//---------------------------------------------------------------------
// IMAGE REPOSITORY
//---------------------------------------------------------------------

  var imageRepository = new function() {
    this.empty = null;
    this.background = new Image();

    this.background.src = "images/background.png";
  };

//---------------------------------------------------------------------
// DRAWABLE: THE BASE CLASS FOR ALL DRAWABLE OBJECTS
//---------------------------------------------------------------------

  function Drawable() {
    this.init = function(x, y) {

      // Defaults
      this.x = x;
      this.y = y;
    };

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // This abstract function will be implemented in child objects.
    this.draw = function() {
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
// THE GAME OBJECT
//---------------------------------------------------------------------

 function Game(){

   this.init = function(){

     // Get the canvas element.
     this.backgroundCanvas = document.getElementById('background');

     // Make sure that the canvas is supported.
     if ( this.backgroundCanvas.getContext ) {

       // Get the context.
       this.backgroundContext = this.backgroundCanvas.getContext('2d');

       // Initialize objects.
       Background.prototype.context = this.backgroundContext;
       Background.prototype.canvasWidth = this.backgroundCanvas.width;
       Background.prototype.canvasHeight = this.backgroundCanvas.height;

       // Initialize the background objects.
       this.background = new Background();

       // Set the draw point to 0, 0
       this.background.init(0, 0);

       // Return true if the canvas is supported.
       return true;

     } else {

       // Return false if the canvas is not supported.
       return false;
     }
   };

   // Start the animation loop.
   this.start = function() {
     animate();
   };

 }

//---------------------------------------------------------------------
// THE ANIMATION LOOP
//---------------------------------------------------------------------

  function animate() {
    requestAnimFrame ( animate );
    game.background.draw();
  }

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
