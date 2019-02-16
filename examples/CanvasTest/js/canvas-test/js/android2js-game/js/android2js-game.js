/**
 * @overview Provides some functionality to ease moving code
 * between Android Java game code and JavaScript (HTML5) /
 * ECMAScript 6 code, and to help beginning game devs working
 * in one language to learn more about the other.
 * @author Tim S. Long <tim@timlongcreative.com>
 * @copyright Tim S. Long 2019
 * @license MIT
 */

/**
 * Android Studio Notes:
 *
 * In app/manifests/AndroidManifest.xml, replace the "android:label"
 * attribute value in <application> with the string you want to show as
 * the game title (for instance, you can add spaces here)
 *
 * Take your icon image, rename it "ic_launcher.png" and add it to the
 * "app/src/main/res/mipmap" folders. Alternately, save it as a custom
 * filename and replace the "android:icon" attribute value of <application>
 * to your filename.
 * Better yet, in newer versions of Android Studio, choose New ->
 * Image Asset, Icon Type: "Launcher Icons", "Asset Type": Image,
 * then choose the correct Path to the image.
 *
 * To include audio/video resources, create a directory named "raw"
 * within the app/res directory, and add the resources there.
 *
 * Remember that for Android, your custom image, audio, video, etc. files
 * should have filenames all in lowercase (use underscores to separate
 * words), such as my_img.png, some_song1.wav, etc.
 */

"use strict";

// These static methods are included in the Java Android Math class
Math.toRadians = function(deg) {
	return Math.PI * deg / 180;
};

Math.toDegrees = function(rad) {
	return 180 * rad / Math.PI;
};

Math.signum = Math.sign;

// Include a few static Integer class methods
class Integer {}
Integer.MAX_VALUE = Number.MAX_SAFE_INTEGER;
Integer.MIN_VALUE = Number.MIN_SAFE_INTEGER;

// A class to static references to file resources
class R {}

R.drawable ={};
R.layout = {};
R.raw = {};

// Standardize some method names
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || mozRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || mozCancelAnimationFrame;

window.navigator.vibrate = window.navigator.vibrate || window.navigator.webkitVibrate || window.navigator.mozVibrate;

window.hasVibrator = !!window.navigator.vibrate;
window.navigator.vibrate = window.navigator.vibrate || function() {};

/**
 * These are dynamically set with each load to avoid attempts to work around.
 * This is to remind the developer that there is no public Bitmap constructor,
 * and that SoundPool.Builder class has now replaced SoundPool constructor.
 */
const BITMAP_CONSTRUCTOR_KEY = Math.random();
const SOUND_POOL_CONSTRUCTOR_KEY = 1 + Math.random();

// Options
window.Android2JSGame = {
	onload: null,
	startOnEnterFullscreen: true,
	allowTouchInput: true,
	allowMouseInput: false,
	interruptToSleep: false
};

// Declare some "constants": game canvas, its context and dimensions
window.Android2JSGameCanvas; // HTMLCanvasElement
window.Android2JSGameCtx; // CanvasRenderingContext2D
window.Android2JSGameWidth; // number
window.Android2JSGameHeight; // number

window.Android2JSGamePreferredOrientation;

window.Android2JSGameFullscreenTriggers = []; // Buttons, etc., used to toggle fill screen
window.Android2JSGameActivities = []; // Activity class instances

window.Android2JSGameImageSources = [];
window.Android2JSGameImages = [];
window.Android2JSGameMediaSources = [];
window.Android2JSGameMediaFiles = [];
window.Android2JSGameElementsLoaded = 0;
window.Android2JSGameElementsToLoad = 0;

/**
 * Fonts will be stored as objects of this form:
 *
 *  "MyFont": {
 *	  name: "MyFont",
 *    path: "fonts/my-font.tff"
 *  }
 *
 */
window.Android2JSGameFonts = {};

window.Android2JSGameStorageTitle = "";
window.Android2JSGameStoredBodyMargin = "";

// Create clickable "fullscreen" button since JS requires user action for fs
window.Android2JSGameFSButton = document.createElement("IMG");

// Globally create a hidden div just for slowing down processes for thread.sleep
window.Android2JSGameSleepWaitDiv = document.createElement("DIV");
window.Android2JSGameSleepWaitDiv.style.width = "1px";
window.Android2JSGameSleepWaitDiv.style.height = "1px";
window.Android2JSGameSleepWaitDiv.style.display = "none"; // We need to hide it (or position it off screen)

// Check for Safari or Opera to attempt alternatives for various blocked JS features (fullscreen, onresize, orientation, media)
window.badApple = ~navigator.vendor.toLowerCase().indexOf("apple") && !!navigator.userAgent.match(/(safari)|(opera)/i);

// Wait for DOM to load, so that dev can define their own R class resources
window.addEventListener("DOMContentLoaded", function() {

	// Decide if we should interrupt all current processes during Thread sleep() method
	if(Android2JSGame.interruptToSleep) {
		Thread.prototype.sleep = Thread.prototype.freezeToSleep;
	}

	// If dev has not defined resources to preload, we'll do a quick sweep to find any defined in the classes
	if(!Object.keys(R.drawable).length && !Object.keys(R.raw).length) {

		// Assumes all class files are written in lower-spine-case or UpperCamelCase. One class per file.
		var classNames = Array.apply([], document.querySelectorAll("script")).filter(function(scriptTag){
				return (scriptTag.src && scriptTag.src.indexOf("android2js-game/js") === -1);
			}).map(function(scriptFile) {

				var splitSrc = scriptFile.src.replace(".js", "").split("/");
				var scriptSrc = splitSrc[splitSrc.length - 1];

				scriptSrc = scriptSrc.charAt(0).toUpperCase() + scriptSrc.substring(1);

				scriptSrc = scriptSrc.replace(/([a-z])\-([a-z])/g, function(match, endLetter, nextWordLetter) {
					return endLetter + nextWordLetter.toUpperCase();
				});

				return scriptSrc;
			});

		classNames.forEach(function(className ) {
			var drawableResources = eval( className ).toString().match(/R\.drawable\.([a-z_0-9])+/g);

			var rawResources = eval( className ).toString().match(/R\.raw\.([a-z_0-9])+/g);

			// Since global flag was set, these returned values will be null or arrays
			if(drawableResources) {
				for(var i = 0; i < drawableResources.length; i++) {
					var thisFilename = drawableResources[i].split(".").pop();
					R.drawable[thisFilename] = thisFilename;
				}
			}

			if(rawResources) { // Currently only supports audio. Video is a little out of our scope anyway...
				for(var i = 0; i < rawResources.length; i++) {
					var thisFilename = rawResources[i].split(".").pop();
					R.raw[thisFilename] = thisFilename;
				}
			}
		});
	}

	// Gather information about game images, audio, and video, to manage loading before running game
	window.Android2JSGameImageSources = Object.keys(R.drawable);
	window.Android2JSGameImages = new Array(window.Android2JSGameImageSources.length);

	window.Android2JSGameMediaSources = Object.keys(R.raw);
	window.Android2JSGameMediaFiles = new Array(window.Android2JSGameMediaSources.length);

	window.Android2JSGameElementsLoaded = 0;
	window.Android2JSGameElementsToLoad = window.Android2JSGameImageSources.length + window.Android2JSGameMediaSources.length;

	// Start loading image and media resources...
	Android2JSGamePreloadImagesAndMedia(Android2JSGameImageSources, Android2JSGameMediaSources);
});

/** Manages preloads, calling initiateAndroid2JSGame when resources are loaded. */
function Android2JSGameLoadElement() {
	Android2JSGameElementsLoaded++;

	if(Android2JSGameElementsLoaded === Android2JSGameElementsToLoad) {
		initiateAndroid2JSGame();
	}
}

/**
 * Initiates A2JS Game processes: defines game canvas and
 * canvas rendering context, adds the fullscreen button, etc.
 * Then calls to being game's MainActivity.
 */
function initiateAndroid2JSGame() {

	// Store this value to use for saving/storage
	window.Android2JSGameStorageTitle = document.title.replace(/\s/g, "__");

	// For simplicity we assume only one canvas on the screen (though "scenes" can be multiple JS objects).
	window.Android2JSGameCanvas = document.querySelector("canvas");

	// If no canvas exists in the page HTML, we'll create our own.
	if(window.Android2JSGameCanvas == null) {
		window.Android2JSGameCanvas = document.createElement("CANVAS");
		document.body.appendChild(window.Android2JSGameCanvas);
	}

	window.Android2JSGameCtx = window.Android2JSGameCanvas.getContext("2d");

	// Get dimensions for fullscreen
	window.Android2JSGameWidth = getFullscreenDimensions().width;
	window.Android2JSGameHeight = getFullscreenDimensions().height;

	window.Android2JSGameTurnPortraitToLS = document.createElement("DIV");
	window.Android2JSGameTurnPortraitToLS.innerHTML = "Turn device to landscape (or reduce browser height) to play";
	window.Android2JSGameTurnPortraitToLS.id = "turnToLandscape";
	window.Android2JSGameTurnLSToPortrait = document.createElement("DIV");
	window.Android2JSGameTurnLSToPortrait.innerHTML = "Turn device to portrait (or reduce browser width) to play";
	window.Android2JSGameTurnLSToPortrait.id = "turnToPortrait";

	document.body.appendChild( window.Android2JSGameTurnPortraitToLS );
	document.body.appendChild( window.Android2JSGameTurnLSToPortrait );

	window.Android2JSGameFSButton.style.margin = 0;
	
	if(Android2JSGame.startOnEnterFullscreen) {
		window.Android2JSGameFSButton.width = "100%";
		window.Android2JSGameFSButton.height = "100%";
		window.Android2JSGameFSButton.style.width = "100%";
		window.Android2JSGameFSButton.style.height = "100%";
		window.Android2JSGameFSButton.style.top = "0";
		window.Android2JSGameFSButton.style.right = "0";
	} else {
		window.Android2JSGameFSButton.width = "24";
		window.Android2JSGameFSButton.height = "16";
		window.Android2JSGameFSButton.style.width = "24px";
		window.Android2JSGameFSButton.style.height = "16px";
		window.Android2JSGameFSButton.style.top = "10px";
		window.Android2JSGameFSButton.style.right = "10px";
	}

	window.Android2JSGameFSButton.style.position = "fixed";
	window.Android2JSGameFSButton.style.zIndex = "100"; // Put above canvas
	window.Android2JSGameFSButton.id = "a2js_fs_btn"; // For CSS reference
	document.body.appendChild(window.Android2JSGameFSButton);
	window.Android2JSGameFSButton.src = "js/android2js-game/img/a2js_fs_btn.png";

	// Lets the dev define their own additional JS onload actions, like hiding a loading screen.
	if(typeof Android2JSGame.onload === "function") {
		Android2JSGame.onload();
	}

	// We set the fullscreen button to toggle fullscreen
	setFullscreenElement( window.Android2JSGameFSButton );

	// If we do not need to wait for the fullscreen button to be pressed, we'll go ahead and start the game
	if(!Android2JSGame.startOnEnterFullscreen) {

		// Start game activity processes
		let mainActivity = new MainActivity();
	}
}

/**
 * Sets source values for all game images, after applying
 * onload handler.
 */
function Android2JSGamePreloadImagesAndMedia(Android2JSGameImageSources, Android2JSGameMediaSources) {

	if(Android2JSGameImageSources.length === 0 && Android2JSGameMediaSources.length === 0) { // No images or media
		initiateAndroid2JSGame();
	} else {

		// If we have any image sources or media sources, one of these loops will trigger the program to initialize
		for(let i = 0, len = Android2JSGameImageSources.length; i < len; i++) {
			Android2JSGameImages[i] = new Image();
			Android2JSGameImages[i].onload = Android2JSGameLoadElement;
			Android2JSGameImages[i].src = `img/${Android2JSGameImageSources[i]}.png`;
		}

		for(let i = 0, len = Android2JSGameMediaSources.length; i < len; i++) {
			Android2JSGameMediaFiles[i] = new Audio();
			Android2JSGameMediaFiles[i].onloadeddata = Android2JSGameLoadElement;
			Android2JSGameMediaFiles[i].src = `audio/${Android2JSGameMediaSources[i]}.wav`;
		}
	}
}

/**
 * If image names are not stored statically, use this (with
 * appropriate PHP files) to read images folder.
 */
function Android2JSGameAjaxGetImages() {
	let xhr = new XMLHttpRequest();
	let imagesObj = {};

	xhr.onreadystatechange = function() {
		let result = this.resultText;

		imagesObj = JSON.parse( result );
		R.drawable = imagesObj;

		Android2JSGamePreloadImagesAndMedia(Android2JSGameImages);
	};

	xhr.open("GET", "/php/getgameresources.php?type=IMAGE", true);
	xhr.send();
}

// Some background to let us pretend we are using Android
String.prototype.equals = function(str) {
	if(typeof str !== "string") {
		throw new Error("Cannot read as String: " + str);
	}

	if(this === str) {
		return true;
	}

	return false;
};

String.valueOf = function(val) {
	return val.valueOf();
};

/**
 * We store some Java primitive reserved words for type casting. For this
 * to work in JS, remember to wrap whatever is being cast in parentheses.
 *
 * Example:
 *
 * let num;
 * num = (int) (Math.abs(-3.14159)); // Sets num to an integer
 * num = (int) Math.abs(-3.14159); // Throws a SyntaxError
 * 
 */
// For (int) type casting
try {
	var int;
	 window.int = function(n) {return parseInt(n, 10);};
} catch(e) {
	console.log("int is a reserve word");
}

// For (float) type casting
try {
	var float;
	window.float = function(n) {return parseFloat(n, 10);};
} catch(e) {
	console.log("float is a reserve word");
}

// For (double) type casting
try {
	var double;
	window.double = function(n) {return parseFloat(n, 10);};
} catch(e) {
	console.log("double is a reserve word");
}

/** Emulate Java System class; mainly used for logs and checking time */
window.System = {

	// Note: System.in method does not really make sense for Android

	out: {
		print: function(msg) {
			console.log(msg);
		},
		println: function(msg) {
			console.log(msg + "\n");
		}
	},
	exit: function(key) {
		if(key == 0) {
			window.close();
		}
	},
	nanoTime: function() {

		/**
		 * performance.now() is about as precise as JS can get. It is a double,
		 * in milliseconds, so we'll multiply by 1000000 to get nanoseconds.
		 */
		 return ( (performance.timing.navigationStart * 1000000) + (performance.now() * 1000000) );
	},
	currentTimeMillis() {
		return Date.now();
	},
	arraycopy: function(arr1, startIndex1, arr2, startIndex2, copyLength) {
		var arrToCopy = arr1.slice(startIndex1, copyLength);

		arr2.splice( startIndex2, copyLength,
			JSON.parse( JSON.stringify(arrToCopy) ) );
	}
};

const loadDateMs = new Date().getTime();
window.uptimeMillis = 0;

window.SystemClock = {

	// Returns time since load (`boot`) in milliseconds, including sleep
	elapsedRealTime: function() {
		return new Date().getTime() - loadDateMs;
	},

	// Returns time since load (`boot`) in milliseconds
	// We include sleep here for simplicity
	uptimeMillis: function() {
		window.uptimeMillis = performance.now();
		return window.uptimeMillis;
	}
};

/** Emulate Java Random class */
class Random {
	contructor() {} // Note: JavaScript Math.random does not allow a custom seed

	nextInt(cap) {
		if(typeof cap === "undefined") {
			return Math.floor(Math.random() * Math.pow(2, 32));
		}

		if(!Number.isInteger(cap)) {
			throw new Error("nextInt method does not accept a non-integer argument.");
		} else if(cap <= 0) {
			throw new Error("bound must be positive");
		} else {
			return Math.floor(Math.random() * cap);
		}
	}

	nextDouble() {
		return Math.random();
	}

	nextFloat() {
		return Math.random();
	}

	nextLong() {
		return Math.random();
	}

	nextBoolean() {
		return Math.random() < 0.5 ? true : false;
	}
}

/**
 * Mimicks the Java Color class, but we save values as
 * strings to ease working with JS canvas context.
 */
