/*
 *  Copyright (c) 2012 The mraid-web-tester project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

(function() {
    var mraid = window.mraid = {};
	    
    // CONSTANTS ///////////////////////////////////////////////////////////////
    
	var VERSIONS = mraid.VERSIONS = {
		V1  : '1.0',
		V2  : '2.0'
	};
	
    var STATES = mraid.STATES = {
        UNKNOWN     :'unknown',

		LOADING		:'loading',
        DEFAULT     :'default',
        RESIZED     :'resized',
        EXPANDED    :'expanded',
        HIDDEN      :'hidden'
    };
	
    var EVENTS = mraid.EVENTS = {
        INFO                :'info',
        ORIENTATIONCHANGE   :'orientationChange',
		
		READY				:'ready',
        ERROR               :'error',
        STATECHANGE         :'stateChange',
 		VIEWABLECHANGE		:'viewableChange',
		CALENDAREVENTADDED  :'calendarEventAdded',
		PICTUREADDED        :'pictureAdded',
        SIZECHANGE          :'sizeChange',
    };
    
    var FEATURES = mraid.FEATURES = {
        SMS         :'sms',
        PHONE       :'phone',
        EMAIL       :'email',
        CALENDAR    :'calendar',
        STOREPICTURE:'storePicture',
		INLINEVIDEO	:'inlineVideo'
    };
    
    // PRIVATE PROPERTIES (sdk controlled) //////////////////////////////////////////////////////
    
    var state = STATES.UNKNOWN;
    
    var size = {
        width:0,
        height:0
    };
    
    var defaultPosition = {
        x:0,
        y:0,
        width:0,
        height:0
    };
    
    var maxSize = {
        width:0,
        height:0
    };
    
    var expandProperties = {
		width:0,
		height:0,
		useCustomClose:false,
		isModal:true,
        useBackground:false,
        backgroundColor:0xffffff,
        backgroundOpacity:1.0
    };
    
    var supports = {
        'sms':true,
        'phone':true,
        'email':true,
        'calendar':true,
        'storePicture':true,
		'inlineVideo':true,
        'orientation':true
    };
    
    var orientation = -1;
    var mraidVersion = 'unknown';
    var screenSize = null;
    
    // PRIVATE PROPERTIES (internal) //////////////////////////////////////////////////////
    
    var intervalID = null;
	var readyInterval = 750;
    
	//@TODO: don't think I need dimension validators anymore
    var dimensionValidators = {
        x:function(value) { return !isNaN(value); },
        y:function(value) { return !isNaN(value); },
        width:function(value) { return !isNaN(value) && value >= 0; },
        height:function(value) { return !isNaN(value) && value >= 0; }
    };
    
	//@TODO: ok to allow ads that are larger than maxSize
    var sizeValidators = {
        width:function(value) { return !isNaN(value) && value >= 0 && value <= maxSize.width; },
        height:function(value) { return !isNaN(value) && value >= 0 && value <= maxSize.height; }
    };
    
	//@TODO: there are more expand properties
    var expandPropertyValidators = {
        useBackground:function(value) { return (value === true || value === false); },
        backgroundColor:function(value) { return (typeof value == 'string' && value.substr(0,1) == '#' && !isNaN(parseInt(value.substr(1), 16))); },
        backgroundOpacity:function(value) { return !isNaN(value) && value >= 0 && value <= 1; },
        isModal:function(value) { return (value === true || value === false); },
		useCustomClose:function(value) { return (value === true || value === false); }, 
		width:function(value) { return !isNaN(value) && value >= 0; }, 
		height:function(value) { return !isNaN(value) && value >= 0; }	
    };
    
    var changeHandlers = {
		version:function(val) {
			mraidVersion = val;
		},
        state:function(val) {
            if (state == STATES.UNKNOWN && val != STATES.UNKNOWN) {
                broadcastEvent(EVENTS.INFO, 'controller initialized');
            }
			if (state == STATES.LOADING && val != STATES.LOADING) {
                intervalID = window.setInterval(mraid.signalReady, readyInterval);
                broadcastEvent(EVENTS.INFO, 'controller ready, attempting callback');
			} else {
				broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(val));
				state = val;
				broadcastEvent(EVENTS.STATECHANGE, state);
			}
        },
        size:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting size to ' + stringify(val));
            size = val;
            broadcastEvent(EVENTS.SIZECHANGE, size.width, size.height);
        },
        defaultPosition:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting default position to ' + stringify(val));
            defaultPosition = val;
        },
        maxSize:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting maxSize to ' + stringify(val));
            maxSize = val;
        },
        expandProperties:function(val) {
            broadcastEvent(EVENTS.INFO, 'merging expandProperties with ' + stringify(val));
            for (var i in val) {
                expandProperties[i] = val[i];
            }
        },
        supports:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting supports to ' + stringify(val));
            supports = {};
            for (var key in FEATURES) {
                supports[FEATURES[key]] = contains(FEATURES[key], val);
            }
        },
        orientation:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting orientation to ' + stringify(val));
            orientation = val;
            broadcastEvent(EVENTS.ORIENTATIONCHANGE, orientation);
        },
        screenSize:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting screenSize to ' + stringify(val));
            screenSize = val;
            broadcastEvent(EVENTS.SCREENCHANGE, screenSize.width, screenSize.height);
        }
    };
    
    var listeners = {};
    
    var EventListeners = function(event) {
        this.event = event;
        this.count = 0;
        var listeners = {};
        
        this.add = function(func) {
            var id = String(func);
            if (!listeners[id]) {
                listeners[id] = func;
                this.count++;
                if (this.count == 1) {
                    broadcastEvent(EVENTS.INFO, 'activating ' + event);
                    mraidview.activate(event);
                }
            }
        };
        this.remove = function(func) {
            var id = String(func);
            if (listeners[id]) {
                listeners[id] = null;
                delete listeners[id];
                this.count--;
                if (this.count == 0) {
                    broadcastEvent(EVENTS.INFO, 'deactivating ' + event);
                    mraidview.deactivate(event);
                }
                return true;
            } else {
                return false;
            }
        };
        this.removeAll = function() { for (var id in listeners) this.remove(listeners[id]); };
        this.broadcast = function(args) { for (var id in listeners) listeners[id].apply({}, args); };
        this.toString = function() {
            var out = [event,':'];
            for (var id in listeners) out.push('|',id,'|');
            return out.join('');
        };
    };
    
    // PRIVATE METHODS ////////////////////////////////////////////////////////////
    
    mraidview.addEventListener('change', function(properties) {
        for (var property in properties) {
            var handler = changeHandlers[property];
            handler(properties[property]);
        }
    });
    
    mraidview.addEventListener('error', function(message, action) {
        broadcastEvent(EVENTS.ERROR, message, action);
    });
    
    var clone = function(obj) {
        var f = function() {};
        f.prototype = obj;
        return new f();
    };
    
    var stringify = function(obj) {
        if (typeof obj == 'object') {
            if (obj.push) {
                var out = [];
                for (var p = 0; p < obj.length; p++) {
                    out.push(obj[p]);
                }
                return '[' + out.join(',') + ']';
            } else {
                var out = [];
                for (var p in obj) {
                    out.push('\''+p+'\':'+obj[p]);
                }
                return '{' + out.join(',') + '}';
            }
        } else {
            return String(obj);
        }
    };
    
    var valid = function(obj, validators, action, full) {
        if (full) {
            if (obj === undefined) {
                broadcastEvent(EVENTS.ERROR, 'Required object missing.', action);
                return false;
            } else {
                for (var i in validators) {
                    if (obj[i] === undefined) {
                        broadcastEvent(EVENTS.ERROR, 'Object missing required property ' + i, action);
                        return false;
                    }
                }
            }
        }
        for (var i in obj) {
            if (!validators[i]) {
                broadcastEvent(EVENTS.ERROR, 'Invalid property specified - ' + i + '.', action);
                return false;
            } else if (!validators[i](obj[i])) {
                broadcastEvent(EVENTS.ERROR, 'Value of property ' + i + ' is not valid type.', action);
                return false;
            }
        }
        return true;
    };
    
    var contains = function(value, array) {
        for (var i in array) if (array[i] == value) return true;
        return false;
    };
    
    var broadcastEvent = function() {
        var args = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) args[i] = arguments[i];
        var event = args.shift();
        if (listeners[event]) listeners[event].broadcast(args);
    }
    
    // VERSION 1 ////////////////////////////////////////////////////////////////////
    
    mraid.signalReady = function() {
		broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(STATES.DEFAULT));
		state = STATES.DEFAULT;
		broadcastEvent(EVENTS.STATECHANGE, state);
		
		broadcastEvent(EVENTS.INFO, 'ready eventListener triggered');
		broadcastEvent(EVENTS.READY, 'ready event fired');
        window.clearInterval(intervalID);
    };
	
    mraid.readyTimeout = function() {
        window.clearInterval(intervalID);
        broadcastEvent(EVENTS.ERROR, 'No MRAID ready listener found (timeout of ' + readyTimeout + 'ms occurred)');
    };
    
	mraid.getVersion = function() {
		return (mraidVersion);
	};
	    
    mraid.info = function(message) {
        broadcastEvent(EVENTS.INFO, message);
    };
    
    mraid.error = function(message) {
        broadcastEvent(EVENTS.ERROR, message);
    };
    
    mraid.addEventListener = function(event, listener) {
        if (!event || !listener) {
            broadcastEvent(EVENTS.ERROR, 'Both event and listener are required.', 'addEventListener');
        } else if (!contains(event, EVENTS)) {
			broadcastEvent(EVENTS.ERROR, 'Unknown event: ' + event, 'addEventListener');
        } else {
            if (!listeners[event]) listeners[event] = new EventListeners(event);
            listeners[event].add(listener);
        }
    };
    
    mraid.close = function() {
        mraidview.close();
    };
    
    mraid.expand = function(dimensions, URL) {
		if (dimensions === undefined) {
			dimensions = {width:mraid.getMaxSize().width, height:mraid.getMaxSize().height, x:0, y:0};
		}
        broadcastEvent(EVENTS.INFO, 'expanding to ' + stringify(dimensions));
        if (valid(dimensions, dimensionValidators, 'expand', true)) {
            mraidview.expand(dimensions, URL);
        }
    };
    
    mraid.getDefaultPosition = function() {
        return clone(defaultPosition);
    };
    
    mraid.getExpandProperties = function() {
        return clone(expandProperties);
    };
    
    mraid.getMaxSize = function() {
        return clone(maxSize);
    };
    
    mraid.getSize = function() {
        return clone(size);
    };
    
    mraid.getState = function() {
        return state;
    };
    
    mraid.hide = function() {
        if (state == STATES.HIDDEN) {
            broadcastEvent(EVENTS.ERROR, 'Ad is currently hidden.', 'hide');
        } else {
            mraidview.hide();
        }
    };
    
    mraid.open = function(URL, controls) {
        if (!URL) {
            broadcastEvent(EVENTS.ERROR, 'URL is required.', 'open');
        } else {
            mraidview.open(URL, controls);
        }
    };
    
    mraid.removeEventListener = function(event, listener) {
        if (!event) {
            broadcastEvent(EVENTS.ERROR, 'Must specify an event.', 'removeEventListener');
        } else {
            if (listener && (!listeners[event] || !listeners[event].remove(listener))) {
                broadcastEvent(EVENTS.ERROR, 'Listener not currently registered for event', 'removeEventListener');
                return;
            } else {
                listeners[event].removeAll();
            }
            if (listeners[event].count == 0) {
                listeners[event] = null;
                delete listeners[event];
            }
        }
    };
    
    mraid.resize = function(width, height) {
        if (width == null || height == null || isNaN(width) || isNaN(height) || width < 0 || height < 0) {
            broadcastEvent(EVENTS.ERROR, 'Requested size must be numeric values between 0 and maxSize.', 'resize');
        } else if (width > maxSize.width || height > maxSize.height) {
            broadcastEvent(EVENTS.ERROR, 'Request (' + width + ' x ' + height + ') exceeds maximum allowable size of (' + maxSize.width +  ' x ' + maxSize.height + ')', 'resize');
        } else if (width == size.width && height == size.height) {
            broadcastEvent(EVENTS.ERROR, 'Requested size equals current size.', 'resize');
        } else {
            mraidview.resize(width, height);
        }
    };
    
    mraid.setExpandProperties = function(properties) {
        if (valid(properties, expandPropertyValidators, 'setExpandProperties')) {
            mraidview.setExpandProperties(properties);
        }
    };
    
    // mraid.setResizeProperties = function(properties) {};
    
    mraid.show = function() {
        if (state != STATES.HIDDEN) {
            broadcastEvent(EVENTS.ERROR, 'Ad is currently visible.', 'show');
        } else {
            mraidview.show();
	        }
    };
	
	mraid.useCustomClose = function() {
		//@TODO
	}
    
    // LEVEL 2 ////////////////////////////////////////////////////////////////////
    
    mraid.createEvent = function(date, title, body) {
        if (!supports[FEATURES.CALENDAR]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'createEvent');
        } else if (!date || typeof date != 'object' || !date.getDate) {
            broadcastEvent(EVENTS.ERROR, 'Valid date required.', 'createEvent');
        } else if (!title || typeof title != 'string') {
            broadcastEvent(EVENTS.ERROR, 'Valid title required.', 'createEvent');
        } else {
            mraidview.createEvent(date, title, body);
        }
    };
    
    mraid.getOrientation = function() {
        if (!supports[FEATURES.ORIENTATION]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getOrientation');
        }
        return orientation;
    };
    
    mraid.getScreenSize = function() {
        if (!supports[FEATURES.SCREEN]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getScreenSize');
        } else {
            return (null == screenSize)?null:clone(screenSize);
        }
    };
    
    mraid.supports = function(feature) {
        if (supports[feature]) {
            return true;
        } else {
            return false;
        }
    };
    
    mraid.request = function(uri, display) {
        if (!supports[FEATURES.LEVEL3]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'request');
        } else if (!uri || typeof uri != 'string') {
            broadcastEvent(EVENTS.ERROR, 'URI is required.', 'request');
        } else {
            mraidview.request(uri, display);
        }
    };
	
})();