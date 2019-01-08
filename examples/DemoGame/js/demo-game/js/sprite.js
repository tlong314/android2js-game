/** Class representing a sprite - a game object with a physical onscreen presence. */
class Sprite {

	constructor(/* Bitmap */ image, /* int */ x, /* int */ y, /* int */ width, /* int */ height, /* Game */ game) {

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.game = game;

		this.velocityX = 0;
		this.velocityY = 0;

		// Note: image may be null if this this object is drawn programmatically
		this.image = image;
	}

	/** Draws the current object to the game screen. */
	/* public void */ draw(/* Canvas */ canvas) {}

	/** Performs state updates to the current instance for the current game loop cycle. */
	/* public void */ update() {
		this.x += this.velocityX;
		this.y += this.velocityY;
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

	/** Returns this sprite's `velocityX` {number} property. */
	/* public int */ getVelocityX() {
		return this.velocityX;
	}

	/**
	 * Sets this sprite's `velocityX` property.
	 * @param {number} newVX - The new value for this sprite's velocityX.
	 */
	/* public void */ setVelocityX(/* int */ newVX) {
		this.velocityX = newVX;
	}

	/** Returns this sprite's `velocityY` {number} property. */
	/* public int */ getVelocityY() {
		return this.velocityY;
	}

	/**
	 * Sets this sprite's `velocityY` property.
	 * @param {number} newVY - The new value for this sprite's velocityY.
	 */
	/* public void */ setVelocityY(/* int */ newVY) {
		this.velocityY = newVY;
	}
}