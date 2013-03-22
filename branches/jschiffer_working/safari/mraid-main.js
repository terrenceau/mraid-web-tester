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
		UNKNOWN : '0.0',
		
		V1  : '1.0',
		V2  : '2.0'
	};
	
	var PLACEMENTS = mraid.PLACEMENTS = {
		UNKNOWN      : 'unknown',
		
		INLINE       : 'inline',
		INTERSTITIAL : 'interstitial'
	}
	
	var ORIENTATIONS = mraid.ORIENTATIONS = {
		NONE      : 'none',
		PORTRAIT  : 'portrait',
		LANDSCAPE : 'landscape'
	}
	
	var CLOSEPOSITIONS = mraid.CLOSEPOSITIONS = {
		TOPLEFT     : 'top-left',
		TOPRIGHT    : 'top-right',
		TOPCENTER 	: 'top-center',
		BOTTOMLEFT  : 'bottom-left',
		BOTTOMRIGHT : 'bottom-right',
		BOTTOMCENTER: 'bottom-center',
		CENTER      : 'center'
	}
	
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
        SIZECHANGE          :'sizeChange',
    };
    
    var FEATURES = mraid.FEATURES = {
        SMS         :'sms',
        TEL         :'tel',
        CALENDAR    :'calendar',
        STOREPICTURE:'storePicture',
		INLINEVIDEO	:'inlineVideo'
    };
    
    // PRIVATE PROPERTIES (sdk controlled) //////////////////////////////////////////////////////
    
    var state = STATES.UNKNOWN;
	
	var placementType = PLACEMENTS.UNKNOWN;
    
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
	
	var currentPosition = {
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
		isModal:true
    };
	
	var resizeProperties = {
		width: 0,
		height: 0,
		customClosePosition: CLOSEPOSITIONS.TOPRIGHT,
		offsetX: 0,
		offsetY: 0,
		allowOffscreen: true
	};
	
	var orientationProperties = {
		allowOrientationChange: true,
		forceOrientation: ORIENTATIONS.NONE
	}
    
    var supports = {
        'sms':true,
        'tel':true,
        'email':true,
        'calendar':true,
        'storePicture':true,
		'inlineVideo':true,
        'orientation':true
    };
    
    var orientation = -1;
    var mraidVersion = VERSIONS.UNKNOWN;
    var screenSize = null;
	var isViewable = false;
    

    
    // PRIVATE PROPERTIES (internal) //////////////////////////////////////////////////////
    
    var intervalID = null;
    
    var dimensionValidators = {
        x:function(value) { return !isNaN(value); },
        y:function(value) { return !isNaN(value); },
        width:function(value) { return !isNaN(value) && value >= 0; },
        height:function(value) { return !isNaN(value) && value >= 0; }
    };
    
    var sizeValidators = {
        width:function(value) { return !isNaN(value) && value >= 0; },
        height:function(value) { return !isNaN(value) && value >= 0; }
    };
    
    var expandPropertyValidators = {
        isModal:function(value) { return (value === true); },
		useCustomClose:function(value) { return (value === true || value === false); }, 
		width:function(value) { return !isNaN(value) && value >= 0; }, 
		height:function(value) { return !isNaN(value) && value >= 0; },	
        allowOrientationChange:function(value) { return (value === true || value === false); },
        forceOrientation:function(value) { return (value in ORIENTATIONS); } 
    };
    
	var resizePropertyValidators = {
		width:function(value) { return !isNaN(value) && value >= 0; }, 
		height:function(value) { return !isNaN(value) && value >= 0; },	
		offsetX:function(value) { return !isNaN(value); }, 
		offsetY:function(value) { return !isNaN(value); },	
        allowOffscreen:function(value) { return (value === true || value === false); },
        customClosePosition:function(value) { for (a in CLOSEPOSITIONS) if (value === CLOSEPOSITIONS[a]) return(true); return(false); }
	}
	
	var orientationPropertyValidators = {
		allowOrientationChange:function(value) { return typeof('false')==='boolean' }, 
        forceOrientation:function(value) { for (a in ORIENTATIONS) if (value === ORIENTATIONS[a]) return(true); return(false); }
	}

    var changeHandlers = {
		version:function(val) {
			mraidVersion = val;
		},
		placement:function(val){
			placementType = val;
		},
        state:function(val,dispatch) {
			console.log('state listener. state='+state+':new='+val);
            if (state == STATES.UNKNOWN && val != STATES.UNKNOWN) {
                broadcastEvent(EVENTS.INFO, 'controller initialized');
            }
			if (state == STATES.LOADING && val != STATES.LOADING) {
                mraid.signalReady();
			} else {
				broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(val));
				state = val;
                if(dispatch == true){
                    broadcastEvent(EVENTS.STATECHANGE, state);    
                }
				
			}
        },
        size:function(val,dispatch) {
            
            console.info(this);
            broadcastEvent(EVENTS.INFO, 'setting size to ' + stringify(val));
            size = val;
            if(dispatch==true){
                broadcastEvent(EVENTS.SIZECHANGE, size.width, size.height);    
            }
        },
        defaultPosition:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting default position to ' + stringify(val));
            defaultPosition = val;
        },
		currentPosition:function(val) {
			broadcastEvent(EVENTS.INFO, 'setting current position to ' + stringify(val));
			currentPosition = val;
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
		resizeProperties:function(val) {
			broadcastEvent(EVENTS.INFO, 'merging resizeProperties with ' + stringify(val));
			for (var i in val) {
				resizeProperties[i] = val[i];
			}
		},
        supports:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting supports to ' + stringify(val));
            supports = {};
            for (var key in FEATURES) {
                supports[FEATURES[key]] = contains(FEATURES[key], val);
            }
        },
        orientation:function(val,dispatch) {
            broadcastEvent(EVENTS.INFO, 'setting orientation to ' + stringify(val));
            orientation = val;
            if(dispatch == true){
                broadcastEvent(EVENTS.ORIENTATIONCHANGE, orientation);
            }
        },
        screenSize:function(val,dispatch) {
            broadcastEvent(EVENTS.INFO, 'setting screenSize to ' + stringify(val));
            screenSize = val;
            if(dispatch == true){
                broadcastEvent(EVENTS.SCREENCHANGE, screenSize.width, screenSize.height);    
            }
        },
		isViewable:function(val,dispatch) {
			broadcastEvent(EVENTS.INFO, 'setting isViewable to ' + stringify(val));
			isViewable = val;
            if(dispatch == true){
                broadcastEvent(EVENTS.VIEWABLECHANGE, isViewable);    
            }
		},
		orientationProperties:function(val) {
			broadcastEvent(EVENTS.INFO, 'setting orientationProperties to ' + stringify(val));
			for (var i in val) {
				orientationProperties[i] = val[i];
			}
		}
    };


    
    var listeners = {};
    
    var EventListeners = function(event) {
        console.info('new EventListeners event = '+event);

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

    var modelStrategies = {
        equate      :  function equate(prop1,prop2){
                                prop1 = prop2;
                                return prop1;
                            },
        override    :  function override(origObject,newObject){
                                for( var i in newObject){ 
                                    origObject[i] = newObject[i] ;
                                } 
                                return origObject;
                            },
        remap       :  function remap(target,properties,val){
                                console.info('remap');
                                console.info('target');
                                console.info(target);
                                console.info('val');
                                console.info(val);
                                target = {};
                                for(var n in properties){
                                    target[properties[n]] = contains(properties[n],val);
                                }
                                return target;
                            },
        //not using this because it is insane.                    
        conditional :  function conditional(conditionArray,methodArray){
                            for(var i=0,il=conditions.length;i<il;i++){
                                if(conditions[i] == true){
                                    methodArray[i].method.apply(this,methodArray[i].arguments)
                                }
                            }
                        },
        state       :   function state(currentState,val){
                            console.info('state "strategy function" ');
                            console.info('currentState')
                            console.info(currentState)
                            console.info('val');
                            console.info(val);
                            if (currentState == STATES.UNKNOWN && val != STATES.UNKNOWN) {
                                broadcastEvent(EVENTS.INFO, 'controller initialized');
                            }
                            if (currentState == STATES.LOADING && val != STATES.LOADING) {
                                mraid.signalReady();
                                //
                                return STATES.DEFAULT;//this change happens globally in signal ready;
                            } else {
                                broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(val));
                                return val;
                            }
                        }
        }

    var model = {
        'version'               : {'value':mraidVersion,'strategy':modelStrategies.equate},
        'placement'             : {'value':placementType,'strategy':modelStrategies.equate},
        'state'                 : {'value':state,'strategy':modelStrategies.state},
        'size'                  : {'value':size,'strategy':modelStrategies.equate},
        'defaultPosition'       : {'value':defaultPosition,'strategy':modelStrategies.equate},
        'currentPosition'       : {'value':currentPosition,'strategy':modelStrategies.equate},
        'maxSize'               : {'value':maxSize,'strategy':modelStrategies.equate},
        'expandProperties'      : {'value':expandProperties,'strategy':modelStrategies.override},
        'supports'              : {'value':supports,'strategy':modelStrategies.remap,'arguments':FEATURES,'argumentPosition':0},
        'orientation'           : {'value':orientation,'strategy':modelStrategies.equate},
        'screenSize'            : {'value':screenSize,'strategy':modelStrategies.equate},
        'isViewable'            : {'value':isViewable,'strategy':modelStrategies.equate},
        'orientationProperties' : {'value':orientationProperties,'strategy':modelStrategies.override},
        getProperty:function(name){
            return this[name]
        }
    }

    var updateModel = function(data){
        //we get the change object which has name of model propery and arguments.
        //we look up whcih model object we want, 
        //we then apply the appropriate strategy and assign it that model objects value; 
        //does this propagate outside the model.... e.g if i assign mraidversion.value = 
        console.info('updateModel data');
        console.info(data);
        for(var n in data){
            console.info(n+ ' == '+data[n]);
            var modelName = n;
            console.info('modelName');
            console.info(modelName);
            var currentModel = model[n];
            if(modelName == 'state'){
                alert('state = '+currentModel.value);
            }
            console.info('currentModel('+n+')');
            console.info(currentModel);
            
            if(currentModel){
                var args = [data[n]];
                    //args = currentModel.arguments ? currentModel.arguments.concat(data[n]):args;
                    if(currentModel.arguments){
                        var pos = currentModel.argumentPosition;
                        args.splice(pos,0,currentModel.arguments);
                        console.info('args.length');
                        console.info(args.length);
                        console.info(args);

                    }
                args.unshift(currentModel.value);

                currentModel.value = currentModel.strategy.apply(this,args);
                /*
                switch(currentModel.strategy.name){
                    case 'equate':
                        currentModel.value = currentModel.strategy.apply(this,args);
                    break;
                    case 'remap':
                        currentModel.value = currentModel.strategy.apply(this,args);
                    break;
                    case 'state':
                        currentModel.value = currentModel.strategy.apply(this,args);
                    break;
                    case 'override':
                        currentModel.value = currentModel.strategy.apply(this,args);
                    break;
                    case 'conditional':
                    //too crazy.
                    break;
                }
                */
                //currentModel.value = currentModel.strategy.apply(this,[currentModel.value,data[n]]);   
                
                console.info('after apply,for modelName '+modelName+' currentModel.value = ');
                console.info(currentModel.value);
            }
            
        }
        //console.info(mraidversion);
        console.info('********** model ************');
        console.info(model);
    }
    
    // PRIVATE METHODS ////////////////////////////////////////////////////////////
    /*
        on  pushChange, registers and fires specified (specified in pushChage params) changeHandlers.
    */
    mraidview.addEventListener('change', function(properties) {
        console.warn('change event in mraid-main');

        console.dir(properties);
        updateModel(properties);
        for (var property in properties) {
            var handler = changeHandlers[property];
    //console.log('for property "' + property + '" typeof handler is: ' + typeof(handler));			
            //executes function(args);
            handler(properties[property],false);
        }

        setTimeout(function(){
            for (var property in properties) {
            var handler = changeHandlers[property];
            console.log('for property "' + property + '" typeof handler is: ' + typeof(handler));           
            //executes function(args);
            handler(properties[property],true);
        }
        },100)
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
        if(event!='info'){
            console.info('mraid-main, broadcast event')
            console.info('event = '+event);
        }
            
    
        if (listeners[event]) {
            listeners[event].broadcast(args);
        }
    }
    
    // PUBLIC METHODS ////////////////////////////////////////////////////////////////////
    
    mraid.signalReady = function() {
	/* introduced in MRAIDv1 */
		broadcastEvent(EVENTS.INFO, 'START READY SIGNAL, setting state to ' + stringify(STATES.DEFAULT));
		state = STATES.DEFAULT;
        
		broadcastEvent(EVENTS.STATECHANGE, state);
        

		broadcastEvent(EVENTS.INFO, 'ready event fired');
		broadcastEvent(EVENTS.READY, 'ready event fired');
        window.clearInterval(intervalID);
    };
	
	mraid.getVersion = function() {
	/* introduced in MRAIDv1 */
		return (mraidVersion);
	};
	    
    mraid.info = function(message) {
	/* not in MRAID - unique to mraid-web-tester */
        broadcastEvent(EVENTS.INFO, message);
    };
    
    mraid.error = function(message) {
	/* introduced in MRAIDv1 */
        broadcastEvent(EVENTS.ERROR, message);
    };
    
    mraid.addEventListener = function(event, listener) {
	/* introduced in MRAIDv1 */
        if (!event || !listener) {
            broadcastEvent(EVENTS.ERROR, 'Both event and listener are required.', 'addEventListener');
        } else if (!contains(event, EVENTS)) {
			broadcastEvent(EVENTS.ERROR, 'Unknown event: ' + event, 'addEventListener');
        } else {
            if (!listeners[event]) listeners[event] = new EventListeners(event);
            listeners[event].add(listener);
        }
    };
    
    mraid.removeEventListener = function(event, listener) {
	/* introduced in MRAIDv1 */
        if (!event) {
            broadcastEvent(EVENTS.ERROR, 'Must specify an event.', 'removeEventListener');
        } else {
            if (!listener || (typeof(listeners[event]) === 'undefined' || !listeners[event].remove(listener))) {
                broadcastEvent(EVENTS.ERROR, 'Listener not currently registered for event: ' + event, 'removeEventListener');
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
    
    mraid.getState = function() {
	/* introduced in MRAIDv1 */
        return state;
    };
    
    mraid.getPlacementType = function() {
	/* introduced in MRAIDv1 */
        return placementType;
    };
	
	mraid.isViewable = function() {
	/* introduced in MRAIDv1 */
		return isViewable;
	};

    mraid.open = function(URL) {
	/* introduced in MRAIDv1 */
        if (!URL) {
            broadcastEvent(EVENTS.ERROR, 'URL is required.', 'open');
        } else {
            mraidview.open(URL);
        }
    };
    
    mraid.expand = function(URL) {
        console.info('mraid-main.js expand()');
    	if (placementType === PLACEMENTS.INLINE) {
            console.info('mraid-main.js falling into expand condition')
        	mraidview.expand(URL);
        }
    };
    
    /*mraid.expand = function(dimensions, URL) {
	/* introduced in MRAIDv1 */
		/*var bOverride = true;
		if (dimensions === undefined) {
			dimensions = {width:mraid.getMaxSize(bOverride).width, height:mraid.getMaxSize(bOverride).height, x:0, y:0};
		}
        broadcastEvent(EVENTS.INFO, 'expanding to ' + stringify(dimensions));
        if (valid(dimensions, dimensionValidators, 'expand', true)) {
            mraidview.expand(dimensions, URL);
        }
    };*/
    
    mraid.getExpandProperties = function() {
	/* introduced in MRAIDv1 */
		var props = clone(expandProperties);
		// if (parseFloat(mraidVersion, 10) < 2) {
			// delete props.allowOrientationChange;
			// delete props.forceOrientation;
	    // }
        return props;
    };
    
    mraid.setExpandProperties = function(properties) {
	/* introduced in MRAIDv1 */
        if (valid(properties, expandPropertyValidators, 'setExpandProperties')) {
            mraidview.setExpandProperties(properties);
        }
    };
    
    mraid.close = function() {
	/* introduced in MRAIDv1 */
        mraidview.close();
    };
    
	mraid.useCustomClose = function(useCustomCloseIndicator) {
	/* introduced in MRAIDv1 */
		mraidview.useCustomClose(useCustomCloseIndicator)
	};
    
    mraid.resize = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (resize)', 'resize');
	    } else {
	    	if (placementType === PLACEMENTS.INLINE) {
				mraidview.resize();
	    	}
		}
    };
    
    mraid.getResizeProperties = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getResizeProperties)', 'getResizeProperties');
	    } else {
	    	return clone(resizeProperties);
		}
		return (null);
    };
    
    mraid.setResizeProperties = function(properties) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (setResizeProperties)', 'setResizeProperties');
	    } else {
			if (valid(properties, resizePropertyValidators, 'setResizeProperties')) {
				mraidview.setResizeProperties(properties);
			}
		}
    };
    
    mraid.getCurrentPosition = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getCurrentPosition)', 'getCurrentPosition');
	    } else {
	        return clone(currentPosition);
		}
		return (null);
    };
	
	mraid.getSize = function() {
	/* introduced in MRAIDv1, deprecated in MRAIDv2 */
        var pos = clone(currentPosition);
		return ({width:pos.width, height:pos.height});
    };
    
    mraid.getMaxSize = function(bOverride) {
	/* introduced in MRAIDv2, bOverride is an mraid-web-tester extension */
	    if (!bOverride && parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getMaxSize)', 'getMaxSize');
	    } else {
	        return clone(maxSize);
		}
		return (null);
    };
    
    mraid.getDefaultPosition = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getDefaultPosition)', 'getDefaultPosition');
	    } else {
	        return clone(defaultPosition);
		}
		return (null);
    };
    
    mraid.getScreenSize = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getScreenSize)', 'getScreenSize');
	    } else {
	        return clone(screenSize);
		}
		return (null);
    };
    
    mraid.supports = function(feature) {
	/* introduced in MRAIDv2 */
		var bSupports = false;
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (supports)', 'supports');
	    } else {
				bSupports = supports[feature];
	    }
		return (bSupports);
    };

	mraid.storePicture = function(url) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (storePicture)', 'storePicture');
	    } else {
			if (!supports[FEATURES.STOREPICTURE]) {
				broadcastEvent(EVENTS.ERROR, 'Method not supported by this client. (storePicture)', 'storePicture');
			} else if (!url || typeof url !== 'string') {
				broadcastEvent(EVENTS.ERROR, 'Valid url required. (storePicture)', 'storePicture');
			} else {
				mraidview.storePicture(url);
			}
		}
	};

    mraid.createCalendarEvent = function(params) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (createCalendarEvent)', 'createCalendarEvent');
	    } else {
			if (!supports[FEATURES.CALENDAR]) {
				broadcastEvent(EVENTS.ERROR, 'Method not supported by this client. (createCalendarEvent)', 'createCalendarEvent');
			} else if (!params || typeof params != 'object') {
				broadcastEvent(EVENTS.ERROR, 'Valid params required.', 'createCalendarEvent');
			} else {
				mraidview.createCalendarEvent(params);
			}
        }
    };
	
	mraid.playVideo = function(url) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(mraidVersion, 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (playVideo)', 'playVideo');
	    } else {
			if (supports[FEATURES.INLINEVIDEO]) {
				broadcastEvent(EVENTS.INFO, 'Inline video is available but playVideo uses native player.');
			} 
			if (!url || typeof url != 'string') {
				broadcastEvent(EVENTS.ERROR, 'Valid url required.', 'playVideo');
			} else {
				mraidview.playVideo(url);
			}
        }
	};
    
    mraid.getOrientation = function() {
	/* not in MRAID - unique to mraid-web-tester */
        if (!supports[FEATURES.ORIENTATION]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client. (getOrientation)', 'getOrientation');
        }
        return orientation;
    };
    
    mraid.setOrientationProperties = function (properties) {
    	if (parseFloat(mraidVersion, 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (setOrientationProperties)', 'setOrientationProperties');
	    } else {
	    	if (valid(properties, orientationPropertyValidators, 'setOrientationProperties')) {
				mraidview.setOrientationProperties(properties);
			}
		}
    };
    
    mraid.getOrientationProperties = function () {
    	if (parseFloat(mraidVersion, 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getOrientationProperties)', 'getOrientationProperties');
	    } else {
	        return clone(orientationProperties);
		}
		return (null);
    };
})();