class Color extends String {

	// Default constructor creates an opaque black color
	constructor(str) {
		super(str);
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 255;
		return new String("rgb(0, 0, 0)");
	}

	alpha() {
		return this.a;
	}
	
	red() {
		return this.r;
	}
	
	green() {
		return this.g;
	}
	
	blue() {
		return this.b;
	}
}

/** Store some standard colors as static properties. Note: Java stores these as ints. */
Color.BLUE = "rgb(0, 0, 255)";
Color.RED = "rgb(255, 0, 0)";
Color.GREEN = "rgb(0, 255, 0)";
Color.WHITE = "rgb(255, 255, 255)";
Color.BLACK = "rgb(0, 0, 0)";
Color.YELLOW = "rgb(255, 255, 0)";
Color.CYAN = "rgb(0, 255, 255)";
Color.DKGRAY = "rgb(68, 68, 68)";
Color.GRAY = "rgb(136, 136, 136)";
Color.LTGRAY = "rgb(204, 204, 204)";
Color.MAGENTA = "rgb(255, 0, 255)";
Color.TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * Use this instead of class Java Color constructors.
 */
Color.makeColor = function(r, g, b) {
	return `rgb(${r}, ${g}, ${b})`;
};

Color.argb = function(a, r, g, b) {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

Color.rgb = function(r, g, b) {
	return `rgba(${r}, ${g}, ${b}, 1.0)`;
};

// Emulate a few standard Android game initialization processes
Window.FEATURE_NO_TITLE = 1;

class WindowManager {
	constructor() {}
}

WindowManager.LayoutParams = {
	FLAG_FULLSCREEN: 1024
};

/**
 * Emulate MotionEvent class. Currently used
 * mainly for touch events.
 */
class MotionEvent {
	constructor(e) {
		var canvas = e.target,
			rect = canvas.getBoundingClientRect(); // Not necessary if canvas enters fullscreen and all CSS styles apply

		this.x = [];
		this.y = [];
		this.pointerCount = 0;

		this.eventTime = System.currentTimeMillis();

		// Since we are assuming fullscreen, might not need the bounding rect
		switch(e.type) {
			case "touchstart":
				this.action = MotionEvent.ACTION_DOWN;
				this.pointerCount = e.targetTouches.length;

				for(var i = 0; i < this.pointerCount; i++) {
					this.x[i] = e.targetTouches[i].clientX - rect.left;
					this.y[i] = e.targetTouches[i].clientY - rect.top;
				}
				break;
			case "touchmove":
				this.action = MotionEvent.ACTION_MOVE;
				this.pointerCount = e.targetTouches.length;

				for(var i = 0; i < this.pointerCount; i++) {
					this.x[i] = e.targetTouches[i].clientX - rect.left;
					this.y[i] = e.targetTouches[i].clientY - rect.top;
				}
				break;
			case "touchend":
				this.action = MotionEvent.ACTION_UP;
				this.pointerCount = e.changedTouches.length;

				for(var i = 0; i < this.pointerCount; i++) {
					this.x[i] = e.changedTouches[i].clientX - rect.left;
					this.y[i] = e.changedTouches[i].clientY - rect.top;
				}
				break;
			
			// Handle actions if Android2JSGame.allowMouseInput is set to true
			case "mousedown":
				this.action = MotionEvent.ACTION_DOWN;
				this.pointerCount = 1;

				this.x[0] = e.clientX - rect.left;
				this.y[0] = e.clientY - rect.top;
				break;
			case "mousemove": // Only called if mouse is down
				this.action = MotionEvent.ACTION_MOVE;
				this.pointerCount = 1;

				this.x[0] = e.clientX - rect.left;
				this.y[0] = e.clientY - rect.top;
				break;
			case "mouseup":
				this.action = MotionEvent.ACTION_UP;
				this.pointerCount = 1;

				this.x[0] = e.clientX - rect.left;
				this.y[0] = e.clientY - rect.top;
				break;
		}
	}

	/* public string */ actionToString() {
		switch(this.action) {
			case MotionEvent.ACTION_DOWN:
				return "ACTION_DOWN";
			case MotionEvent.ACTION_UP:
				return "ACTION_UP";
			case MotionEvent.ACTION_MOVE:
				return "ACTION_MOVE";
			default:
				return this.action;
		}
	}

	getAction() {
		return this.action;
	}

	getX(pointNum=0) {
		return this.x[pointNum];
	}

	getY(pointNum=0) {
		return this.y[pointNum];
	}

	/**
	 * Not fully supported currently. Work in
	 * historical points for a single event
	 */
	getHistoricalX(pointNum=0, historyIndex) {
		return this.x[pointNum];
	}

	getHistoricalY(pointNum=0, historyIndex) {
		return this.y[pointNum];
	}

	getPointerCount() {
		return this.pointerCount;
	}

	/* public long */ getEventTime() {
		return this.eventTime;
	}
}

MotionEvent.ACTION_DOWN = 0;
MotionEvent.ACTION_MOVE = 1;
MotionEvent.ACTION_UP = 2;

// Emulates GestureDetector methods
class GestureDetector {
	constructor() {
		console.log("GestureDetector is not currently supported by android2js-game.js");
		
		this.context = arguments[0];
		this.gestureListener = arguments[1];
		this.handler;

		switch(arguments.length) {
			case 2: // Context, GestureDetector.OnGestureListener
				break;
			case 3: // Context, GestureDetector.OnGestureListener, Handler handler
			case 4: // Context, GestureDetector.OnGestureListener, Handler handler, boolean
				this.handler = arguments[2];
				break;
			default:
				throw new Error("GestureDetector class constructor does not support " + arguments.length + " arguments.");
		}
	}
}

/** Represents an interface, not a class. Included for reference. */
GestureDetector.OnGestureListener = function() {
	console.log("GestureDetector.OnGestureListener is an interface. Do not " +
	"invoke as a class.");
};

/** Represents an interface, not a class. Included for reference. */
GestureDetector.OnDoubleTapListener = function() {
	console.log("GestureDetector.OnDoubleTapListener is an interface. Do not " +
	"invoke as a class.");
};

/** Represents an interface, not a class. Included for reference. */
GestureDetector.OnContextClickListener = function() {
	console.log("GestureDetector.OnContextListener is an interface. Do not " +
	"invoke as a class.");
};

/**
 * These are added to prevent thrown errors but since we are
 * only creating simple games, we do not support all of these
 * specific gestures. Note, this implements all three interfaces
 * GestureDetector.OnGestureListener,
 * GestureDetector.OnDoubleTapListener, and
 * GestureDetector.OnContextClickListener.
 */
GestureDetector.SimpleOnGestureListener = class {
	constructor() {
		console.log("GestureDetector.SimpleOnGestureListener is not currently " + "supported by android2js-game.js");
	}

	onContextClick(motionEvent) {}
	onDoubleTap(motionEvent) {}
	onDoubleTapEvent(motionEvent) {}
	onDown(motionEvent) {}
	onFling(motionEvent) {}
	onLongPress(motionEvent) {}
	onScroll(motionEvent1, motionEvent2, distanceX, distanceY) {}
	onShowPress(motionEvent) {}
	onSingleTapConfirmed(motionEvent) {}
	onSingleTapUp(motionEvent) {}
};

/**
 * Methods and variables below attempt to correlate the screen dimensions
 * with physical dimensions, in particular for creating onscreen touch
 * controllers for mobile web games. However, there is currently no
 * way to accurately get the correct physical dimensions for all devices
 * from JavaScript. Try to avoid using physical controllers, or other
 * features that require physical measurements. For instance, use
 * touch controls on the game screen instead, and base in-game dimensions
 * on proportions to overall game screen.
 */

/**
 * Get screen DPI. Rarely exact. Based on method found in answers here:
 * https://stackoverflow.com/questions/279749/detecting-the-system-dpi-ppi-from-js-css
 */
function findFirstPositive(b, a, i, c) {
	c=(d,e)=>e>=d?(a=d+(e-d)/2,0<b(a)&&(a==d||0>=b(a-1))?a:0>=b(a)?c(a+1,e):c(d,a-1)):-1;

	for (i = 1; 0 >= b(i);)
		i *= 2;

	return c(i / 2, i)|0;
}

var firstPosCalculation = findFirstPositive(x => matchMedia(`(max-resolution: ${x}dpi)`).matches) / (window.devicePixelRatio || 1);

// Based on a few devices
const Android2JSGameDpi = Math.max(16 * ((648 + 80 * window.devicePixelRatio) / 7) / 15, firstPosCalculation);

/**
 * Creates a DisplayMetrics object.
 * Note: these values may not be exact.
 */
class DisplayMetrics {

	/** Initializes display metrics with screen dimensions. */
	constructor() {
		let pDepth = window.screen.pixelDepth || 24;

		this.widthPixels = getFullscreenDimensions().width;
		this.heightPixels = getFullscreenDimensions().height;

		this.densityDpi = Android2JSGameDpi;
		this.density = window.devicePixelRatio || 1;

		this.scaledDensity = this.density;
		this.DENSITY_DEVICE_STABLE = this.densityDpi;

		// Note quite accurate. See notes before findFirstPositive
		this.xdpi = this.densityDpi;
		this.ydpi = this.densityDpi;
	}
}

DisplayMetrics.DENSITY_DEFAULT = 160;
DisplayMetrics.DENSITY_HIGH = 240;
DisplayMetrics.DENSITY_LOW = 120;
DisplayMetrics.DENSITY_MEDIUM = 160;
DisplayMetrics.DENSITY_TV = 213;
DisplayMetrics.DENSITY_XHIGH = 320;
DisplayMetrics.DENSITY_XXHIGH = 480;
DisplayMetrics.DENSITY_XXXHIGH = 640;

class Context {
	constructor() {}

	getAssets() {
		return new AssetManager();
	}

	getResources() {
		return R;
	}

	getSystemService(service) {
		switch(service) {
			case Context.VIBRATOR_SERVICE:
				return new Vibrator();
			case Context.SENSOR_SERVICE:
				return new SensorManager();
			case Context.BATTERY_SERVICE:
				return new BatteryManager();
			case Context.LOCATION_SERVICE:
				return new LocationManager();

			// Similar to Activity.getWindowManager
			case Context.WINDOW_SERVICE:
				return {
					getDefaultDisplay: function() {
						return {
							getMetrics: function(dm) {
								dm.widthPixels = getFullscreenDimensions().width;
								dm.heightPixels = getFullscreenDimensions().height;
							}
						};
					}
				};
			default:
				console.warn("Service " + service + " not recognized by android2js-game.js");
		}
	}
}

/**
 * Some older browsers may still support the Battery API, but
 * let's assume it has been deprecated everywhere.
 */
class BatteryManager {
	constructor() {
		console.error("JavaScript's Battery API has been deprecated for security " + "reasons. Avoid using it in your web applications.");
	}

	isCharging() {
		let batteryIsCharging = false;

		if(typeof navigator.getBattery === "function") {
			
			/**
			 * May lead to inaccurate results, due to asynchronous
			 * behavior.
			 */
			navigator.getBattery().then(function(battery) {
				batteryIsCharging = battery.charging;
			});
			
			return batteryIsCharging;
		}
	}
}

/** Unnecessary for our simple games, especially dealing with security. */
class DownloadManaer {
	constructor() {}
}

/** May be included in a later version. */
class LocationManager {
	constructor() {}
}


/**
 * Most of these services are not supported by this library, and
 * the string references are included solely to prevent thrown
 * errors.
 */
Context.SENSOR_SERVICE = "sensor";
Context.VIBRATOR_SERVICE = "vibrator";

Context.LOCATION_SERVICE = "location";
Context.BATTERY_SERVICE = "batterymanager";
Context.DOWNLOAD_SERVICE = "download";

Context.WINDOW_SERVICE = "window";
Context.ACTIVITY_SERVICE = "activity";

Context.POWER_SERVICE = "power";
Context.ALARM_SERVICE = "alarm";
Context.NOTIFICATION_SERVICE = "notification";
Context.KEYGUARD_SERVICE = "keyguard";
Context.SEARCH_SERVICE = "search";

Context.CONNECTIVITY_SERVICE = "connection";
Context.IPSEC_SERVICE = "ipsec";
Context.WIFI_AWARE_SERVICE = "wifiaware";
Context.UI_MODESERVICE = "uimode";

Context.JOB_SCHEDULER_SERVICE = "taskmanager";
Context.NETWORK_STATS_SERVICE = "netstats";
Context.HARDWARE_PROPERTIES_SERVICE = "hardware_properties";

class ActivityInfo {}
ActivityInfo.SCREEN_ORIENTATION_PORTRAIT = 1;
ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE = 0;
ActivityInfo.SCREEN_ORIENTATION_LOCKED = 14;

class Activity extends Context {
	constructor() {
		super();

		let localStorageResponse = null;

		try {
			localStorageResponse = localStorage.getItem("Android2JSGame_" + window.Android2JSGameStorageTitle);
		} catch(e) {
			console.error("Cannot read saved instance state due to security restrictions on localStorage.");
			localStorageResponse = null;
		}

		let savedInstanceState = JSON.parse(localStorageResponse || "null");

		this.contentView = new View();
		this.onCreate(savedInstanceState);
		this.onStart();
		this.onResume();

		let self = this;

		window.addEventListener("visibilitychange", function() {
			if(document.visibilityState === "hidden") {
				self.onSaveInstanceState(null);
			} else {
				
				let sessionStorageResponse = null;
				
				try {
					sessionStorageResponse = sessionStorage.getItem("Android2JSGame_" + window.Android2JSGameStorageTitle)
				} catch(e) {
					console.error("Cannot set saved instance state due to security restrictions on sessionStorage.");
					sessionStorageResponse = null;
				}

				self.onRestoreInstanceState(
					JSON.parse(sessionStorageResponse  || "null" )
				);
			}
		}, false);

		window.addEventListener("beforeunload", function() {
			self.onPause();
			self.onStop();
			self.onDestroy();
		}, false);

		// Store reference for screen resizing events
		window.Android2JSGameActivities.push( this );

		let pathname = window.location.pathname;
		let basicState = pathname.split("/")[ pathname.split("/").length - 1 ];

		// Handle page refresh
		if( window.location.href.indexOf("?running=true") !== -1) {
			window.history.replaceState({}, "Reset state", basicState);
		}

		window.history.pushState({}, "Default state", basicState + "?running=true");

		let storedActivity = this;

		// Handle "back" button press
		window.onpopstate = function() {

			// Invoke any custom back button operations
			storedActivity.onBackPressed();

			// Give 1 second for user to hit back again to leave the webpage
			setTimeout(function() {
				
				// Return to the state where pressing back keeps us in the game
				window.history.pushState({}, "Default state", basicState + "?running=true");
			}, 1000);
		};
	}

	onCreate(bundle) {}
	onStart() {}
	onResume() {}
	onPause() {}
	onStop() {}
	onDestroy() {}

	onSaveInstanceState(bundle) {
		try {
			sessionStorage.setItem("Android2JSGame_" + window.Android2JSGameStorageTitle, JSON.stringify(bundle) );
		} catch(e) {
			console.error("Cannot save instance state due to security restrictions on sessionStorage.");
		}
	}

	onRestoreInstanceState(bundle) {
		let sessionStorageResponse = null;

		try {
			sessionStorageResponse = sessionStorage.getItem("Android2JSGame_" + window.Android2JSGameStorageTitle);
		} catch(e) {
			console.error("Cannot retrieve saved instance state due to security restrictions on sessionStorage.");
			sessionStorageResponse = null;
		}

		bundle = JSON.parse(sessionStorageResponse  || "null");
	}

	// newTitle can be an int identifier, or a CharSequence
	setTitle(newTitle) {
		document.title = newTitle;
	}

	/**
	 * Attempts to lock the device in portrait or landscape mode.
	 * @param {string} orientation - Should be ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
	 * or ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
	 * @returns {boolean} True if successful, false otherwise.
	 * @static
	 */
	setRequestedOrientation(orientation) {
		if(orientation === ActivityInfo.SCREEN_ORIENTATION_PORTRAIT) {
			setPageOrientation("portrait");
		} else if(orientation === ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE) {
			setPageOrientation("landscape");
		}
	}

	getWindow() {
		if(typeof window.setFlags !== "function") {
			window.setFlags = function(prevFlag, newFlag) {
				if(newFlag === WindowManager.LayoutParams.FLAG_FULLSCREEN) {
					setFullscreenElement( window.Android2JSGameFSButton );
				}
			};
		}

		if(typeof window.addFlags !== "function") {
			window.addFlags = function(newFlag) {
				if(newFlag === WindowManager.LayoutParams.FLAG_FULLSCREEN) {
					setFullscreenElement( window.Android2JSGameFSButton );
				}
			};
		}

		return window;
	}

	getWindowManager() {
		return {
			getDefaultDisplay: function() {
				return {
					getMetrics: function(dm) {
						dm.widthPixels = getFullscreenDimensions().width;
						dm.heightPixels = getFullscreenDimensions().height;
					}
				};
			}
		};
	}

	requestWindowFeature(feature)  {
		if(feature === Window.FEATURE_NO_TITLE) {

			/**
			 * Setting to an empty string or spaces will just display
			 * the page filename, but we can set it to a single character.
			 * Uncomment the line below for this effect, but note, removing
			 * a webpage's title affects search results, and is unnecessary
			 * for a fullscreen web application, as tabs are hidden.
			 */
			// document.title = ".";
		}
	}

	getResources() {
		return {
			getDisplayMetrics: function() {
				return new DisplayMetrics();
			},
			getDrawablePath: function() {
				return "img/";
			}
		};
	}

	getSharedPreferences(prefName, prefMode) {
		return new SharedPreferences(prefName, prefMode);
	}

	setContentView(passedContentView) {
		if(typeof passedContentView !== "undefined") {
			this.contentView = passedContentView;
		} else {
			throw new Error("No View instance passed to Activity.setContentView");
		}

		window.Android2JSGameCanvas.style.display = "block";

		window.Android2JSGameCanvas.style.width = (window.Android2JSGameCanvas.width
			= window.Android2JSGameWidth) + "px";

		window.Android2JSGameCanvas.style.height = (window.Android2JSGameCanvas.height
			= window.Android2JSGameHeight) + "px";

		this.contentView.onDraw(new Canvas(window.Android2JSGameCanvas));
	}

	/**
	 * This method is meant to be overridden by your own definition of what
	 * should happen when the user presses the back button.
	 */
	onBackPressed() {
		window.history.back();
	}
}

/**
 * Note: for games, we currently still prefer the Activity class to AppCompatActivity.
 */
class AppCompatActivity extends Activity {
	constructor() {
		super();
	}
}

/** Unused, included only to prevent thrown errors. */
class ActivityManager {
	constructor() {
		console.error("ActivityManager class is not supported by android2js-game.js " +
		"and is recommended only for debugging purposes (not for runtime).");
	}
}

/** Resources class for accessing files, etc. */
class Resources {
	constructor() {}
}

/** AssetManager class */
class AssetManager {
	constructor() {}

	// Return contents of file located at assets/{filename}
	open(filename) {
		let inputStream = new InputStream();
		inputStream.filepath = "assets/" + filename;

		xhr.onreadystatechange = function() {
			inputStream.internalFileContents = this.resultText;
		};

		xhr.open("GET",
			"/php/getgameresources.php?type=ASSET&file=" + filename, false);
		xhr.send();

		return inputStream;
	}
}

/** InputStream instance, used for accessing files. */
class InputStream {
	constructor() {
		this.internalFileContents = null;
		this.inputStream.filepath = "";
		this.streamRequest = new XMLHttpRequest();
	}

	close() {
		this.streamRequest.abort();
	}
}

/**
 * Handle resize events. A dev may want to add extra code into here.
 */
window.addEventListener("resize", function() {

	// Currently we are assuming the window resize ins entering fullscreen
	window.Android2JSGameWidth = getFullscreenDimensions().width;
	window.Android2JSGameHeight = getFullscreenDimensions().height;

	window.Android2JSGameActivities.forEach(function(elm, index, fullArr) {
		elm.setContentView( elm.contentView ); // Resize view to new screen dimensions
	});
}, false);

/**
 * Prevent a touchscreen's contextmenu from showing up when user
 * holds down a touch for a long time.
 */
window.oncontextmenu = function() {
	return false;
};

/** Emulate the Point class. Note in Android Java, a Point's x and y values are static (no getX() or getY() methods) */
class Point {
	constructor(x, y) {
		if(typeof y === "undefined") {
			if(typeof x === "undefined") {
				this.x = 0;
				this.y = 0;
			} else if(x instanceof Point) { // Only one argument, so should be another Point
				this.x = x.x;
				this.y = x.y;
			} else {
				throw new Error(x + " is not an instance of class Point.");
			}
		} else { // Both x and y exist
			if(!Number.isInteger(x) || !Number.isInteger(y)) {
				throw new Error("Point class constructor requires integer " +
					"arguments. Use PointF for float values.");
			} else {
				this.x = x;
				this.y = y;
			}
		}
	}

	equals(x, y) {
		if(typeof y === "undefined") {
			if(!x instanceof Point) {
				throw new Error(x + " is not an instance of class Point.");
			}

			if(this.x === x.x && this.y === x.y) {
				return true;
			}
		} else {
			if(this.x === x && this.y === y) {
				return true;
			}
		}

		return false;
	}

	negate() {
		this.x *= -1;
		this.y *= -1;
	}

	offset(dx, dy) {
		this.x += dx;
		this.y += dy;
	}
}

Point.prototype.set = function(newX, newY) {
	this.x = newX;
	this.y = newY;
};

/** Emulate the Point class. Note in Android Java, a PointF's x and y values are static (no getX() or getY() methods) */
class PointF {
	constructor(x, y) {
		if(typeof y === "undefined") {
			if(typeof x === "undefined") {
				this.x = 0;
				this.y = 0;
			} else if(x instanceof PointF) { // Only one argument, so should be another Point
				this.x = x.x;
				this.y = x.y;
			} else {
				throw new Error(x + " is not an instance of class PointF.");
			}
		} else { // Both x and y exist
			this.x = x;
			this.y = y;
		}
	}

	equals(x, y) {
		if(typeof y === "undefined") {
			if(!x instanceof PointF) {
				throw new Error(x + " is not an instance of class PointF.");
			}

			if(this.x === x.x && this.y === x.y) {
				return true;
			}
		} else {
			if(this.x === x && this.y === y) {
				return true;
			}
		}

		return false;
	}

	length(otherX=0, otherY=0) {
		var distance = Math.sqrt( Math.pow(this.x - otherX, 2) +
			Math.pow(this.y - otherY, 2) );

		return distance;
	}

	negate() {
		this.x *= -1;
		this.y *= -1;
	}

	offset(dx, dy) {
		this.x += dx;
		this.y += dy;
	}
}

PointF.prototype.set = function(newX, newY) {
	this.x = newX;
	this.y = newY;
};

// Mimick the Java Android Rect class
class Rect {
	constructor(left, top, right, bottom) {
		if(arguments.length === 0) {
			this.left = 0;
			this.top = 0;
			this.right = 0;
			this.bottom = 0;
		} else if(arguments.length === 1) {
			if(arguments[0] instanceof Rect) {
				this.left = arguments[0].left;
				this.top = arguments[0].top;
				this.right = arguments[0].right;
				this.bottom = arguments[0].bottom;
			} else {
				throw new Error("Rect class 1-argument constructor must be" +
				" of an instance of Rect.");
			}
		} else {
			if(!Number.isInteger(left) || !Number.isInteger(top) || !Number.isInteger(right) || !Number.isInteger(bottom)) {
				throw new Error("Rect class 4-argument constructor requires " +
					"integer arguments. Use RectF for float values.");
			} else {
				this.left = left;
				this.top = top;
				this.right = right;
				this.bottom = bottom;
			}
		}
	}

	centerX() {
		return Math.round((this.left + this.width()) / 2);
	}

	centerY() {
		return Math.round((this.top + this.height()) / 2);
	}

	exactCenterX() {
		return (this.left + this.width()) / 2;
	}

	exactCenterY() {
		return (this.top + this.height()) / 2;
	}

	contains() {
		switch(arguments.length) {
			case 1: // contains(Rect rect)
				let rect = arguments[0];

				if(this.left <= rect.left && this.top <= rect.top && this.right >= rect.right && this.bottom >= rect.bottom) {
					return true;
				} else {
					return false;
				}
				break;
			case 2: // contains(int x, int y)
				let point = new Point(arguments[0], arguments[1]);

				if(this.left <= point.x && point.x <= this.right && this.top <= point.y && point.y <= this.bottom) {
					return true;
				} else {
					return false;
				}
				break;
			case 4: // contains int left, int top, int right, int bottom
				if(this.left <= arguments[0] && this.top <= arguments[1] && this.right >= arguments[2] && this.bottom >= arguments[3]) {
					return true;
				} else {
					return false;
				}
				break;
			default: {
				throw new Error("Invalid number of arguments for Rect.contains");
			}
		}
	}

	width() {
		return this.right - this.left;
	}

	height() {
		return this.bottom - this.top;
	}

	intersect() {
		let left;
		let topY;
		let right;
		let bottom;
		let otherRect = null;
		let intersecting = false;
		let intersection; // Rect

		if(arguments.length === 4) {
			left = arguments[0];
			topY = arguments[1]; // Note: window.top exists in JS
			right = arguments[2];
			bottom = arguments[3];
		} else if(arguments.length === 1) {
			left = arguments[0].left;
			topY = arguments[0].top;
			right = arguments[0].right;
			bottom = arguments[0].bottom;
		} else {
			throw new Error("Invalid number of arguments for (Rect).intersect");
		}

		otherRect = new Rect(left, top, right, bottom);

		if(Rect.intersects(this, otherRect)) {
			intersecting = true;

			let intLeft = Math.max(this.left, otherRect.left);
			let intTop = Math.max(this.top, otherRect.top);
			let intRight = Math.min(this.right, otherRect.right);
			let intBottom = Math.min(this.bottom, otherRect.bottom);

			intersection = new Rect(intLeft, intTop, intRight, intBottom);
			this.set(intersection);
		}

		return intersecting;
	}

	intersects() {
		if(arguments.length === 4) {
			let left = arguments[0];
			let topY = arguments[1]; // Note: window.top exists in JS. Be careful!
			let right = arguments[2];
			let bottom = arguments[3];

			let rect = new Rect(left, topY, right, bottom);

			return Rect.intersects(this, rect);
		} else {
			throw new Error("Invalid number of arguments for (Rect).intersects. To check if two Rects intersect,\n"
				+ "use static method Rect.intersects(rect1, rect2)");
		}
	}

	union() {
		let left;
		let topY;
		let right;
		let bottom;
		let otherRect = null;
		let unionRect;

		if(arguments.length === 4) {
			left = arguments[0];
			topY = arguments[1]; // Note: window.top exists in JS
			right = arguments[2];
			bottom = arguments[3];
		} else if(arguments.length === 2) { // x, y
			left = arguments[0];
			topY = arguments[1];
			right = arguments[0] + 1;
			bottom = arguments[1] + 1;
		} else if(arguments.length === 1) { // Rect
			left = arguments[0].left;
			topY = arguments[0].top;
			right = arguments[0].right;
			bottom = arguments[0].bottom;
		} else {
			throw new Error("Invalid number of arguments for (Rect).union");
		}

		otherRect = new Rect(left, top, right, bottom);

		let intLeft = Math.min(this.left, otherRect.left);
		let intTop = Math.min(this.top, otherRect.top);
		let intRight = Math.max(this.right, otherRect.right);
		let intBottom = Math.max(this.bottom, otherRect.bottom);

		unionRect = new Rect(intLeft, intTop, intRight, intBottom);
		this.set(unionRect);
	}

	isEmpty() {
		return (this.left >= this.right || this.top >= this.bottom);
	}

	setEmpty() {
		this.left = 0;
		this.top = 0;
		this.right = 0;
		this.bottom = 0;
	}

	sort() {
		if(this.right > this.left) {
			let oldLeft = this.left;
			this.left = this.right;
			this.right = oldLeft;
		}

		if(this.bottom > this.top) {
			let oldTop = this.top;
			this.top = this.bottom;
			this.bottom = oldTop;
		}
	}
}

Rect.prototype.set = function(left, top, right, bottom) {
	if(left instanceof Rect) {
		let rect = left;
		this.left = left.left;
		this.top = left.top;
		this.right = left.right;
		this.bottom = left.bottom;
	} else {
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	}
};

Rect.intersects = function(rect1, rect2) {
	if((rect1.left <= rect2.right && rect1.right >= rect2.left))	{
		if(rect1.top <= rect2.bottom && rect1.bottom >= rect2.top) {
			return true;
		}
	}

	return false;
};

class RectF {
	constructor(left, top, right, bottom) {
		if(arguments.length === 0) {
			this.left = 0;
			this.top = 0;
			this.right = 0;
			this.bottom = 0;
		} else if(arguments.length === 1) {
			if(arguments[0] instanceof RectF) {
				this.left = arguments[0].left;
				this.top = arguments[0].top;
				this.right = arguments[0].right;
				this.bottom = arguments[0].bottom;
			} else {
				throw new Error("RectF class 1-argument constructor must be" +
				" of an instance of RectF.");
			}
		} else {
			if(typeof left !== "number" || typeof top  !== "number" || typeof right  !== "number" || typeof bottom !== "number") {
				throw new Error("RectF class 4-argument constructor requires " +
					"number arguments.");
			} else {
				this.left = left;
				this.top = top;
				this.right = right;
				this.bottom = bottom;
			}
		}
	}

	centerX() {
		return Math.round((this.left + this.width()) / 2);
	}

	centerY() {
		return Math.round((this.top + this.height()) / 2);
	}

	exactCenterX() {
		return (this.left + this.width()) / 2;
	}

	exactCenterY() {
		return (this.top + this.height()) / 2;
	}

	contains() {
		switch(arguments.length) {
			case 1: // contains(RectF rect)
				let rect = arguments[0];

				if(this.left <= rect.left && this.top <= rect.top && this.right >= rect.right && this.bottom >= rect.bottom) {
					return true;
				} else {
					return false;
				}
				break;
			case 2: // contains(int x, int y)
				let point = new Point(arguments[0], arguments[1]);

				if(this.left <= point.x && point.x <= this.right && this.top <= point.y && point.y <= this.bottom) {
					return true;
				} else {
					return false;
				}
				break;
			case 4: // contains int left, int top, int right, int bottom
				if(this.left <= arguments[0] && this.top <= arguments[1] && this.right >= arguments[2] && this.bottom >= arguments[3]) {
					return true;
				} else {
					return false;
				}
				break;
			default: {
				throw new Error("Invalid number of arguments for RectF.contains");
			}
		}
	}

	width() {
		return this.right - this.left;
	}

	height() {
		return this.bottom - this.top;
	}

	intersect() {
		let left;
		let topY;
		let right;
		let bottom;
		let otherRectF = null;
		let intersecting = false;
		let intersection; // RectF

		if(arguments.length === 4) {
			left = arguments[0];
			topY = arguments[1]; // Note: window.top exists in JS
			right = arguments[2];
			bottom = arguments[3];
		} else if(arguments.length === 1) {
			left = arguments[0].left;
			topY = arguments[0].top;
			right = arguments[0].right;
			bottom = arguments[0].bottom;
		} else {
			throw new Error("Invalid number of arguments for (RectF).intersect");
		}

		otherRectF = new RectF(left, top, right, bottom);

		if(RectF.intersects(this, otherRectF)) {
			intersecting = true;

			let intLeft = Math.max(this.left, otherRectF.left);
			let intTop = Math.max(this.top, otherRectF.top);
			let intRight = Math.min(this.right, otherRectF.right);
			let intBottom = Math.min(this.bottom, otherRectF.bottom);

			intersection = new RectF(intLeft, intTop, intRight, intBottom);
			this.set(intersection);
		}

		return intersecting;
	}

	intersects() {
		if(arguments.length === 4) {
			let left = arguments[0];
			let topY = arguments[1]; // Note: window.top exists in JS
			let right = arguments[2];
			let bottom = arguments[3];

			let rectF = new RectF(left, topY, right, bottom);

			return RectF.intersects(this, rectF);
		}  else {
			throw new Error("Invalid number of arguments for (RectF).intersects. To check if two RectFs intersect,\n"
				+ "use static method RectF.intersects(rectf1, rectf2)");
		}
	}

	union() {
		let left;
		let topY;
		let right;
		let bottom;
		let otherRectF = null;
		let unionRectF;

		if(arguments.length === 4) {
			left = arguments[0];
			topY = arguments[1]; // Note: window.top exists in JS
			right = arguments[2];
			bottom = arguments[3];
		} else if(arguments.length === 2) { // x, y
			left = arguments[0];
			topY = arguments[1];
			right = arguments[0] + 1;
			bottom = arguments[1] + 1;
		} else if(arguments.length === 1) { // RectF
			left = arguments[0].left;
			topY = arguments[0].top;
			right = arguments[0].right;
			bottom = arguments[0].bottom;
		} else {
			throw new Error("Invalid number of arguments for (RectF).union");
		}

		otherRectF = new RectF(left, top, right, bottom);

		let intLeft = Math.min(this.left, otherRectF.left);
		let intTop = Math.min(this.top, otherRectF.top);
		let intRight = Math.max(this.right, otherRectF.right);
		let intBottom = Math.max(this.bottom, otherRectF.bottom);

		unionRectF = new RectF(intLeft, intTop, intRight, intBottom);
		this.set(unionRectF);
	}

	isEmpty() {
		return (this.left >= this.right || this.top >= this.bottom);
	}

	setEmpty() {
		this.left = 0;
		this.top = 0;
		this.right = 0;
		this.bottom = 0;
	}

	sort() {
		if(this.right > this.left) {
			let oldLeft = this.left;
			this.left = this.right;
			this.right = oldLeft;
		}

		if(this.bottom > this.top) {
			let oldTop = this.top;
			this.top = this.bottom;
			this.bottom = oldTop;
		}
	}
}

RectF.prototype.set = function(left, top, right, bottom) {
	if(left instanceof RectF) {
		let rect = left;
		this.left = left.left;
		this.top = left.top;
		this.right = left.right;
		this.bottom = left.bottom;
	} else {
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	}
};

RectF.intersects = function(rect1, rect2) {
	if((rect1.left <= rect2.right && rect1.right >= rect2.left))	{
		if(rect1.top <= rect2.bottom && rect1.bottom >= rect2.top) {
			return true;
		}
	}

	return false;
};

/** BitmapFactory class, used to create Bitmaps from files. */
class BitmapFactory {
	constructor() {}

	decodeResource(resourcesReference, resourcePath) {

		return new Bitmap(BITMAP_CONSTRUCTOR_KEY,
			resourcesReference.getDrawablePath(),
			resourcePath);
	}

	decodeStream(istream, paddingRect, option) {
		return new Bitmap(BITMAP_CONSTRUCTOR_KEY,
			"assets/",
			istream.filepath.replace("assets/", ""));
	}
}

/**
 * Class to create a Bitmap for drawing to the screen. Note: in
 * Android Java, you cannot use new Bitmap() to create a new
 * Bitmap instance. Instead use Bitmap.createBitmap or 
 * BitmapFactory.decodeResource.
 */
class Bitmap {
	constructor(bitmapConstructorKey, resourcesDirectory, resourcePath) {

		if(bitmapConstructorKey !== BITMAP_CONSTRUCTOR_KEY) {
			console.error("There is no Bitmap constructor in Android Java. " +
				"Use Bitmap.createBitmap instead.");
		}

		this.image = new Image();
		this.config = Bitmap.Config.ARGB_8888; // Current standard

		this.mutable = false;

		if(arguments.length === 4) { // key (for A2JS), width, height, Bitmap.Config
			this.config = arguments[3];
			return this;
		}

		this.canvas = document.createElement("CANVAS");
		this.ctx = this.canvas.getContext("2d");

		let storedBitmap = this;
		this.image.onload = function() {

			// Bitmaps are more similar to <canvas> elements than <img> so our end goal will be treating these as canvases
			let dmDensity = new DisplayMetrics().density;
			storedBitmap.width = this.width * dmDensity;
			storedBitmap.height = this.height * dmDensity;

			storedBitmap.canvas.width = this.width * dmDensity;
			storedBitmap.canvas.style.width = (this.width * dmDensity) + "px";
			storedBitmap.canvas.height = this.height * dmDensity;
			storedBitmap.canvas.style.height = (this.height * dmDensity) + "px";

			/**
			 * In deciding whether to set the canvas background to the image
			 * or simply draw the image first, note: drawing the background will
			 * preserve that background after any canvas pixel data is cleared.
			 * However, the image would then not be carried over when drawing
			 * a canvas into another canvas. Rather than dealing with the
			 * intricacies of redrawing this image when a small portion of the
			 * canvas is cleared, we will choose one process or the other. Both
			 * options come with intricacies that we will avoid for convenience,
			 * as this library's main purpose is simply for testing and learning.
			 */
			// storedBitmap.canvas.style.background = "url(" + this.src + ")";
			storedBitmap.ctx.drawImage(this, 0, 0);
		};

		/**
		 * Note: there is no Bitmap constructor; these are specific to this
		 * JS library and are used in conjunction with Bitmap.createBitmap.
		 */

		if(arguments[1] instanceof Bitmap) {
			this.image.src = arguments[1].image.src;
			return this;
		}

		if(arguments[1] === null) {
			this.image.src = this.canvas.toDataURL();
			return this;
		}

		// We are currently assuming all resource images are .png files
		this.image.src = resourcesDirectory + resourcePath + ".png";
		return this;
	}

	copy() {
		let copiedBitmap = new Bitmap(BITMAP_CONSTRUCTOR_KEY);
		copiedBitmap.width = this.width;
		copiedBitmap.height = this.height;
		copiedBitmap.canvas = this.canvas;
		copiedBitmap.ctx = this.ctx;
		copiedBitmap.canvas.width = this.canvas.width;
		copiedBitmap.canvas.style.width = this.canvas.style.width;
		copiedBitmap.canvas.height = this.canvas.height;
		copiedBitmap.canvas.style.height = this.canvas.style.height;
		copiedBitmap.image = this.image;
		copiedBitmap.ctx.drawImage(copiedBitmap.image);
		copiedBitmap.mutable = true;

		return copiedBitmap;
	}

	getWidth() {
		return this.image.width;
	}

	setWidth(width) {
		this.image.width = width;

		let dmDensity = new DisplayMetrics().density;
		this.width = this.image.width * dmDensity;

		this.canvas.width = this.width * dmDensity;
		this.canvas.style.width = (this.width * dmDensity) + "px";
		this.ctx.drawImage(this.image, 0, 0);
	}

	getHeight() {
		return this.image.height;
	}

	setHeight(height) {
		this.image.height = height;

		let dmDensity = new DisplayMetrics().density;
		this.height = this.image.height * dmDensity;

		this.canvas.width = this.width * dmDensity;
		this.canvas.style.width = (this.width * dmDensity) + "px";
		this.ctx.drawImage(this.image, 0, 0);
	}

	setConfig(newConfig) {
		this.config = newConfig;
	}

	getConfig() {
		return this.config;
	}
}

Bitmap.Config = {
	ARGB_4444: "ARGB_8888", // Don't use ARGB_4444. Deprecated in Android API level 13. We're setting it to the same value as ARGB_8888, because from KITKAT on this value is forced
	ARGB_8888: "ARGB_8888" // Standard for JS canvas - each pixel in 4 bytes, each bit with 8 bits of precision (i.e., 256 possible values per byte)
};

// Use this when you want to create a cropped version of a Bitmap
Bitmap.createBitmap = function() {

	/**
	 * In this simple implementation, we only consider a few overloads
	 */
	if(arguments.length === 1 && arguments[0] instanceof Bitmap) { // (Bitmap bitmap)
		return arguments[0];
	} else if(arguments.length === 7) { // (Bitmap bitmap, int x, int y, int width, int height, Matrix matrix|null, someBoolean)

		if(arguments[3] <= 0 || arguments[4] <= 0) {
			throw new Error("IllegalArgumentException: Bitmap.createBitmap" +
				"arguments for width and height must be positive.");
		}

		// Note: for new dimensions use Bitmap.createScaledBitmap
		var bitmap = new Bitmap(BITMAP_CONSTRUCTOR_KEY, arguments[0]);
		// bitmap.setWidth(arguments[3]);
		// bitmap.setHeight(arguments[4]);

		if(arguments[5] !== null && !arguments[5].isIdentity()) {

			try {
				let image = new Image();
				image.setAttribute("crossOrigin", "Anonymous");

				let matrix = arguments[5];

				let matrixScaleX = matrix.values[Matrix.MSCALE_X];
				let matrixScaleY = matrix.values[Matrix.MSCALE_Y];

				let signedScaledWidth = arguments[3] * matrixScaleX;
				let signedScaledHeight = arguments[4] * matrixScaleY;

				let scaledWidth = Math.abs(arguments[3] * matrixScaleX);
				let scaledHeight = Math.abs(arguments[4] * matrixScaleY);

				let translatedX = 0;
				let translatedY = 0;

				let canvas = document.createElement("CANVAS");

				canvas.width = scaledWidth;
				canvas.style.width = scaledWidth + "px";
				canvas.height = scaledHeight;
				canvas.style.height = scaledHeight + "px";

				image.onload = function() {
					document.body.appendChild(canvas);

					let ctx = canvas.getContext("2d");
					ctx.setTransform(
						matrix.values[Matrix.MSCALE_X],
						matrix.values[Matrix.MSKEW_X],
						matrix.values[Matrix.MSKEW_Y],
						matrix.values[Matrix.MSCALE_Y],
						matrix.values[Matrix.MTRANS_X],
						matrix.values[Matrix.MTRANS_Y]
					);

					ctx.drawImage(image, translatedX, translatedY, signedScaledWidth, signedScaledHeight);

					// Redefine the bitmap's image as the newly transformed image
					let dataURL = canvas.toDataURL();
					bitmap.image.src = dataURL;

					document.body.removeChild(canvas);
				};

				image.onerror = function() {
					console.log("Testing from a local directory may cause CORS errors.\n" + 
					"Link to a web server to use images in Bitmap.createBitmap.");
				};

				image.src = bitmap.image.src;
			} catch(domException) {
				console.log("Testing from a local directory may cause CORS errors.\n" + 
					"Link to a web server to use images in Bitmap.createBitmap.");
			}
		}

		return bitmap;

	} else { // (int width, int height, Bitmap.Config bitmapConfiguration)

		if(arguments[0] <= 0 || arguments[1] <= 0) {
			throw new Error("IllegalArgumentException: Bitmap.createBitmap" +
				"arguments for width and height must be positive.");
		}

		var bitmap = new Bitmap(BITMAP_CONSTRUCTOR_KEY, null, null);
		bitmap.setWidth(arguments[0]);
		bitmap.setHeight(arguments[1]);
		return bitmap;
	}
};

// Use this when you want to scale an existing Bitmap image
Bitmap.createScaledBitmap = function(src, destWidth, destHeight, filter) {

	if(destWidth <= 0 || destHeight <= 0) {
		throw new Error("IllegalArgumentException: Bitmap.createScaledBitmap" +
			"arguments for width and height must be positive.");
	}

	/**
	 * Use destWidth and destHeight arguments to set the new bitmap image as a resized
	 * version of the source bitmap's image
	 */
	var bitmap = new Bitmap(BITMAP_CONSTRUCTOR_KEY, arguments[0]);
	bitmap.setWidth(destWidth);
	bitmap.setHeight(destHeight);

	try {
		let image = new Image();
		image.setAttribute("crossOrigin", "Anonymous");

		let scaledWidth = destWidth;
		let scaledHeight = destHeight;

		let canvas = document.createElement("CANVAS");

		canvas.width = scaledWidth;
		canvas.style.width = scaledWidth + "px";
		canvas.height = scaledHeight;
		canvas.style.height = scaledHeight + "px";

		image.onload = function() {
			document.body.appendChild(canvas);

			let ctx = canvas.getContext("2d");
			ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

			// Redefine the bitmap's image as the newly imported image
			let dataURL = canvas.toDataURL();
			bitmap.image.src = dataURL;
			document.body.removeChild(canvas);
		};

		image.onerror = function() { 
			console.log("Testing from a local directory may cause CORS errors.\n" + 
			"Link to a web server to use images in Bitmap.createScaledBitmap.");
		};

		image.src = bitmap.image.src;

	} catch(e) {
		console.log("Testing from a local directory may cause CORS errors.\n" + 
			"Link to a web server to use images in Bitmap.createScaledBitmap.");
	}

	return bitmap;
};

// Consider reworking to use DOMMatrix
class Matrix {
	constructor(oldMatrix) {

		// Default to the identity matrix
		if(typeof oldMatrix === "undefined") {
			this.values = new Array(9);
			
			this.values[Matrix.MSCALE_X] = 1;
			this.values[Matrix.MSKEW_X] = 0;

			this.values[Matrix.MTRANS_X] = 0;

			this.values[Matrix.MSKEW_Y] = 0;
			this.values[Matrix.MSCALE_Y] = 1;

			this.values[Matrix.MTRANS_Y] = 0;

			this.values[Matrix.MPERSP_0] = 0;
			this.values[Matrix.MPERSP_1] = 0;
			this.values[Matrix.MPERSP_2] = 1;

		} else { // Create a deep copy of the source matrix
			this.values = JSON.parse(JSON.stringify(oldMatrix.values));
		}
	}

	equals(otherObject) {
		if(!(otherObject instanceof Matrix)) {
			return false;
		}

		if(JSON.stringify(this.values).replace(/\s/g, "") == JSON.stringify(otherObject.values).replace(/\s/g, "")) {
			return true;
		}

		return false;
	}

	preScale(scaleX, scaleY) {
		this.values[Matrix.MSCALE_X] = this.values[Matrix.MSCALE_X] * scaleX;
		this.values[Matrix.MSCALE_Y] = this.values[Matrix.MSCALE_Y] * scaleY;
	}

	postScale(scaleX, scaleY) {
		this.values[Matrix.MSCALE_X] = this.values[Matrix.MSCALE_X] * scaleX;
		this.values[Matrix.MSCALE_Y] = this.values[Matrix.MSCALE_Y] * scaleY;
	}

	preSkew(skewX, skewY) {
		this.values[Matrix.MSKEW_X] = this.values[Matrix.MSKEW_X] * skewX;
		this.values[Matrix.MSKEW_Y] = this.values[Matrix.MSKEW_Y] * skewY;
	}

	postSkew(skewX, skewY) {
		this.values[Matrix.MSKEW_X] = this.values[Matrix.MSKEW_X] * skewX;
		this.values[Matrix.MSKEW_Y] = this.values[Matrix.MSKEW_Y] * skewY;
	}

	getValues(arr) {
		arr.splice(0, arr.length);

		for(var i = 0; i < 9; i++) {
			arr.push(this.values[i]);
		}
	}

	isIdentity() {
		return this.equals(new Matrix());
	}
}

Matrix.MSCALE_X = 0;
Matrix.MSKEW_X = 1;

Matrix.MTRANS_X = 2;

Matrix.MSKEW_Y = 3;
Matrix.MSCALE_Y = 4;

Matrix.MTRANS_Y = 5;

Matrix.MPERSP_0 = 6;
Matrix.MPERSP_1 = 7;
Matrix.MPERSP_2 = 8;

class Runnable {
	run() {}
}

class Thread extends Runnable {
	constructor(isMainThread) {
		super();
		this.requestedAnimationFrame = null;
		this.runningAsThread = false;

		this.isMainThread = !!isMainThread;

		if(this.isMainThread) {
			Thread.mainThread = this;
		} else {
			
			// For perhaps, future implentation of thread.join
			Thread.instances.push(this);
		}
	}

	run() {
		if(this.runningAsThread) {
			let self = this;

			// Continue thread as quickly as we can
			this.requestedAnimationFrame = window.requestAnimationFrame(
				self.run.bind(self)
			);
		}
	}

	start() {
		this.runningAsThread = true;

		this.runJavaAndJS();
	}

	// New/custom method, runs JS thread animations even when `run` method is overridden
	runJavaAndJS() {
		var self = this;
		this.run.call(self);

		this.requestedAnimationFrame = window.requestAnimationFrame(
			self.runJavaAndJS.bind(self)
		);
	}

	stop() {
		this.runningAsThread = false;
		window.cancelAnimationFrame(this.requestedAnimationFrame);
	}

	/**
	 * Note: this could cause performance issues if it is used often.
	 * Try to rewrite your code to avoid sleeping.
	 * You can use this method by setting it in your options.
	 *
	 * Android2JSGame.interruptToSleep = true;
	 *
	 * @param {number} waitTime - The delay in milliseconds until the
	 *   next animation starts.
	 */
	freezeToSleep(msec) {
		let startTime = performance.now();
		let currentTime = performance.now();

		
		 // Keep running this loop until The current time is at (or past) the start time
		 // Note: this will run hundreds of thousands times per second (~484,218 per
		 // second for string, ~491,711 per second for division; thus division will run
		 // more times so should be more accurate, even though there will overall be
		 // more processing). But really, they are about the same
		while(currentTime - msec <= startTime) {

			// Updating Element.style is slow, as is updating a DOM element's width. We utilize these facts to force the code to wait
			Android2JSGameSleepWaitDiv.style.width = (Date.now() / 1000000000000) + "px";

			currentTime = performance.now();
		}
	}

	/**
	 * Note:this version does not work the same as it would in Java. Instead
	 * of pausing the thread in the current method, this stops the NEXT
	 * animation call, and starts the full animation cycle after a given time.
	 * However, for performance purposes this version is preferred;
	 * you can control actions with variables and counters
	 * rather than using thread.sleep();
	 * @param {number} waitTime - The delay in milliseconds until the
	 *   next animation starts.
	 */
	sleep(waitTime) {
		this.stop();

		let self = this;
		setTimeout(self.start.bind(self), waitTime);
	}

	/**
	 * As JS is synchronous by nature, and in particular,
	 * our run method is being handled synchronously,
	 * thread.join is unnecessary. This can be modified if we 
	 * redefine threads to use web workers for instance.
	 */
	join(millis, nanos) {}
}

Thread.mainThread = null;
Thread.instances = [];

// From ES 2017 solution found here: https://stackoverflow.com/questions/1447407/whats-the-equivalent-of-javas-thread-sleep-in-javascript
// But... we would have to assume that any function calling this is an async function for it to work correctly
async function threadSleep(msec) {
	return new Promise(resolve => setTimeout(resolve, msec));
}

// This should contain some information, like the orientation (portrait vs. landscape)
class Bundle {
	constructor() {}
}

// We recreate some more useful methods of the Arrays class
class Arrays {}

Arrays.equals = function(arr1, arr2) {
	if(arr1.length !== arr2.length) {
		return false;
	}

	for(let i = 0, len = arr1.length; i < len; i++) {
		if(arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
};

Arrays.fill = function(arr, val) {
	arr.fill(val);
};

Arrays.sort = function(arr) {
	arr.sort();
};

Arrays.toString = function(arr) {
	return "[" + arr.join(", ") + "]";
};

class ArrayList extends Array {
	constructor(initialCapacity) {
		if(typeof initialCapacity === "undefined") {
			super();
		} else { // if(initialCapacity instanceof Array) { Array, ArrayList, or list of items

			// Note: `this` keyword is undefined without invoking super
			super(arguments);
		}
	}

	add(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.push(argument0);
		} else {
			this.splice(argument0, 1, argument1);
		}
	}

	addAll(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.splice(argument0);
		} else {
			this.splice(argument0, argument1.length, argument1);
		}
	}

	clone() {
		//*** return this; // Shallow copy
		return JSON.parse(JSON.stringify(this)); // Deep copy
	}

	// Removes a given object, or the item at a given number index
	remove(obj) {
		if(typeof obj === "number") {
			this.splice(obj, 1);
		} else {
			if(this.indexOf(obj) !== -1) {
				this.splice(this.indexOf(obj), 1);
			}
		}
	}
	
	removeAll(subcollection) {
		for(let x of this) {
			if(subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	retainAll(subcollection) {
		for(let x of this) {
			if(!subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	subList(startIdx, endIdx) {
		return this.slice(startIdx, endIdx);
	}

	toArray() {
		return JSON.parse(JSON.stringify( Array.prototype.slice(this) ));
	}

	contains(obj) {
		return this.includes(obj);
	}

	size() {
		return this.length;
	}

	getArray() {
		return Array.prototype.slice(this);
	}

	clear() {
		this.splice(0, this.length);
	}

	isEmpty() {
		return this.length === 0;
	}
}

ArrayList.prototype.get = function(idx) {
	return this[idx];
};

ArrayList.prototype.set = function(index, element) {
	this.splice(index, 1, element);
};

class LinkedList extends Array {
	constructor(initialCapacity) {
		if(typeof initialCapacity === "undefined") {
			super();
		} else { // if(initialCapacity instanceof Array) { Array, ArrayList, or list of items

			super(arguments);

			// Note: `this` does not exist without super
			//*** super.apply(Array, Array.prototype.slice(arguments));
			// This causes an error. Need to call super directly
		}
	}

	add(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.push(argument0);
		} else {
			this.splice(argument0, 1, argument1);
		}
	}

	addAll(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.splice(argument0);
		} else {
			this.splice(argument0, argument1.length, argument1);
		}
	}

	clone() {
		//*** return this; // Shallow copy
		return JSON.parse(JSON.stringify(this)); // Deep copy
	}

	// Removes a given object, or the item at a given number index
	remove(obj) {
		if(typeof obj === "number") {
			this.splice(obj, 1);
		} else {
			if(this.indexOf(obj) !== -1) {
				this.splice(this.indexOf(obj), 1);
			}
		}
	}
	
	removeAll(subcollection) {
		for(let x of this) {
			if(subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	retainAll(subcollection) {
		for(let x of this) {
			if(!subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	subList(startIdx, endIdx) {
		return this.slice(startIdx, endIdx);
	}

	toArray() {
		return JSON.parse(JSON.stringify( Array.prototype.slice(this) ));
	}

	contains(obj) {
		return this.includes(obj);
	}

	size() {
		return this.length;
	}

	getArray() {
		return Array.prototype.slice(this);
	}

	clear() {
		this.splice(0, this.length);
	}

	isEmpty() {
		return this.length === 0;
	}
}

LinkedList.prototype.get = function(idx) {
	return this[idx];
};

LinkedList.prototype.set = function(index, element) {
	this.splice(index, 1, element);
};

class Vector extends Array {
	constructor(initialCapacity) {
		if(typeof initialCapacity === "undefined") {
			super();
		} else { // if(initialCapacity instanceof Array) { Array, ArrayList, or list of items

			super(arguments);

			// Note: `this` does not exist without super
			//*** super.apply(Array, Array.prototype.slice(arguments));
			// This causes an error. Need to call super directly
		}
	}

	add(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.push(argument0);
		} else {
			this.splice(argument0, 1, argument1);
		}
	}

	addAll(argument0, argument1) {
		if(typeof argument1 === "undefined") {
			this.splice(argument0);
		} else {
			this.splice(argument0, argument1.length, argument1);
		}
	}

	clone() {
		//*** return this; // Shallow copy
		return JSON.parse(JSON.stringify(this)); // Deep copy
	}

	// Removes a given object, or the item at a given number index
	remove(obj) {
		if(typeof obj === "number") {
			this.splice(obj, 1);
		} else {
			if(this.indexOf(obj) !== -1) {
				this.splice(this.indexOf(obj), 1);
			}
		}
	}
	
	removeAll(subcollection) {
		for(let x of this) {
			if(subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	retainAll(subcollection) {
		for(let x of this) {
			if(!subcollection.includes(this)) {
				this.remove(x);
			}
		}
	}

	subList(startIdx, endIdx) {
		return this.slice(startIdx, endIdx);
	}

	toArray() {
		return JSON.parse(JSON.stringify( Array.prototype.slice(this) ));
	}

	contains(obj) {
		return this.includes(obj);
	}

	size() {
		return this.length;
	}

	getArray() {
		return Array.prototype.slice(this);
	}

	clear() {
		this.splice(0, this.length);
	}

	isEmpty() {
		return this.length === 0;
	}
}

Vector.prototype.get = function(idx) {
	return this[idx];
};

Vector.prototype.set = function(index, element) {
	this.splice(index, 1, element);
};

class HashedSet extends Set {
	constructor() {
		super();
	}
}

class LinkedHashedSet extends Set {
	constructor() {
		super();
	}
}

class TreeSet extends Set {
	constructor() {
		super();
	}
}

class PriorityQueue {}

class Polygon {}

// Handle passive touch events
var supportsPassive = false;

try {
	var opts = Object.defineProperty({}, 'passive', {
		get: function() {
			supportsPassive = true;
		}
	});

	window.addEventListener("test", opts, opts);
	window.removeEventListener("test", opts, opts);
} catch(e) {
	console.log("Passive event handlers not supported.");
	supportsPassive = false;
}

class SurfaceHolder {
	constructor() {
		this.canvas = null;
	}

	lockCanvas() {
		this.canvas = new Canvas(window.Android2JSGameCanvas);
		return this.canvas;
	}

	unlockCanvasAndPost(canvas) {
		this.canvas = canvas;
	}

	addCallback(gamePanel) {
		if(Android2JSGame.allowTouchInput) {
			window.Android2JSGameCanvas.addEventListener("touchstart", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
			}, /* supportsPassive ? {passive: true} : */ false);

			window.Android2JSGameCanvas.addEventListener("touchmove", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
			}, /* supportsPassive ? {passive: true} : */ false);

			window.Android2JSGameCanvas.addEventListener("touchend", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
			}, /* supportsPassive ? {passive: true} : */ false);
		}

		// For specifically mobile games, it would be best to avoid mouse input
		if(Android2JSGame.allowMouseInput) {
			
			window.Android2JSGameCanvas.addEventListener("mousedown", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				window.Android2JSGameMouseIsDown = true;
				gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
			}, /* supportsPassive ? {passive: true} : */ false);

			window.Android2JSGameCanvas.addEventListener("mousemove", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				if(window.Android2JSGameMouseIsDown) {
					gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
				}
			}, /* supportsPassive ? {passive: true} : */ false);

			window.Android2JSGameCanvas.addEventListener("mouseup", function(e) {
				e.preventDefault(); // Prevent mouse and click events from triggering

				window.Android2JSGameMouseIsDown = false;
				gamePanel.onTouchEvent.call(gamePanel, new MotionEvent(e));
			}, /* supportsPassive ? {passive: true} : */ false);
		}
	}
}

const VISIBLE = 0;
const INVISIBLE = 4;
const GONE = 8;

class Surface {
	constructor() {}
	lockHardwareCanvas() {}
	lockCanvas(dirtyRectangle) {}
	unlockCanvas(canvas) {}
	unlockCanvasAndPost(canvas) {}
}

class View {
	constructor() {
		this.view = document.documentElement; // This document's top-level element
		this.visibilityType = VISIBLE;
		this.width = this.view.style.clientWidth;
		this.height = this.view.style.clientHeight;

		var self = this;
		this.view.addEventListener("resize", function() {
			let oldWidth = self.width;
			let oldHeight = self.height;
			self.width = this.view.clientWidth;
			self.height = this.view.clientHeight;
			self.onSizeChanged(self.width, self.height, oldWidth, oldHeight);
		}, false);
	}

	setVisibility(visibilityType) {
		var visibilityChanged = false;
		if(visibilityType !== this.visibilityType) {
			visibilityChanged = true;
		}

		switch(visibilityType) {
			case VISIBLE:
				this.view.style.display = "block";
				this.view.style.visibility = "visible";
				break;
			case INVISIBLE:
				this.view.style.display = "block";
				this.view.style.visibility = "hidden";
				break;
			case GONE:
				this.view.style.display = "none";
				this.view.style.visibility = "visible"; //Return to default
				break;
		}

		if(visibilityChanged) {
			this.onWindowVisibilityChanged(visibilityType);
		}
	}

	// Override this method for any screen resizing events (like changing orientation)
	onSizeChanged(newWidth, newHeight, oldWidth, oldHeight) {}

	onWindowVisibilityChanged(visibilityType) {}

	onDraw(canvas) {}
	onKeyDown(keyEvent) {}
	onKeyUp(keyEvent) {}
	onTouchEvent(motionEvent) {}
}

class SurfaceView extends View {
	constructor(context) {
		super(context);
		this.holder = new SurfaceHolder();

		this.surfaceCreated(this.holder);
	}

	surfaceChanged() {}
	surfaceDestroyed(surfaceHolder) {}
	surfaceCreated(surfaceHolder) {}
	onTouchEvent(motionEvent) {}

	draw(canvas) {}

	getHolder(){
		return this.holder;
	}

	setFocusable(focusable) {
		if(focusable) {
			window.Android2JSGameCanvas.focus();
		}
	}
}

Error.prototype.printStackTrace = function() {
	if(this.stack) {
		console.log(this.stack);
	} else if(console.trace) {
		console.trace();
	} else {
		console.error(this);
	}
};

// The definition of "synchronized" in Java is not carried over here (yet), and is not used as a function anyhow.
try {
	var synchronized;
	window.synchronized = window.synchronized || function(holder) {};
} catch (e) {
	console.log("synchronized is a reserve word");
}

class Typeface {
	constructor() {
		this.italic = false;
		this.bold = false;
		this.fontFamily = "Arial";
		this.fontStyle = "";
		this.fontName = "Arial";
	}

	isBold() {
		return this.bold;
	}

	isItalic() {
		return this.italic;
	}
}

// Typeface Styles
Typeface.NORMAL = 0; // "normal";
Typeface.ITALIC = 2; // "italic ";
Typeface.BOLD = 1; // "bold";
Typeface.BOLD_ITALIC = 3; // "bold italic";

Typeface.DEFAULT = new Typeface();
Typeface.DEFAULT.fontFamily = "Arial";
Typeface.MONOSPACE = new Typeface();
Typeface.MONOSPACE.fontFamily = "monospace";
Typeface.SERIF = new Typeface();
Typeface.SERIF.fontFamily = "serif";
Typeface.SANS_SERIF = new Typeface();
Typeface.SANS_SERIF.fontFamily = "sans-serif";

Typeface.create = function(family, typefaceStyle) {
	var fontStyle = "",
		fontFamily = "Arial";

	let newTypeface = new Typeface();

	switch(typefaceStyle) {
		case Typeface.NORMAL:
			fontStyle = "";
			break;
		case Typeface.ITALIC:
			fontStyle = "italic";
			newTypeface.italic = true;
			break;
		case Typeface.BOLD:
			fontStyle = "bold";
			newTypeface.bold = true;
			break;
		case Typeface.BOLD_ITALIC:
			fontStyle = "bold italic";
			newTypeface.bold = true;
			newTypeface.italic = true;
			break;
		default:
			fontStyle = "";
			break;
	}

	if(typeof family === "string") {
		fontFamily = family;
	} else { // Typeface instance
		fontFamily = family.fontFamily;
	}

	newTypeface.fontName = fontFamily;
	newTypeface.fontStyle = fontStyle;

	return newTypeface;
};

Typeface.createFromAsset = function(assetManager, fontUrl) {
	var fontStyle = "",
		fontFamily = "",
		fontPath = fontUrl.replace("fonts/", "").split(".")[0];

	if(!(assetManager instanceof AssetManager)) {
		throw new Error("Typeface.createFromAssets requires first argument to be an instance of AssetManager.");
	}

	if(!Android2JSGameFonts.hasOwnProperty(fontPath)) {
		var sheet = document.createElement("STYLE");
		document.head.appendChild(sheet);

		let newFontName = "a2jsgame_custom_font" + Object.keys(window.Android2JSGameFonts).length;

		fontFamily = newFontName;

		sheet.innerText =	`
			@font-face {
				font-family: ${fontFamily};
				src: url('${fontUrl}') format('truetype');
				font-weight: normal;
				font-style: normal;
			}

			div:-wekit-full-screen {
				@font-face {
					font-family: ${fontFamily};
					src: url('${fontUrl}') format('truetype');
					font-weight: normal;
					font-style: normal;
				}
			}

			div:-moz-full-screen {
				@font-face {
					font-family: ${fontFamily};
					src: url('${fontUrl}') format('truetype');
					font-weight: normal;
					font-style: normal;
				}
			}

			div:fullscreen {
				@font-face {
					font-family: ${fontFamily};
					src: url('${fontUrl}') format('truetype');
					font-weight: normal;
					font-style: normal;
				}
			}

			div:full-screen {
				@font-face {
					font-family: ${fontFamily};
					src: url('${fontUrl}') format('truetype');
					font-weight: normal;
					font-style: normal;
				}
			}
			`;

		window.Android2JSGameFonts[fontPath] = {
			name: fontFamily,
			path: fontUrl
		};
	} else { // This custom font has already been created and recorded
		fontFamily = window.Android2JSGameFonts[fontPath].name;
	}

	let newTypeface = new Typeface();

	if(fontFamily) {
		newTypeface.fontName = fontFamily;
	}

	if(fontStyle) {
		newTypeface.fontStyle = fontStyle;
	}

	return newTypeface;
};

class Paint {
	constructor(flags) {
		this.color = "rgb(0, 0, 0)";
		this.alpha = 255;
		this.font = "14px Arial";
		this.style = Paint.Style.FILL;

		this.textSize = 14;
		this.typeface = new Typeface();
		this.fontFamily = "Arial";
		this.typefaceStyle = "";

		this.textAlign = Paint.Align.LEFT;
		this.strokeWidth = 1;
		
		this.shadowOffsetX = 0;
		this.shadowOffsetY = 0;
		this.shadowBlur = 0;
		this.xfermode = "source-over";

		if(flags === Paint.ANTI_ALIAS_FLAG) {
			this.antiAlias = true;
			window.Android2JSGameCtx.imageSmoothingEnabled = true;
			window.Android2JSGameCtx.imageSmoothingQuality = "high";

			// Consider translating context to smooth out lines
			// window.Android2JSGameCtx.translate(0.5, 0.5);
		} else {
			this.antiAlias = false;
			window.Android2JSGameCtx.imageSmoothingEnabled = false;
			window.Android2JSGameCtx.imageSmoothingQuality = "low";

			// See not above on smoothing lines
			// window.Android2JSGameCtx.transform = matrix(1, 0, 0, 1, 0, 0);
		}
	}

	isAntiAlias() {
		return this.antiAlias;
	}

	setAntiAlias(newAntiAlias) {
		this.antiAlias = newAntiAlias;

		if(this.antiAlias) {
			this.antiAlias = true;
			window.Android2JSGameCtx.imageSmoothingEnabled = true;
			window.Android2JSGameCtx.imageSmoothingQuality = "high";

			// Consider translating context to smooth out lines
			// window.Android2JSGameCtx.translate(0.5, 0.5);
		} else {
			this.antiAlias = false;
			window.Android2JSGameCtx.imageSmoothingEnabled = false;
			window.Android2JSGameCtx.imageSmoothingQuality = "low";

			// See not above on smoothing lines
			// window.Android2JSGameCtx.transform = matrix(1, 0, 0, 1, 0, 0);
		}
	}

	getColor() {
		return this.color;
	}

	setColor(color) {
		this.color = color;

		if(this.style === Paint.Style.FILL) {
			window.Android2JSGameCtx.fillStyle = color;
		} else if(this.style === Paint.Style.STROKE) {
			window.Android2JSGameCtx.strokeStyle = color;
		} else { // Paint.Style.FILL_AND_STROKE
			window.Android2JSGameCtx.fillStyle = color;
			window.Android2JSGameCtx.strokeStyle = color;
		}
	}

	/**
	 * Set the ARGB values for this Paint instance. Note, unlike
	 * with CSS and HTML5 canvas context, here alpha is the
	 * first component instead of the last.
	 */
	setARGB(a, r, g, b) {
		this.alpha = a;
		this.color = `rgb(${r}, ${g}, ${b})`;
	}

	getStrokeWidth() {
		return this.strokeWidth;
	}

	setStrokeWidth(width) {
		this.strokeWidth = width;
		window.Android2JSGameCtx.lineWidth = width;
	}

	getStyle() {
		return this.style;
	}

	// See Paint.Style for options
	setStyle(style) {
		this.style = style;
	}

	getTextSize() {
		return this.textSize;
	}

	/**
	 * Records this objects font size in pixels.
	 * @param {number} fontSizePx - The pixel size to set this font to.
	 */
	setTextSize(fontSizePx) {
		this.textSize = fontSizePx;
	}

	getTypeface() {
		return this.typeface;
	}

	setTypeface(newTypeface) {

		this.fontFamily = newTypeface.fontName;
		this.typefaceStyle = newTypeface.fontStyle;

		// Example: "14px Times New Roman"
		// this.typeface = (newTypeface.fontStyle ? newTypeface.fontStyle + " " : "") +
			// this.fontSize.replace(/(\s*[0-9]+)([a-z]+)/, "$1") + " " + newTypeface.fontName;

		this.typeface = new Typeface();
		this.typeface.fontName = newTypeface.fontFamily;
		this.typefaceStyle = newTypeface.fontStyle;
	}

	/**
	 * Sets the alpha value for this Paint instance.
	 * @param {number} newAlpha - The new alpha value, between 0 and 255 (inclusive)
	 */
	setAlpha(newAlpha) {
		this.alpha = newAlpha;
	}

	/**
	 * Gets the alpha value for this Paint instance, defining
	 * its drawing opacity, between 0 and 255 (inclusive).
	 * @returns {number}
	 */
	getAlpha() {
		return this.alpha;
	}

	// JS currently does not provide TextMetrics with a height property
	descent() {
		var desc = 0;
		window.Android2JSGameCtx.font = this.getCtxFont();
		// May need to consider baseline...

		var testString = "a";
		var textMetrics = window.Android2JSGameCtx.measureText(testString);

		try {
			desc = textMetrics.actualBoundingBoxDescent;
		} catch(e) {
			console.log("TextMetrics cannot find descent property. Check browser flags.");
		}

		return desc;
	}

	// JS currently does not provide TextMetrics with a height property
	ascent() {
		var asc = 0;
		window.Android2JSGameCtx.font = this.getCtxFont();

		var testString = "a";
		var textMetrics = window.Android2JSGameCtx.measureText(testString);

		try {
			asc = textMetrics.actualBoundingBoxAscent;
		} catch(e) {
			console.log("TextMetrics cannot find ascent property. Check browser flags.");
		}

		return asc;
	}

	setTextAlign(alignStyle) {
		this.textAlign = alignStyle;
	}

	getTextAlign() {
		return this.textAlign;
	}

	getTextBounds(text, substringStart, substringEnd, rect) {
		var substring = text.substring(substringStart, substringEnd),
			textMetrics;

		window.Android2JSGameCtx.font = this.getCtxFont();
		textMetrics = window.Android2JSGameCtx.measureText( substring );

		rect.left = 0;
		rect.top = 0;
		rect.right = textMetrics.width;

		// Note: JS currently has no TextMetrics height property
		rect.bottom = this.textSize;
	}

	getFontMetrics() {
		var fontMetrics = new Paint.FontMetrics();
		fontMetrics.ascent = 0;
		fontMetrics.bottom = this.textSize;
		fontMetrics.descent = 0;
		fontMetrics.leading = 0;
		fontMetrics.top = 0;
		return fontMetrics;
	}

	setShadowLayer(radius, dx, dy, shadowColor) {
		this.shadowOffsetX = dx;
		this.shadowOffsetY = dy;
		this.shadowBlur = radius;
		this.shadowColor = shadowColor;
	}

	clearShadowLayer() {
		this.shadowOffsetX = 0;
		this.shadowOffsetY = 0;
		this.shadowBlur = 0;
		this.shadowColor = 0;
	}

	getXfermode(newXfermode) {
		return this.xfermode;
	}

	setXfermode(newXfermode) {
		this.xfermode = newXfermode;
	}

	// This is for internal use - not a Java method
	getCtxFont() {
		
		// Build the font string
		let ctxFont = this.textSize + "px " +
			(this.typefaceStyle ? (this.typefaceStyle + " ") : "") +
			this.fontFamily;

		return ctxFont;
	}
}

Paint.Style = {
	STROKE: "STROKE",
	FILL: "FILL",
	FILL_AND_STROKE:  "FILL_AND_STROKE"
};

Paint.Align = {
	LEFT: "LEFT",
	CENTER: "CENTER",
	RIGHT: "RIGHT"
};

Paint.FontMetrics = function() {
	this.ascent = 0;
	this.bottom = 0;
	this.descent = 0;
	this.leading = 0;
	this.top = 0;
};

Paint.ANTI_ALIAS_FLAG = 1;

class Xfermode { constructor() {} }

class PorterDuffXfermode extends Xfermode {
	constructor(mode) {
		super();
		this.mode = mode;
	}
}

window.PorterDuff = {};
PorterDuff.Mode = { // copy,, lighter, color-dodge, color-burn, hard-light
	ADD: "ADD", // Not supported directly in JavaScript
	CLEAR: "CLEAR", // Not supported directly in JavaScript
	DST: "DST", // Not supported directly in JavaScript
	SRC: "SRC",  // Not supported directly in JavaScript
	DARKEN: "darken",
	DST_ATOP: "destination-atop",
	DST_IN: "destination-in",
	DST_OUT: "destination-out",
	DST_OVER: "destination-over",
	LIGHTEN: "lighten",
	MULTIPLY: "multiply",
	OVERLAY: "overlay",
	SCREEN: "screen",
	SRC_ATOP: "source-atop",
	SRC_IN: "source-in",
	SRC_OUT: "source-out",
	SRC_OVER: "source-over",
	XOR: "xor"
};

/**
 * Emulate the Android Java Canvas class - note: this does NOT
 * represent the same thing as HTMLCanvasElement in JavaScript.
 * JavaScript's CanvasRenderingContext2D objects are kind of like
 * a combination of Android's Canvas and Paint class objects, providing
 * drawing styles and operations for drawing on a physical canvas.
 * The <canvas> element is closer to Android's Bitmap objects.
 */
class Canvas {
	constructor(bitmap) {
		if(bitmap instanceof Bitmap) {

			/**
			 * This will be reworked. Canvas does not create a new canvas or
			 * image. It is simply a set of functions to use with a Drawable
			 * object, like a Bitmap.
			 */
			window.Android2JSGameCanvas.style.backgroundImage = bitmap.image;
			this.bitmap = bitmap;
		} else {
			this.bitmap = null;
		}

		this.width = window.Android2JSGameWidth;
		this.height = window.Android2JSGameHeight;
		this.clipBounds = new RectF(0, 0, this.width, this.height);
		this.matrix = new Matrix(); // Set matrix to the identity
	}

	/**
	 * In our simple implementation we assume setBitmap is just being used
	 * to set a background. In Android Java however, this actually redefines
	 * the current drawing canvas as the Bitmap itself.
	 */
	setBitmap(bitmap) {
		window.Android2JSGameCanvas.style.backgroundImage = bitmap.image;
	}

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}

	setMatrix(matrix) {
		this.matrix = matrix;
	}

	drawColor(color) {
		window.Android2JSGameCtx.clearRect(0, 0, window.Android2JSGameCanvas.width, window.Android2JSGameCanvas.height); // Erase previous frame

		if(window.Android2JSGameCanvas.style.background !== color) {
			window.Android2JSGameCanvas.style.background = color;
		}
	}

	drawRGB(r, g, b) {
		window.Android2JSGameCtx.clearRect(0, 0, window.Android2JSGameCanvas.width, window.Android2JSGameCanvas.height); // Erase previous frame

		if(window.Android2JSGameCanvas.style.background !== `rgb(${r}, ${g}, ${b})`) {
			window.Android2JSGameCanvas.style.background = `rgb(${r}, ${g}, ${b})`;
		}
	}

	drawRect(rect, paint) {
		Android2JSGameApplyShadow(paint);

		if(arguments.length === 5) { // left, top, right, bottom, Paint
			return this.drawRect(new RectF(arguments[0], arguments[1], arguments[2], arguments[3]), arguments[4]);
		}

		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();

		if(paint.getStyle() === Paint.Style.STROKE) {
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.strokeRect(rect.left, rect.top, rect.width(), rect.height());
		} else if(paint.getStyle() === Paint.Style.FILL) {
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fillRect(rect.left, rect.top, rect.width(), rect.height());
		} else { // Paint.Style.FILL_AND_STROKE //*** Wait, what should be the default? Probably not this...
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fillRect(rect.left, rect.top, rect.width(), rect.height());
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.strokeRect(rect.left, rect.top, rect.width(), rect.height());
		}

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	// Draws an oval contained in a RectF
	drawOval() {
		let privateRectF;
		let paint;

		if(arguments.length === 5) {
			privateRectF = new RectF(arguments[0], arguments[1], arguments[2], arguments[3]);
			paint = arguments[4];
		} else {
			privateRectF = arguments[0];
			paint = arguments[1];
		}

		let radiusX = privateRectF.width() / 2;
		let radiusY = privateRectF.height() / 2;
		let centerX = privateRectF.left + radiusX;
		let centerY = privateRectF.top + radiusY;
		let rotation = 0;
		let counterclockwise = true;

		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();
		window.Android2JSGameCtx.beginPath();

		window.Android2JSGameCtx.ellipse(centerX, centerY, radiusX, radiusY,
			rotation, 0, 2 * Math.PI, counterclockwise);

		if(paint.getStyle() === Paint.Style.STROKE) {
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.stroke();
		} else if(paint.getStyle() === Paint.Style.FILL) {
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fill();
		} else { // Paint.Style.FILL_AND_STROKE
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.fill();
			window.Android2JSGameCtx.stroke();
		}

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	drawCircle(centerX, centerY, radius, paint) {
		let centerRectF = new RectF(centerX - radius, centerY - radius,
			centerX + radius, centerY + radius);

		if(radius <= 0) {
			return;
		}

		this.drawOval(centerRectF, paint);
	}

	drawBitmap(bitmap, nullValue, boundingRect, paint) {
		Android2JSGameApplyShadow(paint);
		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();

		try {
			window.Android2JSGameCtx.drawImage(bitmap.image, boundingRect.left, boundingRect.top, boundingRect.width(), boundingRect.height());
		} catch(e) {
			// image resource may have been blocked due to CORS security errors
			let oldStrokeStyle = window.Android2JSGameCtx.strokeStyle;
			let oldLineWidth = window.Android2JSGameCtx.lineWidth;
			window.Android2JSGameCtx.strokeStyle = "red";
			window.Android2JSGameCtx.lineWidth = 2;
			window.Android2JSGameCtx.strokeRect(boundingRect.left, boundingRect.top, boundingRect.width(), boundingRect.height());
			window.Android2JSGameCtx.strokeStyle = oldStrokeStyle;
			window.Android2JSGameCtx.lineWidth = oldLineWidth;
		}

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	drawArc(rectF, thetaStart, thetaEnd, includeCenter, paint) {
		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();
		window.Android2JSGameCtx.beginPath();

		// We are assuming a circle here, so width and height are equal in rectF
		let radius = Math.round(rectF.width() / 2);

		window.Android2JSGameCtx.arc(rectF.left + radius, rectF.top + radius,
			radius, Math.toRadians(thetaStart), Math.toRadians(thetaEnd), false);

		if(includeCenter) {
			window.Android2JSGameCtx.moveTo(rectF.left + radius, rectF.top + radius);
		}

		if(paint.getStyle() === Paint.Style.STROKE) {
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.stroke();
		} else if(paint.getStyle() === Paint.Style.FILL) {
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fill();
		} else { // Style.FILL_AND_STROKE
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.fill();
			window.Android2JSGameCtx.stroke();
		}

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	// Note: y-values may differ in text display for Android Java vs. JS
	drawText(textString, x, y, paint) {

		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.font = paint.getCtxFont();
		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();

		switch(paint.getTextAlign()) {
			case Paint.Align.LEFT:
				window.Android2JSGameCtx.textAlign = "left";
				break;
			case Paint.Align.CENTER:
				window.Android2JSGameCtx.textAlign = "center";
				break;
			case Paint.Align.RIGHT:
				window.Android2JSGameCtx.textAlign = "right";
				break;
			default: {
				window.Android2JSGameCtx.textAlign = "left";
			}
		}

		if(paint.getStyle() === Paint.Style.STROKE) {
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.strokeText(textString, x, y);
		} else if(paint.getStyle() === Paint.Style.FILL) {
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fillText(textString, x, y);
		} else { // Style.FILL_AND_STROKE
			window.Android2JSGameCtx.fillStyle = paint.getColor();
			window.Android2JSGameCtx.fillText(textString, x, y);
			window.Android2JSGameCtx.strokeStyle = paint.getColor();
			window.Android2JSGameCtx.strokeText(textString, x, y);
		}

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	save() { // Android saves into a private stack.
		window.Android2JSGameCtx.save();
	}

	restore() {
		window.Android2JSGameCtx.restore();
	}

	drawPoint(x, y, paint) {
		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.fillStyle = paint.getColor();
		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();
		window.Android2JSGameCtx.fillRect(x, y, 1, 1);
		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	drawPoints(points, paint) {
		for(var i = 0; i < points.length; i++) {
			this.drawPoint(point.x, point.y, paint);
		}
	}

	drawLine(startX, startY, stopX, stopY, paint) {

		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.strokeStyle = paint.getColor();
		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();

		window.Android2JSGameCtx.beginPath();
		window.Android2JSGameCtx.moveTo(startX, startY);
		window.Android2JSGameCtx.lineTo(stopX, stopY);
		window.Android2JSGameCtx.stroke();

		window.Android2JSGameCtx.globalAlpha = 1.0;
	}

	getClipBounds(rect) {
		if(arguments.length === 0) {
			return this.clipBounds;
		}

		rect.left = 0;
		rect.top = 0;
		rect.right = this.width;
		rect.bottom = this.height;

		if(rect.width() === 0 && rect.height() === 0) {
			return false;
		}

		return true;
	}

	drawPath(path, paint) {
		Android2JSGameApplyShadow(paint);

		window.Android2JSGameCtx.strokeStyle = paint.getColor();
		window.Android2JSGameCtx.globalAlpha = paint.getAlpha() / 255;
		window.Android2JSGameCtx.globalCompositeOperation = paint.getXfermode();

		window.Android2JSGameCtx.stroke(path);
	}
}

window.Android2JSGameApplyShadow = function(paint) {
	window.Android2JSGameCtx.shadowOffsetX = paint.shadowOffsetX;
	window.Android2JSGameCtx.shadowOffsetY = paint.shadowOffsetY;
	window.Android2JSGameCtx.shadowBlur = paint.radius;
	window.Android2JSGameCtx.shadowColor = paint.shadowColor;
};

window.Android2JSGameRemoveShadow = function() {
	window.Android2JSGameCtx.shadowOffsetX = 0;
	window.Android2JSGameCtx.shadowOffsetY = 0;
	window.Android2JSGameCtx.shadowBlur = 0;
	window.Android2JSGameCtx.shadowColor = "rgba(0, 0, 0, 1)";
};

/**
 * Handle Sensor events, like accelerometer changes.
 * Acceleration events may be added later with JS DeviceMotion API.
 */
class Sensor {
	constructor(type) {
		this.type = type;
	}

	getType() {
		return this.type;
	}
}

Sensor.TYPE_ACCELEROMETER = 1;
Sensor.TYPE_MAGNETIC_FIELD = 2;
Sensor.TYPE_GYROSCOPE = 4;
Sensor.TYPE_GRAVITY = 9;
Sensor.TYPE_LINEAR_ACCELERATION = 10;
Sensor.TYPE_LIGHT = 5;
Sensor.TYPE_GAME_ROTATION_VECTOR = 15;
Sensor.TYPE_MOTION_DETECT = 30;
Sensor.TYPE_PRESSURE = 6;
Sensor.TYPE_ROTATION_VECTOR = 11;
Sensor.TYPE_ALL = -1;

class SensorEvent {
	constructor(sensorEvent) {
		this.values = sensorEvent.values;
		this.type = sensorEvent.type;
		this.sensor = sensorEvent.sensor;
	}

	getType() {
		return this.type;
	}
}

/** interface in Java. You can treat it as a class and extend it in JS, or create a custom class with these methods. */
class SensorEventListener {
	onSensorChanged(/* SensorEvent */ sensorEvent) {}
	onAccuracyChanged(/* Sensor */ sensor, /* int */ accuracy) {}
}

class SensorManager {
	constructor() {
		this.type = null;
	}

	getDefaultSensor(sensorType) {
		return new Sensor(sensorType);
	}

	registerListener(listener, sensor /* accelerometer or magnometor, e.g. */, delayBetweenListens) {

		var delayBetweenListens = delayBetweenListens || 0;
		var self = this;
		self.delayTime = Date.now();

		if(sensor.getType() === Sensor.TYPE_ACCELEROMETER) {
			window.addEventListener("deviceorientation", function(e) {

				if(Date.now() - self.delayTime > delayBetweenListens) { // Apply listener periodically. Constantly would overload the system.

					var sensorEvent = new SensorEvent({
						type: Sensor.TYPE_ACCELEROMETER,

						// Change values to radians to match Java standards
						values: [Math.toRadians(e.alpha), Math.toRadians(e.beta), Math.toRadians(e.gamma)],
						sensor: sensor
					});

					listener.onSensorChanged( sensorEvent );

					self.delayTime = Date.now(); //  Reset the delay timer
				}
			}, false);
		}
	}
}

SensorManager.SENSOR_DELAY_GAME = 1;
SensorManager.SENSOR_DELAY_FASTEST = 0;
SensorManager.SENSOR_DELAY_NORMAL = 3;
SensorManager.SENSOR_DELAY_UI = 2;

/**
 * Sets orientation values to a given matrix.
 * @param {array} rotationMatrix - An array of length 9.
 */
SensorManager.getOrientation = function(rotationMatrix, orientation) {
	var result = Array(3);

	// Update: need to use 3 x 3 rotationMatrix to get orientation values.
	orientation = result;

	console.log("Attempting to set values with SensorManager.getOrientation. " +
		"You may need to set these values directly in another line of code.");
};

/**
 * Gets a rotation matrix based on sensor details.
 * @param {array} rotationMatrix - An array of length 9.
 * @param I
 * @param acceleratorOutput
 * @param magnometerOutput
 */
SensorManager.getRotationMatrix = function(rotationMatrix, I, acceleratorOutput, magnometerOutput) {
	var success = false;

	// Update: need to use Output info to set rotationMatrix.
	rotationMatrix = new Array(9);

	console.log("Attempting to set values with SensorManager.getRotationMatrix. " +
		"You may need to set these values directly in another line of code.");

	success = true;
	return success;
};

class Region {
	constructor() {
		switch(arguments.length) {
			case 0:
				this.left = 0;
				this.top = 0;
				this.right = 0;
				this.bottom = 0;
				break;
			case 1: // Rect or Region
				this.left = arguments[0].left;
				this.top = arguments[0].top;
				this.right = arguments[0].right;
				this.bottom = arguments[0].bottom;
				break;
			case 4: // left, top, right, bottom
				this.left = arguments[0];
				this.top = arguments[1];
				this.right = arguments[2];
				this.bottom = arguments[3];
				break;
		}
	}
}

Region.Op = {
	DIFFERENCE: "DIFFERENCE",
	INTERSECT: "INTERSECT",
	REPLACE: "REPLACE",
	REVERSE_DIFFERECE: "REVERSE_DIFFERECE",
	UNION: "UNION",
	XOR: "XOR"
};

class Path {
	constructor(pathOrSVG) {
		if(typeof pathOrSVG === "undefined") {
			this.path = new Path2D();
		} else {
			this.path = new Path2D(pathOrSVG);
		}
	}

	addArc(left, top, right, bottom, startAngle, sweepAngle) {
		let privateRectF = new RectF(left, top, right, bottom);
		let radiusX = privateRectF.width() / 2;
		let radiusY = privateRectF.height() / 2;
		let centerX = privateRectF.left + radiusX;
		let centerY = privateRectF.top + radiusY;

		this.path.arc(centerX, centerY, radiusX,
			Math.toRadians(startAngle), Math.toRadians(sweepAngle),
			direction === Path.Direction.CCW);
	}

	addCircle(ceterX, centerY, radius, direction) {
		this.path.arc(centerX, centerY, radius, 0, Math.PI * 2,
			direction === Path.Direction.CCW);
	}

	addOval(ovalRectF, direction) {
		let radiusX = ovalRectF.width() / 2;
		let radiusY = ovalRectF.height() / 2;
		let centerX = ovalRectF.left + radiusX;
		let centerY = ovalRectF.top + radiusY;
		let rotation = 0;
		let counterclockwise = true;

		this.path.ellipse(centerX, centerY, radiusX, radiusY,
			rotation, 0, 2 * Math.PI, direction === Path.Direction.CCW);
	}

	addPath(path, transformMatrix) {
		if(typeof transformMatrix === "undefined") {
			this.path.addPath(path);
		} else {
			this.path.addPath(path, transformMatrix);
		}
	}

	addRect() {
		let rectF;
		let direction;

		if(arguments.length === 2) {
			rectF = arguments[0];
			direction = arguments[1];
		} else {
			rectF = new RectF(
				arguments[0],
				arguments[1],
				arguments[2],
				arguments[3]
			);

			direction = arguments[4];
		}

		this.path.rect(rectF.left, rectF.top,
			rectF.right - rectF.left, rectF.bottom - rectF.top);
	}

	arcTo() {
		let privateRectF;

		switch(arguments.length) {
			case 3:
			case 4:
				privateRectF = arguments[0];
				startAngle = arguments[1];
				sweepAngle = arguments[2];

				if(arguments.length === 4) {
					forceMoveTo = arguments[3];
				}
				break;
			case 7:
				privateRectF = new RectF(arguments[0], arguments[1],
					arguments[2], arguments[3]);
				
				startAngle = arguments[4];
				sweepAngle = arguments[5];
				forceMoveTo = arguments[6];
				break;
			default: {
				throw new Error("Path.arcTo requires 3, 4, or 7 arguments");
			}
		}

		let radiusX = privateRectF.width() / 2;
		let radiusY = privateRectF.height() / 2;
		let centerX = privateRectF.left + radiusX;
		let centerY = privateRectF.top + radiusY;

		this.path.arcTo(centerX, centerY, radiusX,
			Math.toRadians(startAngle), Math.toRadians(sweepAngle),
			direction === Path.Direction.CCW);
	}

	close() {
		this.path.closePath();
	}
}

Path.Direction = {
	CCW: "CCW",
	CW: "CW"
};

Path.FillType = {
	EVEN_ODD: "EVEN_ODD",
	INVERSE_EVEN_ODD: "INVERSE_EVEN_ODD",
	INVERSE_WINDING: "INVERSE_WINDING",
	WINDING: "WINDING"
};

/**
 * Methods below are helpers to set up fullscreen and set
 * orientation. These are not based on any Java methods.
 */

// Handle fullscreen and orientation setting processes
let orientationLock = null;

window.addEventListener("DOMContentLoaded", function() {
	orientationLock = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || null;

	if(!orientationLock && screen.orientation) {
		orientationLock = screen.orientation.lock || function() {/* noop */};
	}
});

/**
 * Binds fullscreen toggling to an HTML element.
 * @param {Object} elm - The element for fullscreen toggling
 */
function setFullscreenElement(elm, orientationChoice, callback) {

	if( Android2JSGameFullscreenTriggers.indexOf(elm) === -1) {
		elm.addEventListener("click", function(e) {
				e.preventDefault();
				toggleFullscreen(orientationChoice, callback);
		});

		Android2JSGameFullscreenTriggers.push(elm);
	}
}

/**
 * Toggles fullscreen. Written for cross-browser support.
 * From Mozilla Developer Network, slightly modified to account for orientation:
 * https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 *
 * @param {string} [orientationChoice] - The preferred orientation to present
 *   the screen in; "portrait" or "landscape". Defaults to screen's current orientation.
 * @param {function} [callback] - A function to be invoked after fullscreen
 *   is toggled. It is invoked with a boolean argument set to "true" if
 *   fullscreen was entered, false if it was exited.
 */
function toggleFullscreen(orientationChoice, callback) {
	var callback = callback || function() {/* noop */};

	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
		document.documentElement.style.overflow = "hidden";
		enterFullscreen(orientationChoice);
		callback(true);
	} else {
		exitFullscreen();
		callback(false);
	}
}

/**
 * Sets webpage to fullscreen mode if available.
 * @param {string} [orientationChoice] - The preferred orientation to present
 *   the screen in; "portrait" or "landscape". Defaults to screen's current orientation.
 */
function enterFullscreen(orientationChoice) {
	let elm = document.getElementById("wrapper") || document.documentElement;
	if (elm.requestFullscreen) {
		elm.requestFullscreen();
	} else if (elm.msRequestFullscreen) {
		elm.msRequestFullscreen();
	} else if (elm.mozRequestFullScreen) {
		elm.mozRequestFullScreen();
	} else if (elm.webkitRequestFullscreen) {
		elm.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	}

	elm.style.overflow = "hidden";

	window.Android2JSGameStoredBodyMargin = window.getComputedStyle(document.body).getPropertyValue("margin");

	document.body.style.margin = "0";

	if(!window.Android2JSGameFSButton.classList.contains("shrinking-btn")) {
		window.Android2JSGameFSButton.classList.add("shrinking-btn");
	}

	/**
	 * Note: orientation lock performs a screen resize, so if we do it too
	 * soon, then requestFullscreen overrides it.
	 */
	setTimeout(function() {
		setPageOrientation(orientationChoice);

		setTimeout(function() {
			
			// Activity has not been started, and was requested to wait
			if(Android2JSGame.startOnEnterFullscreen &&
				!Android2JSGameActivities.length) {

				// Minimize the fullscreen button
				window.Android2JSGameFSButton.width = "24";
				window.Android2JSGameFSButton.height = "16";
				window.Android2JSGameFSButton.style.width = "24px";
				window.Android2JSGameFSButton.style.height = "16px";
				window.Android2JSGameFSButton.style.top = "10px";
				window.Android2JSGameFSButton.style.right = "10px";

				// Start game activity processes
				let mainActivity = new MainActivity();
			}
		}, 500); // Give a little time to change orientation
	}, 500); // Give a little time to enter fullscreen
}

/** Exits fullscreen if document is in fullscreen mode. */
function exitFullscreen() {
	document.body.style.margin = window.Android2JSGameStoredBodyMargin;

	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}

/**
 * Attempts to lock webpage into a given orientation.
 * @param {string} orientationChoice - The preferred orientation; "portrait" or
 *   "landscape"
 */
function setPageOrientation(orientationChoice) {
	let canLock;

	if((orientationChoice || "").indexOf("portrait") !== -1) {
		window.Android2JSGamePreferredOrientation = "portrait";
	}
	else if((orientationChoice || "").indexOf("landscape") !== -1) {
		window.Android2JSGamePreferredOrientation = "landscape";
	}

	if(typeof window.Android2JSGamePreferredOrientation === "undefined") {
		orientationChoice = getCurrentPageOrientation();
	} else {
		orientationChoice = window.Android2JSGamePreferredOrientation;
	}

	/**
	 * Remove the orientation instruction that doesn't suit this preference.
	 *
	 * Note: this library does not support switching orientations mid-game.
	 */
	if(orientationChoice === "portrait") {
		if(window.Android2JSGameTurnPortraitToLS.parentNode) {
			window.Android2JSGameTurnPortraitToLS.parentNode.removeChild(
				window.Android2JSGameTurnPortraitToLS
			);
		}

		window.Android2JSGameTurnLSToPortrait.classList.add("show");
	} else { // "landscape"
		if(window.Android2JSGameTurnLSToPortrait.parentNode) {
			window.Android2JSGameTurnLSToPortrait.parentNode.removeChild(
				window.Android2JSGameTurnLSToPortrait
			);
		}
		
		window.Android2JSGameTurnPortraitToLS.classList.add("show");
	}

	try {
		if(window.screen.orientation) {
			canLock = orientationLock.call(window.screen.orientation, orientationChoice);
		} else {
			canLock = orientationLock.call(window.screen, orientationChoice);
		}

		if(canLock) {
			// Remove orientation instruction divs
			if(window.Android2JSGameTurnPortraitToLS.parentNode) {
				window.Android2JSGameTurnPortraitToLS.parentNode.removeChild(
					window.Android2JSGameTurnPortraitToLS
				);
			}

			if(window.Android2JSGameTurnLSToPortrait.parentNode) {
				window.Android2JSGameTurnLSToPortrait.parentNode.removeChild(
					window.Android2JSGameTurnLSToPortrait
				);
			}
		}
	} catch(e) {
		console.log("Cannot lock orientation");
	}
}

/**
 * Find the orientation ("portrait" or "landscape") of the current page.
 * @returns {string}
 */
function getCurrentPageOrientation() {
	if(typeof window.matchMedia === "function") {
		if(window.matchMedia("(orientation: landscape)").matches) {
			return "landscape";
		} else if(window.matchMedia("(orientation: portrait)").matches) {
			return "portrait";
		}
	} else if(typeof window.orientation !=="undefined") {
		switch(window.orientation) {
			case 90:
			case -90:
				return "landscape";
			default:
				return "portrait";
		}
	} else {
		if(document.documentElement.clientHeight < document.documentElement.clientWidth) {
			return "landscape";
		} else {
			return "portrait";
		}
	}
}

// These aren't really different here - localStorage is available without restriction.
// Also "readable" and "writeable" have now been deprecated
const MODE_PRIVATE = "MODE_PRIVATE";
const MODE_WORLD_READABLE = "MODE_WORLD_READABLE";
const MODE_WORLD_WRITEABLE = "MODE_WORLD_WRITEABLE";

class SharedPreferences {
	constructor(savableObjectName, modeConstant) {
		this.savableObjectName = savableObjectName;
		this.modeConstant = modeConstant;

		this.editor = SharedPreferences.Editor;

		// Pull in stored object as a JSON string
		let loadedObject = null;
		
		try {
			loadedObject = localStorage.getItem(savableObjectName);
		} catch(e) {
			console.error("Cannot retrieve saved SharedPreferences due to security restrictions on localStorage.");
			loadedObject = null;
		}

		// Parse the stored JSON string if found
		if(loadedObject !== null && loadedObject !== undefined) {
			this.savableObject = JSON.parse(loadedObject);
		} else {
			this.savableObject = {};
		}
	}
	
	contains(key) {
		return this.savableObject.hasOwnProperty(key);
	}
	
	commit() {
		let objectToSave = JSON.stringify( this.savableObject );
		let successfulSave = false;

		try {
			localStorage.setItem(this.savableObjectName , objectToSave);
			successfulSave = true;
		} catch(e) {
			console.error(e);
			successfulSave = false;
		}

		return successfulSave;
	}

	apply() {
		requestAnimationFrame(function() {
			let objectToSave = JSON.stringify( this.savableObject );

			try {
				localStorage.setItem(this.savableObjectName , objectToSave);
			} catch(e) {
				console.error("Cannot perform apply() on SharedPreferences due to security restrictions on localStorage.");
			}
		});
	}

	edit() {
		return this.getEditor();
	}

	getBoolean(key, defValue) {
		if(typeof this.savableObject[key] === "boolean") {
			return this.savableObject[key];
		} else {
			return defaultValue;
		}
	}
	
	getFloat(key, defValue) {
		return parseFloat(this.savableObject[key], 10) || defaultValue;
	}
	
	getInt(key, defValue) {
		return parseInt(this.savableObject[key], 10) || defaultValue;
	}
	
	getLong(key, defValue) {
		return parseInt(this.savableObject[key], 10) || defaultValue;
	}
	
	getString(key, defValue) {
		if(typeof this.savableObject[key] === "undefined") {
			return defaultValue;
		} else {
			return this.savableObject[key];
		}
	}

	getEditor() {
		return {
			putBoolean: function(key, value) {
				if(typeof value === "boolean") {
					this.savableObject[key] = value;
				} else {
					throw new Error("Value to store is not of type boolean.");
				}
			},
			putFloat: function(key, value) {
				if(typeof value === "number" && value.toString().indexOf(".") !== -1) {
					this.savableObject[key] = value;
				} else {
					throw new Error("Value to store is not of type float.");
				}
			},
			putInt: function(key, value) {
				if(typeof value === "number" && Number.isInteger(value)) {
					this.savableObject[key] = value;
				} else {
					throw new Error("Value to store is not of type int.");
				}
			},
			putLong: function(key, value) {
				if(typeof value === "number" && Number.isInteger(value) && Number_is_Long(value)) {
					this.savableObject[key] = value;
				} else {
					throw new Error("Value to store is not of type long.");
				}	
			},
			putString: function(key, value) {
				if(typeof value === "string") {
					this.savableObject[key] = value;
				} else {
					throw new Error("Value to store is not of type String.");
				}	
			}
		};
	}
}

class VibrationEffect {}

// The "effect" is inconsequential in JS
VibrationEffect.createOneShot = function(duration, effect) {
	return duration;
};

VibrationEffect.DEFAULT_AMPLITUDE = "DEFAULT_AMPLITUDE";

// Not what you think it is...
class Vibrator {

	constructor() {}

	hasVibrator() {
		return window.hasVibrator;
	}

	vibrate(durationOrPattern) {
		if(typeof durationOrPattern) {
			window.navigator.vibrate( durationOrPattern );
		}
	}

	cancel() {
		// This stops any currently running vibration
		window.navigator.vibrate( 0 );
	}
}

/**
 * Primarily included for MediaPlayer.setDataSource
 */
class Uri {
	constructor(uriString) {
		this.string = uriString;
	}
}

Uri.parse = function(uriString) {
	return new Uri(uriString.replace(/.+\/res\/raw\/.+/));
};

/**
 * MediaPlayer is used for instance to play background music.
 * Note: for small files, like sound effect, SoundPool is preferred.
 */
class MediaPlayer {
	constructor() {

		this.audioStreamType;
		this.media = new Audio(); // @todo Allow video...
		this.src = "";

		this.looping = false;
		this.active = false; // Used internally for A2JS

		this.onPrepared = function() {/* noop */};
		this.onError = function() {/* noop */};
	}

	/** This method needs to be inside a try/catch clause. */
	prepare() {
		try {
			this.media.src = this.src;
			this.media.load();
			this.onPrepared();
		} catch(e) {
			console.error("Could not load media from src " + this.src);
		}
	}

	prepareAsync() {
		let mediaPlayer = this;
		this.media.onloadeddata = function() {
			mediaPlayer.onPrepared();
		};

		this.media.src = this.src;
		this.media.load();
	}

	start() {
		try {
			this.media.play();
			this.active = true;
		} catch(e) {
			this.onError();
		}
	}

	pause() {
		this.media.pause();
		this.active = false;
	}

	stop() {
		this.media.pause();
		this.active = false;
		this.media.currentTime = 0;
	}

	setLooping(looping) {
		this.looping = looping;
		this.media.loop = looping;
	}

	seekTo(msec, mode) {
		this.media.currentTime = msec;
	}

	reset() {
		this.active = false;
		this.media = null;
	}

	release() {
		this.media.pause();
		this.media = null;
	}

	/**
	 * Upon the writing of this library, HTML5 Audio does not support left/right
	 * volume difference, so we set both to the mean average of the two.
	 */
	setVolume(leftVolume, rightVolume) {
		this.media.volume = (leftVolume + rightVolume) / 2;
	}

	// For games, type should generally be AudioManager.STREAM_MUSIC
	setAudioStreamType(type) {
		this.audioStreamType = type;
	}

	/**
	 * This sets the path where the media will be pulled from.
	 * We save the actual load/assignment for the prepare() method
	 * or prepareAsync().
	 */
	setDataSource(contextOrUrl, uri) {
		if(arguments.length === 2) {
			this.src = uri.string;
		} else {
			this.src = contextOrUrl;
		}
	}

	setOnPreparedListener(listener) {
		this.onPrepared = listener.onPrepared;
	}

	setOnErrorListener(listener) {
		this.onError = listener.onError;
	}

	setWakeMode() {}

	setOnCompletionListener(onCompletionListener) {
		let self = this;
		this.media.onended = function() {
			onCompletionListener.onCompletion(self);
		};
	}
}

/**
 * For this library we only support the MediaPlayer.create method with
 * arguments as Context and resource ID. Attempting to overcome
 * XSS errors by streaming resources from different URLs is outside
 * the scope of what this framework is meant for.
 *
 * Example:
 *
 * mediaPlayer = MediaPlayer.create(Constants.CURRENT_CONTEXT, "my_song");
 * mediaPlayer.start();
 *
 */
MediaPlayer.create = function(context, resourceId) {

	// Currently only support audio (.wav), not video
	let mediaPlayer = new MediaPlayer();
	mediaPlayer.src = "audio/" + resourceId + ".wav";
	mediaPlayer.prepare();
	return mediaPlayer;
};

// MediaPlayer that is ready for playback
MediaPlayer.onPreparedListener = function(mediaPlayer) {};
MediaPlayer.onPreparedListener.prototype.onPrepared = function() {};

/** Mobile browsers generally know not to sleep during playback. */
MediaPlayer.setScreenOnWhilePlaying = function() {};
MediaPlayer.setWakeMode = function() {};

class AudioManager {}
AudioManager.STREAM_MUSIC = "STREAM_MUSIC";

class AudioAttributes {
	constructor() {}
}

AudioAttributes.CONTENT_TYPE_MOVIE = 3;
AudioAttributes.CONTENT_TYPE_MUSIC = 2;
AudioAttributes.CONTENT_TYPE_SPEECH = 1;
AudioAttributes.CONTENT_TYPE_UNKNOWN = 0;

AudioAttributes.USAGE_UNKNOWN = 0;
AudioAttributes.USAGE_GAME = 14;
AudioAttributes.USAGE_MEDIA = 1;

AudioAttributes.Builder = class {
	constructor(builder) { // builder is an AudioAttributes instance or nothing
		if(builder instanceof AudioAttributes) {
			this.usage = builder.usage;
			this.contentType = contentType;
		} else { // Use the defaults
			this.usage = AudioAttributes.USAGE_UNKNOWN;
			this.contentType = AudioAttributes.CONTENT_TYPE_UNKNOWN;
		}
	}

	setUsage(usage) {
		this.usage = usage;
		return this;
	}

	setContentType(contentType) {
		this.contentType = contentType;
		return this;
	}

	build() {
		let audioAttributes = new AudioAttributes();
		audioAttributes.usage = this.usage;
		audioAttributes.contentType = this.contentType;

		return audioAttributes;
	}
};

class SoundPool {

	// srcQuality is generally 0
	constructor(constructorKey, maxStreams, streamType, srcQuality) {
		if(constructorKey !== SOUND_POOL_CONSTRUCTOR_KEY) {
			console.error("Newer versions of Android do not support the " + "SoundPool constructor. Use SoundPool.Builder instead.");
		}

		this.media;
		this.clips = new ArrayList();

		this.maxStreams = maxStreams; // max # of these clips allowed to play at once

		this.onLoadCompleteListener = {
			onLoadComplete: function(soundPool, sampleId, status) {/* noop */}
		};
	}

	load(context, clip, priority) {
		let mediaPlayer = new MediaPlayer();
		let self = this;

		mediaPlayer.media.onloadeddata = function() {
			self.onLoadCompleteListener.onLoadComplete(self, "", 0);
		};

		mediaPlayer.setDataSource("audio/" + clip + ".wav");
		mediaPlayer.prepare();

		this.clips.push( mediaPlayer );
		return this.clips.size() - 1;
	}

	play(clipId, leftVolume, rightVolume, priority, loop, rate) {
		this.clips[clipId].start();
	}

	pause(clipId) {
		this.clips[clipId].pause();
	}

	resume(clipId) {
		this.clips[clipId].start();
	}

	stop() {
		this.clips[clipId].stop();
	}

	resume(clipId) {
		this.clips[clipId].start();
	}

	setVolume(clipId, leftVolume, rightVolume) {
		this.clips[clipId].setVolume(leftVolume, rightVolume);
	}

	autoPause() {
		this.clips.forEach(function(clip) {
			clip.pause();
		});
	}

	autoResume() {
		this.clips.forEach(function(clip) {
			clip.play();
		});
	}

	setOnLoadCompleteListener(onLoadCompleteListener) {
		this.onLoadCompleteListener = onLoadCompleteListener;
	}
}

SoundPool.Builder = class {
	constructor() {
		this.audioAttributes = {};
		this.maxStreams = 1;
		this.streamType = AudioManager.STREAM_MUSIC;
		this.srcQuality = 0;
	}

	build() {
		let soundPool = new SoundPool(SOUND_POOL_CONSTRUCTOR_KEY, maxStreams, streamType, srcQuality);
		return soundPool;
	}

	setAudioAttributes(audioAttributes) {
		this.audioAttributes = audioAttributes;
		return this;
	}

	setMaxStreams(maxStreams) {
		this.maxStreams = maxStreams;
		return this;
	}
};

class HashMap extends Map {
	constructor(iterable) {
		super(iterable);
	}

	put(key, value) {
		this.set(key, value);
	}
}

window.Build = {
	VERSION: {
		SDK_INT: 26 // Just a random version I chose...
	},
	VERSION_CODES: {}
};

class Log {
	constructor() {}
}

// Verbose
Log.v = function() {
	console.log.apply(this, arguments);
};

// Debug
Log.d = function() {
	console.debug.apply(this, arguments);
};

// Info
Log.i = function() {
	console.info.apply(this, arguments);
};

// Warn
Log.w = function() {
	console.warn.apply(this, arguments);
};

// Error
Log.e = function() {
	console.error.apply(this, arguments);
};

Log.println = function(priority, tag, msg) {
	switch(priority) {
		case Log.ASSERT:
			console.assert(msg);
			break;
		case Log.DEBUG:
			console.debug(msg);
			break;
		case Log.ERROR:
			console.error(msg);
			break;
		case Log.VERBOSE:
			console.log(msg + "\n");
			break;
		case Log.WARN:
			console.warn(msg);
			break;
	}
};

Log.wtf = function(tag, msg) {
	console.log(msg + " @ " + tag, "... wtf");
};

Log.ASSERT = 7;
Log.DEBUG = 3;
Log.ERROR = 6;
Log.VERBOSE = 2;
Log.WARN = 5;

/**
 * Determines if a given number satisfies definitions of a "long" type
 * in Java.
 * @param {number} num - The number to check for. If a non-number
 * is provided for this argument, we automatically return false.
 * @returns {boolean}
 */
function Number_is_Long(num) {
	if(typeof num !== "number") {
		return false;
	}

	if(num < 0) {
		return false;
	}

	if(num > Math.pow(2, 64) - 1) {
		return false;
	}

	return true;
}

/**
 * Gets the fullscreen dimensions for the current device
 * @returns {Object} A plain JS object with `width` and `height`
 */
function getFullscreenDimensions() {
	let screenWidth = null;
	let screenHeight = null;

	/**
	 * Safari/Opera do not support fullscreen, so provide
	 * dimensions without toolbars, scrollbars, etc.
	 */
	if(window.badApple) {
		return {
			screenWidth: window.screen.availWidth,
			screenHeight: window.screen.availHeight
		};
	}

	if(window.screen && window.screen.width) {
		screenWidth = window.screen.width;
		screenHeight = window.screen.height;
	} else if(window.outerWidth) {
		screenWidth = window.outerWidth;
		screenHeight = window.outerHeight;
	} else {
		screenWidth = document.documentElement.clientWidth;
		screenHeight = document.documentElement.clientHeight;
	}

	return {
		width: screenWidth,
		height: screenHeight
	};
}