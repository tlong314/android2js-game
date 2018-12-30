package com.replacewithyourdomainname.canvastest;

import android.graphics.Canvas;
import android.app.Activity;
import android.view.*;
import android.os.Bundle;

class MainActivity extends Activity {

    @Override 
    protected  void  onCreate(/* Bundle  */ savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.setTitle("Canvas Demo");
        this.setContentView(new DrawView(this));
    }
}