package com.hfad.demogame;

import android.graphics.Canvas;
import android.content.Context;
import android.graphics.Point;
import android.graphics.PointF;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.MotionEvent;
import android.view.View;

public class GamePanel extends SurfaceView  implements SurfaceHolder.Callback {

    private MainThread thread;
    private Game game;
    private int width;
    private int height;

    public GamePanel(Context context) {
        super(context);

        this.width = 0;
        this.width = Constants.SCREEN_WIDTH;

        this.height = 0;
        this.height = Constants.SCREEN_HEIGHT;

        this.getHolder().addCallback(this);
        Constants.CURRENT_CONTEXT = context;

        // Create the thread that will run the game loops
        this.thread = new MainThread(this.getHolder(), this);

        // Create the Game instance that will contain the game logic
        this.game = new Game(this);

        this.setFocusable(true);

        /** We need to comment this line out in Android, or it will create an extra MainThread instance. */
         // this.surfaceCreated(this.getHolder());
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {

    }

    @Override
    public void surfaceDestroyed(SurfaceHolder surfaceHolder){
        boolean retry = true;
        while(retry) {
            try {
                this.thread.setRunning(false);
                this.thread.join();
            } catch (Exception e) {
                e.printStackTrace();
            }

            retry = false;
        }
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        this.thread = new MainThread(this.getHolder(), this);

        this.thread.setRunning(true);
        this.thread.start(); // Start!
    }

    // getWidth() cannot be overridden in SurfaceView, so we rename
    public int getGamePanelWidth() {
        return this.width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    // getHeight() cannot be overridden in SurfaceView, so we rename
    public int getGamePanelHeight() {
        return this.height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public void updateAndDraw(Canvas canvas) {
        // These two lines are the "meat of the entire game"
        this.update();
        this.draw(canvas);
    }

    /** Custom code within this class should be added in the methods below */
    public void update() {

        // Game may not have been created before first thread calls to this method
        if(this.game == null) {
            return;
        }

        try {
            this.game.update();
        } catch(NullPointerException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void draw(Canvas canvas) {
        super.draw(canvas);

        // Game may not have been created before first thread calls to this method
        if(this.game == null) {
            return;
        }

        try {
            this.game.draw(canvas);
        } catch(NullPointerException e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = (float) (event.getX());
        float y = (float) (event.getY());

        switch(event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                this.game.handleTouchDown(new PointF(x, y));
                break;
            case MotionEvent.ACTION_MOVE:
                this.game.handleTouchMove(new PointF(x, y));
                break;
            case MotionEvent.ACTION_UP:
                this.game.handleTouchUp(new PointF(x, y));
                break;
        }

        return true;
    }

    public MainThread getThread() {
        return this.thread;
    }
}