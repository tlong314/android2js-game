class DrawView extends View {

    constructor(/* Context */ context) {
        super(context);
    }

    /* @Override */
	/* public */ /* void */ onDraw(/* Canvas */ canvas) {
        super.onDraw(canvas);

        let paint = new Paint();

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
        canvas.drawArc(new RectF(160, 120, 260, 220), 0, 180, false, paint);
    }
}