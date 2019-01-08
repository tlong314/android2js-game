package com.hfad.demogame;

import android.graphics.Canvas;
import android.graphics.Point;
import android.view.SurfaceHolder;

public class MainThread extends Thread {

    private Canvas canvas;
    private boolean running;
    private float averageFPS;
    static final int MAX_FPS  = 30;
    private SurfaceHolder surfaceHolder;
    private GamePanel gamePanel;

    public MainThread(SurfaceHolder surfaceHolder, GamePanel gamePanel) {
        super(); // Invoke the default Thread constructor

        this.surfaceHolder = surfaceHolder;
        this.gamePanel = gamePanel;

        this.averageFPS = 30.00f;
        this.running = false;
        this.canvas = new Canvas(); // For converter to identify type
        this.canvas = null;
    }

    public void setRunning(boolean running) {
        this.running = running;
    }

    public boolean getRunning() {
        return this.running;
    }

    public void sleep(int waitTime) {
        try {
            super.sleep(waitTime);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public Canvas getCanvas() {
        if(this.canvas != null)
            return this.canvas;
        else
            return this.surfaceHolder.lockCanvas();
    }

    @Override
    public void run() {

        // Set these vars to longs in Java version
        long startTime = 0L;
        long timeMillis = 1000L;
        timeMillis = 1000 / MAX_FPS; // Integer division - we will need integers for mseconds
        long waitTime = 0L;
        long frameCount = 0L;
        long totalTime = 0L;
        long targetTime = 1000L;
        targetTime = 1000 / MAX_FPS;

        if(this.running) { // Unnecessary in Java - used in JS version
             while(this.running) { // `while` here in JS will cause infinite loop and crash the page
                    startTime = System.nanoTime();
                    this.canvas = null;

                    try {
                        this.canvas = this.surfaceHolder.lockCanvas();
                         synchronized (surfaceHolder) {

                            // Here's where the gameplay is moved forward
                            this.gamePanel.updateAndDraw(this.canvas);
                         }
                    } catch(NullPointerException e) {
                        e.printStackTrace();
                    } finally {
                        if(this.canvas != null) {
                            try {
                                this.surfaceHolder.unlockCanvasAndPost(this.canvas);
                            } catch(NullPointerException e) {
                                e.printStackTrace();
                            }
                        }
                    }

                    timeMillis = System.nanoTime() - startTime / 1000000; // nano to millis
                    waitTime = targetTime - timeMillis;

                    try {
                        if(waitTime > 0) {
                            this.sleep(waitTime); // capping the frame rate
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }

                    totalTime += System.nanoTime() - startTime;
                    frameCount++;

                    if(frameCount == MAX_FPS) {
                        this.averageFPS = 1000 / ((totalTime / frameCount) / 1000000);
                        frameCount = 0;
                        totalTime = 0;
                    }
             }
        }
    }
}