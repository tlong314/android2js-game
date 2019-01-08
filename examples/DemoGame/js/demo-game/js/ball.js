/** Class representing a sprite - a game object with a physical onscreen presence. */
class Ball extends Sprite {

	constructor(/* Bitmap */ image, /* int */ x, /* int */ y, /* int */ width, /* int */ height, /* Game */ game) {
		super(image, x, y, width, height, game);

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.game = game;

		this.velocityX = 5;
		this.velocityY = 5;

		// Note: image may be null. Try updating this with a Bitmap!
		this.image = image;
	}

	/**
	 * @description Draws the current object to the game screen.
	 */
	/* public */ /* void */ draw(/* Canvas */ canvas) {
		let paint = new Paint();
		paint.setColor( Color.MAGENTA );
		paint.setStyle( Paint.Style.FILL );
		
		if(this.image == null) {
			canvas.drawOval(new RectF(this.x, this.y, this.x + this.width, this.y + this.height), paint);
		} else {
			canvas.drawBitmap( this.image,
				null,
				new Rect(this.x, this.y, this.x + this.width, this.y + this.height),
				paint);
		}
	}

	/**
	 * @description Performs state updates to the current instance for the current game loop cycle.
	 */
	/* public */ /* void */ update() {
		this.x += this.velocityX;
		this.y += this.velocityY;

		// Bounce of right side of screen
		if(this.x >= Constants.SCREEN_WIDTH) {
			this.velocityX *= -1;
		}

		// Bounce of top and bottom of screen
		if(this.y >= Constants.SCREEN_HEIGHT || this.y <= 0) {
			this.velocityY *= -1;
		}

		// Bouncing off paddle should always result in positive velocityX
		if( this.hittingPaddle(this.game.getPaddle()) ) {
			this.velocityX = Math.abs( this.velocityX );
		}

		// Ball passes paddle on the left
		if(this.x + this.width <= 0) {
			this.game.handleMiss();
		}
	}

	/** Returns the width of this sprite in the game. */
	/* public */ /* int */ getWidth() {
		return this.width;
	}

	/** Returns the height of this sprite in the game. */
	/* public */ /* int */ getHeight() {
		return this.height;
	}

	/** Returns this sprite's `x` {number} property. */
	/* public */ /* int */ getX() {
		return this.x;
	}

	/**
	 * Sets this sprite's `x` property.
	 * @param {number} newX - The new value for this sprite's x.
	 */
	/* public */ /* void */ setX(/* int */ newX) {
		this.x = newX;
	}

	/** Returns this sprite's `y` {number} property. */
	/* public */ /* int */ getY() {
		return this.y;
	}

	/**
	 * Sets this sprite's `y` property.
	 * @param {number} newY - The new value for this sprite's y.
	 */
	/* public */ /* void */ setY(/* int */ newY) {
		this.y = newY;
	}

	/** Returns this sprite's `velocityX` {number} property. */
	/* public */ /* int */ getVelocityX() {
		return this.velocityX;
	}

	/**
	 * Sets this sprite's `velocityX` property.
	 * @param {number} newVX - The new value for this sprite's velocityX.
	 */
	/* public */ /* void */ setVelocityX(/* int */ newVX) {
		this.velocityX = newVX;
	}

	/** Returns this sprite's `velocityY` {number} property. */
	/* public */ /* int */ getVelocityY() {
		return this.velocityY;
	}

	/**
	 * Sets this sprite's `velocityY` property.
	 * @param {number} newVY - The new value for this sprite's velocityY.
	 */
	/* public */ /* void */ setVelocityY(/* int */ newVY) {
		this.velocityY = newVY;
	}

	/* public */ /* boolean */ hittingPaddle(/* Paddle */ paddle) {
		
		// First verify that the ball is even within the vertical bounds of the paddle
		if(this.y + this.height > paddle.getY() && this.y < paddle.getY() + paddle.getHeight()) {

			// Ball is either intersecting the paddle, or is exactly on the right edge
			if(this.x > paddle.getX() && this.x <= paddle.getX() + paddle.getWidth()) {
				return true;
			}
		}

		return false;
	}
}