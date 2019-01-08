package com.hfad.demogame;

import java.util.ArrayList;
import java.util.ArrayList;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.PointF;
import java.util.Random;
import android.graphics.Rect;
import android.view.MotionEvent;

public class Game {

    private Random random;
    private Ball ball;
    private Paddle paddle;
    private ArrayList<Enemy> enemies;
    private boolean started;
    private boolean gameOver;
    private boolean paused;
    private int score;
    private int lives;
    private int gameOverTime;
    private int timeBeforeStart;
    static final int INITIAL_TIME_BEFORE_START  = 200;
    private GamePanel gamePanel;

    public Game(GamePanel gamePanel) {

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

        int ballWidth = (int) ( Math.round( Constants.SCREEN_WIDTH / 40 ) );

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

        this.enemies = new ArrayList<Enemy>();
        this.loadEnemies();
    }

    public void loadEnemies() {
        int numEnemies = 5;
        int enemyWidth = (int) ( Math.round( Constants.SCREEN_WIDTH / 20 ) );
        int enemyHeight = (int) ( Math.round( Constants.SCREEN_WIDTH / 20 ) );

        BitmapFactory bitmapFactory = new BitmapFactory();
        Bitmap decodedBitmap = bitmapFactory.decodeResource(
            Constants.CURRENT_CONTEXT.getResources(),
            R.drawable.enemy_img);

        Bitmap enemyImage = Bitmap.createScaledBitmap(decodedBitmap,
            300,
            230,
            false);

        for(int i = 0; i < numEnemies; i++) {

            // Create random x position, at least halfway across the screen, but within screen bounds
            int enemyX = (int) ( Constants.SCREEN_WIDTH / 2 + this.random.nextInt( (int) ( Math.round(Constants.SCREEN_WIDTH / 2) - enemyWidth ) ) );

            // Create random y position, anywhere within screen bounds
            int enemyY = (int) (this.random.nextInt( (int) ( Math.round(Constants.SCREEN_HEIGHT - enemyHeight) ) ) );

            this.enemies.add(new Enemy(enemyImage, enemyX, enemyY, enemyWidth, enemyWidth, this));
        }
    }

    // Start the game animations
    public void start() {
        this.started = true;

        // We'll set the ball to move it's full length with each animation
        this.ball.setVelocityX( this.ball.getWidth() );
        this.ball.setVelocityY( this.ball.getWidth() );
    }

    public void pause() {
        this.paused = true;
    }

    public void unpause() {
        this.paused = false;
    }

    public void handleMiss() {

        this.resetBallAndTime();

        this.lives--;
        if(this.lives == 0) {
            this.gameOver = true;
        }
    }

    public void resetBallAndTime() {

        // Create random x position, about halfway across the screen
        int newX = (int) ( Constants.SCREEN_WIDTH / 2 + this.random.nextInt( this.ball.getWidth() * 3 ) );

        // Create random y position, anywhere within screen bounds
        int newY = (int) (this.random.nextInt( Math.round(Constants.SCREEN_HEIGHT - this.ball.getHeight()) ) );

        this.ball.setX( newX );
        this.ball.setY( newY );

        // Set ball's horizontal velocity away from the player
        this.ball.setVelocityX( Math.abs( this.ball.getVelocityX() ) );

        // Reset this time to allow a small delay
        this.timeBeforeStart = INITIAL_TIME_BEFORE_START;
    }

    public void update() {

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

        for(Enemy enemy : enemies) {
            enemy.update(); // This could be used for movement or image animation

            // Check for collision with ball, and respond
            if( Game.colliding(this.ball, enemy) ) {
                this.enemies.remove( enemy );
                this.score += 100;

                if(this.enemies.size() == 0) {
                    this.gameOver = true;
                }
            }
        }
    }

    public void draw(Canvas canvas) {
        Paint paint = new Paint();

        if(canvas == null) {
            return;
        }

        // Clear canvas and set current frame background to black
        canvas.drawColor(Color.BLACK);

        // Draw game elements
        this.paddle.draw(canvas);
        this.ball.draw(canvas);

        for(Enemy enemy : enemies) {
            enemy.draw(canvas);
        }

        paint.setColor(Color.WHITE);

        String livesText = "Lives: " + this.lives;
        String scoreText = "Score: " + this.score;
        Rect rect = new Rect();

        // Use Paint.getTextBounds to help position/center text
        paint.getTextBounds(livesText, 0, livesText.length (), rect);
        canvas.drawText("Lives: " + this.lives, (int) (Constants.SCREEN_WIDTH / 4 - rect.width() / 2), rect.height() * 3, paint);

        paint.getTextBounds(scoreText, 0, scoreText.length (), rect);
        canvas.drawText("Score: " + this.score, (int) (3 * Constants.SCREEN_WIDTH / 4 - rect.width() / 2), rect.height() * 3, paint);

        if(this.gameOver) {
            paint.setTextSize( 20 );
            paint.setColor( Color.YELLOW );

            // Enemies are all gone. You win!
            if(this.enemies.size() == 0) {
                String winText = "You win!";

                paint.getTextBounds(winText, 0, winText.length (), rect);
                canvas.drawText(winText,
                    (int) (Constants.SCREEN_WIDTH / 2 - rect.width() / 2),
                    (int) (Constants.SCREEN_HEIGHT / 2 - rect.height() / 2),
                    paint);

            } else if(this.lives == 0) { // Lives are all gone. You lose!
                String loseText = "Better luck next time!";

                paint.getTextBounds(loseText, 0, loseText.length (), rect);
                canvas.drawText(loseText,
                    (int) (Constants.SCREEN_WIDTH / 2 - rect.width() / 2),
                    (int) (Constants.SCREEN_HEIGHT / 2 - rect.height() / 2),
                    paint);
            }
        }
    }

    public int getWidth() {
        return this.gamePanel.getGamePanelWidth();
    }

    public int getHeight() {
        return this.gamePanel.getGamePanelHeight();
    }

    public void handleTouchDown(PointF touchPoint) {
        this.handleTouchDownOrMove(touchPoint);
    }

    public void handleTouchMove(PointF touchPoint) {
        this.handleTouchDownOrMove(touchPoint);
    }

    /** For this simple game, we treat single touches and touch movements as the same */
    public void handleTouchDownOrMove(PointF touchPoint) {

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

    public void handleTouchUp(PointF touchPoint) {

    }

    // Convenience accessor method so that Ball can detect collision
    public Paddle getPaddle() {
        return this.paddle;
    }

    static boolean colliding(Ball ball, Enemy enemy) {
        Rect ballRect = new Rect(ball.getX(), ball.getY(), ball.getX() + ball.getWidth(), ball.getY() + ball.getHeight());
        Rect enemyRect = new Rect(enemy.getX(), enemy.getY(), enemy.getX() + enemy.getWidth(), enemy.getY() + enemy.getHeight());

        if( Rect.intersects(ballRect, enemyRect) ) {
            return true;
        }

        return false;
    }/* ; */
}