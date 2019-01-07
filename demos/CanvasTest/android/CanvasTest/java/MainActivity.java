package com.hfad.canvastest;

import android.app.Activity;
import android.view.*;
import android.os.Bundle;
import android.graphics.Canvas;
import android.view.View;

public class MainActivity extends Activity {



    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.setTitle("Canvas Demo");
        this.setContentView(new DrawView(this));
    }
}