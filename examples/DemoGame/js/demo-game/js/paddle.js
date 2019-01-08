/** Class representing a sprite - a game object with a physical onscreen presence. */
class Paddle extends Sprite {

	constructor(/* Bitmap */ image, /* int */ x, /* int */ y, /* int */ width, /* int */ height, /* Game */ game) {
		super(image, x, y, width, height, game);

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.game = game;

		this.velocityX = 0;
		this.velocityY = 0;

		// Note: image may be null if this sprite is drawn programmatically
		this.image = image;
	}

	/**
	 * @description Draws the current object to the game screen.
	 */
	/* public void */ draw(/* Canvas */ canvas) {
		let paint = new Paint();
		paint.setColor( Color.GRAY );
		paint.setStyle( Paint.Style.FILL );

		canvas.drawRect(new Rect(this.x, this.y, this.x + this.width, this.y + this.height), paint);
	}

	/**
	 * @description Performs state updates to the current instance for the current game loop cycle.
	 */
	/* public void */ update() {
		// This sprite moves based on user's direct input, not the animation loop
	}

	/** Returns the width of this sprite in the game. */
	/* public int */ getWidth() {
		return this.width;
	}

	/** Returns the height of this sprite in the game. */
	/* public int */ getHeight() {
		return this.height;
	}

	/** Returns this sprite's `x` {number} property. */
	/* public int */ getX() {
		return this.x;
	}

	/**
	 * Sets this sprite's `x` property.
	 * @param {number} newX - The new value for this sprite's x.
	 */
	/* public void */ setX(/* int */ newX) {
		this.x = newX;
	}

	/** Returns this sprite's `y` {number} property. */
	/* public int */ getY() {
		return this.y;
	}

	/**
	 * Sets this sprite's `y` property.
	 * @param {number} newY - The new value for this sprite's y.
	 */
	/* public void */ setY(/* int */ newY) {
		this.y = newY;
	}
}