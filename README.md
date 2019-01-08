# android2js-game

A JavaScript framework for JavaScript game developers to learn to make Android games and vice versa.

This framework includes many objects based on Android Java classes, allowing developers to write JavaScript code as if they were writing native Android games. Conversely, it allows Android developers to quickly convert their native Android games to client-side web games.

This project is primarily for learning. It provides objects/classes for JavaScript developers to more easily become comfortable with the Android Java environment.

## Usage

Add the android2js-game directory to your project's `js` folder (which should reside in the directory containing your index.html file). Include a reference to the android2js-game.css file and a reference to the android2js-game.js in your index.html file.

```html
<link rel="stylesheet" type="text/css" href="js/android2js-game/css/android2js-game.css" />

<script src="js/android2js-game/js/android2js-game.js"></script>
```

Write your JavaScript code as ECMAScript 5 classes, keep separate classes in separate .js files. Include a class named `MainActivity` containing a method called `onCreate` as your initializing method.

```javascript
class MainActivity extends Activity
```

Try to follow the rules suggested on this page:

https://timlongcreative.com/web-apps/android2jsgame-converter/

In particular, your main-activity.js file should look like this:

```javascript
class MainActivity extends Activity {

    constructor() {}

    /* @Override */
    /* public */ /* void */ onCreate(/* Bundle */ savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Add other code here to initialize your game
    }
}
```

When you have a completed application, that runs without errors, save your project in a zip file and use the link above to convert the code. This conversion is not 100% accurate, so you may have to make further adjustments to the code afterwards; test run the code (e.g., in AndroidStudio) and debug the errors that remain.

## Options

In your HTML file after the inclusion of the android2js-game.js script, you can set some options globally. The game code will start after the page loads (which will occur after these globals are set). Since processes are set to begin as soon as the page loads, there is actually no need to initialize anything yourself; thus android2js-game.js does not have a constructor. Assign these values directly (see examples).

Android2JSGame.startOnEnterFullscreen - boolean. Determines if the game should not start until user triggers the page to enter fullscreen. This is preferred, as user action is generally required for some other processes to start (like playing audio). Default is `true`.

Android2JSGame.onload - function (or `null`). A basic callback for when all resources have loaded. Default is `null`.

Android2JSGame.allowTouchInput - boolean. Whether to detect screen touch events. Should only be set to false if your web-based game is aimed at mouse-driven devices. Default is `true`.

Android2JSGame.allowMouseInput - boolean. Whether to detect screen mouse events (which will be interpreted like touch events). Unnecessary for mobile web, but may be set to `true` if game will be played on mouse-driven devices. Default is `false`.

Android2JSGame.interruptToSleep - boolean. Whether to try and mimick Java Thread sleep() method more accurately. For a thread.sleep(msToWait) call: if this option is set to `false`, the current method will continue and then the program will sleep msToWait milliseconds before continuing next processes. If this option is set to `true`, the current method will essentially freeze the program at the current line of code for approximately msToWait milliseconds. This takes a lot of processing, so try to avoid. Generally avoid Thread sleep() calls altogether if possible. Default is `false`.

## License

android2js-game is available free for use under the MIT license.
