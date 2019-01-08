const INITIAL_TIME_BEFORE_START = 200;

class Game {
	constructor(/* GamePanel */ gamePanel) {

		this.gamePanel = gamePanel;
		this.started = false;
		this.score = 0;
		this.lives = 3;
		this.gameOver = false;
		this.gameOverTime = 0;
		this.paused = false;
		this.random = new Random();
		this.timeBeforeStart = 0;
		this.timeBeforeStart = INITIAL_TIME_BEFORE_START;

		let ballWidth = (int) ( Math.round( Constants.SCREEN_WIDTH / 40 ) );

		// Create ball, centered in the screen
		this.ball = new Ball(null,
			(int) ( Math.round( Constants.SCREEN_WIDTH / 2 - ballWidth / 2 ) ),
			(int) ( Math.round( Constants.SCREEN_HEIGHT / 2 - ballWidth / 2 ) ),
			ballWidth,
			ballWidth,
			this);

		// Create a Paddle on the left side of the screen, halfway down
		this.paddle = new Paddle(null,
			ballWidth * 2,
			(int) ( Math.round( Constants.SCREEN_HEIGHT / 2 - ballWidth / 2 ) ),
			ballWidth,
			ballWidth * 4,
			this);

		this.enemies = new ArrayList/* <Enemy> */();
		this.loadEnemies();
	}

	/* public */ /* void */ loadEnemies() {
		let numEnemies = 5;
		let enemyWidth = (int) ( Math.round( Constants.SCREEN_WIDTH / 20 ) );
		let enemyHeight = (int) ( Math.round( Constants.SCREEN_WIDTH / 20 ) );

		let bitmapFactory = new BitmapFactory();
		let decodedBitmap = bitmapFactory.decodeResource(
			Constants.CURRENT_CONTEXT.getResources(),
			R.drawable.enemy_img);

		let enemyImage = Bitmap.createScaledBitmap(decodedBitmap,
			300,
			230,
			false);

		for(let i = 0; i < numEnemies; i++) {

			// Create random x position, at least halfway across the screen, but within screen bounds
			let enemyX = (int) ( Constants.SCREEN_WIDTH / 2 + this.random.nextInt( (int) ( Math.round(Constants.SCREEN_WIDTH / 2) - enemyWidth ) ) );

			// Create random y position, anywhere within screen bounds
			let enemyY = (int) (this.random.nextInt( (int) ( Math.round(Constants.SCREEN_HEIGHT - enemyHeight) ) ) );

			this.enemies.add(new Enemy(enemyImage, enemyX, enemyY, enemyWidth, enemyWidth, this));
		}
	}

	// Start the game animations
	/* public */ /* void */ start() {
		this.started = true;

		// We'll set the ball to move it's full length with each animation
		this.ball.setVelocityX( this.ball.getWidth() );
		this.ball.setVelocityY( this.ball.getWidth() );
	}

	/* public */ /* void */ pause() {
		this.paused = true;
	}

	/* public */ /* void */ unpause() {
		this.paused = false;
	}

	/* public */ /* void */ handleMiss() {

		this.resetBallAndTime();

		this.lives--;
		if(this.lives == 0) {
			this.gameOver = true;
		}
	}

	/* public */ /* void */ resetBallAndTime() {

		// Create random x position, about halfway across the screen
		let newX = (int) ( Constants.SCREEN_WIDTH / 2 + this.random.nextInt( this.ball.getWidth() * 3 ) );

		// Create random y position, anywhere within screen bounds
		let newY = (int) (this.random.nextInt( Math.round(Constants.SCREEN_HEIGHT - this.ball.getHeight()) ) );

		this.ball.setX( newX );
		this.ball.setY( newY );

		// Set ball's horizontal velocity away from the player
		this.ball.setVelocityX( Math.abs( this.ball.getVelocityX() ) );

		// Reset this time to allow a small delay
		this.timeBeforeStart = INITIAL_TIME_BEFORE_START;
	}

