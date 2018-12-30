class MainActivity extends Activity {

    /* @Override */
    /* protected */ /* void */ onCreate(/* Bundle  */ savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.setTitle("Canvas Demo");
        this.setContentView(new DrawView(this));
    }
}