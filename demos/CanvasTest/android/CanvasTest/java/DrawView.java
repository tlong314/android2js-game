package com.replacewithyourdomainname.canvastest;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.View;
import android.content.Context;

public class DrawView extends View {


	public DrawView(Context  context) {
        super(context);
    }

    @Override 
	public  void  onDraw(Canvas  canvas) {
        super.onDraw(canvas);

        Paint paint = new Paint();
        paint.setAntiAlias(true);

		// Fill the screen with white
        canvas.drawColor(Color.WHITE);

        // Draw a blue circle outline
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.BLUE);
        canvas.drawCircle(75, 100, 50, paint);

        // Draw a filled red rectangle
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.RED);
        canvas.drawRect(new Rect(150, 50, 250,  100), paint);
 
		// Draw a filled semicircle of a custom color
		paint.setARGB(255, 100, 200, 200);
        canvas.drawArc(new RectF(200, 200, 300, 300), 0, 180, false, paint);
    }
}