	/* public */ /* void */ update() {

		if(this.timeBeforeStart > 0) {
			this.timeBeforeStart--;
			return;
		}

		if(this.gameOver) {
			this.gameOverTime++;
			return;
		}

		if(this.paused) {
			return;
		}

		this.paddle.update(); // Currently unused, since movement follows touch
		this.ball.update(); // Moves ball and handles collision with paddle

		for(let enemy of this.enemies) {
			enemy.update(); // This could be used for movement or image animation

			// Check for collision with ball, and respond
			if( Game.colliding(this.ball, enemy) ) {
				this.enemies.remove( enemy );
				this.score += 100;

				if(this.enemies.size() == 0) {
					this.gameOver = true;
				}
				
				break;
			}
		}
	}

	/* public */ /* void */ draw(/* Canvas */ canvas) {
		let paint = new Paint();

		if(canvas == null) {
			return;
		}

		// Clear canvas and set current frame background to black
		canvas.drawColor(Color.BLACK);

		// Draw game elements
		this.paddle.draw(canvas);
		this.ball.draw(canvas);

		for(let enemy of this.enemies) {
			enemy.draw(canvas);
		}

		paint.setColor(Color.WHITE);

		let livesText = "Lives: " + this.lives;
		let scoreText = "Score: " + this.score;
		let rect = new Rect();

		// Use Paint.getTextBounds to help position/center text
		paint.getTextBounds(livesText, 0, livesText.length/* () */, rect);
		canvas.drawText("Lives: " + this.lives, (int) (Constants.SCREEN_WIDTH / 4 - rect.width() / 2), rect.height() * 3, paint);

		paint.getTextBounds(scoreText, 0, scoreText.length/* () */, rect);
		canvas.drawText("Score: " + this.score, (int) (3 * Constants.SCREEN_WIDTH / 4 - rect.width() / 2), rect.height() * 3, paint);

		if(this.gameOver) {
			paint.setTextSize( 20 );
			paint.setColor( Color.YELLOW );

			// Enemies are all gone. You win!
			if(this.enemies.size() == 0) {
				let winText = "You win!";

				paint.getTextBounds(winText, 0, winText.length/* () */, rect);
				canvas.drawText(winText,
					(int) (Constants.SCREEN_WIDTH / 2 - rect.width() / 2),
					(int) (Constants.SCREEN_HEIGHT / 2 - rect.height() / 2),
					paint);

			} else if(this.lives == 0) { // Lives are all gone. You lose!
				let loseText = "Better luck next time!";

				paint.getTextBounds(loseText, 0, loseText.length/* () */, rect);
				canvas.drawText(loseText,
					(int) (Constants.SCREEN_WIDTH / 2 - rect.width() / 2),
					(int) (Constants.SCREEN_HEIGHT / 2 - rect.height() / 2),
					paint);
			}
		}
	}

	/* public */ /* int */ getWidth() {
		return this.gamePanel.getGamePanelWidth();
	}

	/* public */ /* int */ getHeight() {
		return this.gamePanel.getGamePanelHeight();
	}

	/* public */ /* void */ handleTouchDown(/* PointF */ touchPoint) {
		this.handleTouchDownOrMove(touchPoint);
	}

	/* public */ /* void */ handleTouchMove(/* PointF */ touchPoint) {
		this.handleTouchDownOrMove(touchPoint);
	}

	/** For this simple game, we treat single touches and touch movements as the same */
	/* public */ /* void */ handleTouchDownOrMove(/* PointF */ touchPoint) {

		if(!this.paused) {
			// Move vertical center of paddle to current touch
			this.paddle.setY( (int) (touchPoint.y - this.paddle.getHeight() / 2) );
		}

		if(this.gameOver && this.gameOverTime >= 200) {
			this.gameOver = false;
			this.gameOverTime = 0;
			this.score = 0;
			this.lives = 3;
			this.loadEnemies();
			this.resetBallAndTime();			
		}
	}

	/* public */ /* void */ handleTouchUp(/* PointF */ touchPoint) {

	}

	// Convenience accessor method so that Ball can detect collision
	/* public */ /* Paddle */ getPaddle() {
		return this.paddle;
	}
}

/* static */ /* boolean */ Game.colliding = function(/* Ball */ ball, /* Enemy */ enemy) {
	let ballRect = new Rect(ball.getX(), ball.getY(), ball.getX() + ball.getWidth(), ball.getY() + ball.getHeight());
	let enemyRect = new Rect(enemy.getX(), enemy.getY(), enemy.getX() + enemy.getWidth(), enemy.getY() + enemy.getHeight());

	if( Rect.intersects(ballRect, enemyRect) ) {
		return true;
	}

	return false;
};