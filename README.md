# android2js-game

A JavaScript framework for JavaScript game developers to learn to make Android games and vice versa.

This library includes many objects based on Android Java classes, allowing developers to write JavaScript code as if they were writing native Android games. Conversely, it allows Android developers to quickly convert their native Android games to client-side web games.

This project is primary for learning. It provides objects/classes for JavaScript developers to more easily become comfortable with the Android Java environment.

## Usage

Add the android2js-game directory to your project's `js` folder (which should reside in the directory containing your index.html file). Include a reference to the android2js-game.css file and a reference to the android2js-game.js in your index.html file.

```html
<link rel="stylesheet" type="text/css" href="js/android2js-game/css/android2js-game.css" />

<script src="js/android2js-game/js/android2js-game.js"></script>
```

Write your JavaScript code as ECMAScript 5 classes, keep separate classes in separate .js files. Include a class named MainActivity as your initializing class.

```javascript
class MainAcivity extends Activity
```

Try to follow the rules suggested on this page:

https://timlongcreative.com/web-apps/android2jsgame-converter/

In particular, your MainActivity.js file should look like this:

```javascript
class MainActivity extends Activity {

    /* @Override */
    /* public */ /* void */ onCreate(/* Bundle */ savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Add other code here to initialize your game
    }
}
```

When you have a completed application, that runs without errors, save your project in a zip file and use the page above to convert the code. This conversion is not 100% accurate, so you may have to make further adjustments to the code afterwards. Test run the code (e.g., in AndroidStudio) and debug the errors that remain.

## License

This library is available free for use under the MIT license. The linked code converter above is available free for use under the MIT license.
