package com.hfad.demogame;

import android.app.Activity;
import android.view.*;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.media.MediaPlayer;
import android.view.View;
import android.view.Window;

public class MainActivity extends Activity {

    private MediaPlayer mediaPlayer;



    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Lock the orientation
        super.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

        // Remove title bar
        this.getWindow().setFlags( WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Get rid of title toolbar - useful for Android, but you may want to remove this line in JS (to avoid odd Google search results)
        this.requestWindowFeature(Window.FEATURE_NO_TITLE);

        Constants.CURRENT_CONTEXT = this;

        // Grab the device width and height and store these values in our Constants class
        DisplayMetrics dm = new DisplayMetrics();
        this.getWindowManager().getDefaultDisplay().getMetrics(dm);

        Constants.SCREEN_WIDTH = dm.widthPixels;
        Constants.SCREEN_HEIGHT = dm.heightPixels;

        this.mediaPlayer = MediaPlayer.create(Constants.CURRENT_CONTEXT, R.raw.demo_game_theme);
        this.mediaPlayer.setLooping(true);
        this.mediaPlayer.start();

        this.setContentView(new GamePanel(this));
    }

    @Override
    public void onStop() {
        super.onStop();

        this.mediaPlayer.stop();
        this.mediaPlayer.release();
    }
}