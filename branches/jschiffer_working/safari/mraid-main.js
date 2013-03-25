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
    // pushed these into _models
    var model = (function(){
        var _models = {
                'version'               : {'value':VERSIONS.UNKNOWN,'strategy':'assign'},
                'placement'             : {'value':PLACEMENTS.UNKNOWN,'strategy':'assign'},
                'state'                 : {'value':STATES.UNKNOWN,'strategy':'state'},
                'size'                  : {'value':{width:0,height:0},'strategy':'assign'},
                'defaultPosition'       : {'value':{x:0,y:0,width:0,height:0},'strategy':'assign'},
                'currentPosition'       : {'value':{x:0,y:0,width:0,height:0},'strategy':'assign'},
                'maxSize'               : {'value':{width:0,height:0},'strategy':'assign'},
                'expandProperties'      : {'value':{width:0,height:0,useCustomClose:false,isModal:true},'strategy':'override'},
                'supports'              : {'value':{'sms':true,'tel':true,'email':true,'calendar':true,'storePicture':true,'inlineVideo':true,'orientation':true},'strategy':'remap','arguments':FEATURES,'argumentPosition':0},
                'orientation'           : {'value':-1,'strategy':'assign'},
                'screenSize'            : {'value':null,'strategy':'assign'},
                'isViewable'            : {'value':false,'strategy':'assign'},
                'orientationProperties' : {'value':{allowOrientationChange: true,forceOrientation: ORIENTATIONS.NONE},'strategy':'override'}
            },
            _strategies = {
                assign      :  function equate(prop1,prop2){
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
                                target = {};
                                for(var n in properties){
                                    target[properties[n]] = contains(properties[n],val);
                                }
                                return target;
                            },
                state       :   function state(currentState,val){            
                            if (currentState == STATES.UNKNOWN && val != STATES.UNKNOWN) {
                                broadcastEvent(EVENTS.INFO, 'controller initialized');
                            }
                            if (currentState == STATES.LOADING && val != STATES.LOADING) {
                                mraid.signalReady();//sets state to default.
                                return model.getValue('state');//STATES.DEFAULT;
                            } else {
                                broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(val));
                                return val;
                            }
                        }
            },
            _getModel = function(name){
                if(_models.hasOwnProperty(name)){
                    return _models[name];    
                }
                return null;
            },
            _setModel = function(name,value){
                if(_models.hasOwnProperty(name)){
                    _models[name] = value;
                }
            },
            _getModelProperty = function(name,property){
                if(_models.hasOwnProperty(name) && _models[name].hasOwnProperty(property)){
                    return _models[name][property];
                }
                return null;
            },
            _setModelProperty = function(name,property,value){
                if(_models.hasOwnProperty(name) && _models[name].hasOwnProperty(property)){
                    _models[name][property] = value;
                }
            },
            _getValue = function(name){
                if(_models.hasOwnProperty(name)){
                    return _models[name].value;
                }
                return null;
            },
            _setValue = function(name,value){
                _setModelProperty(name,'value',value);
            },
            _getStrategy = function(name){
                return _strategies[name];
            },
            _getModels = function(){
                return _models;
            }
            return{
                setModel            : _setModel,
                getModel            : _getModel,
                setModelProperty    : _setModelProperty,
                getModelProperty    : _getModelProperty,
                getModels           : _getModels,
                getValue            : _getValue,
                setValue            : _setValue,
                getStrategy         : _getStrategy
            }
    })();

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
		
        state:function(val) {
            /*
            var _state = model.getValue('state');
            if(_state==STATES.LOADING && val!=STATES.LOADING){
                return;
            }else{
                broadcastEvent(EVENTS.STATECHANGE, _state);
            }
            */
            broadcastEvent(EVENTS.STATECHANGE, model.getValue('state'));
        },
        size:function(val) {
            var _size = model.getValue('size');
            broadcastEvent(EVENTS.SIZECHANGE, _size.width, _size.height);    
        },
        orientation:function(val) {
            broadcastEvent(EVENTS.ORIENTATIONCHANGE, model.getValue('orientation'));
        },
        screenSize:function(val) {
            _screenSize = model.getValue('screenSize');
            broadcastEvent(EVENTS.SCREENCHANGE, _screenSize.width, _screenSize.height);    
        },
		isViewable:function(val) {
            broadcastEvent(EVENTS.VIEWABLECHANGE, model.getValue('isViewable'));
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

    var updateModel = function(data){
        //we get the change object which has name of model propery and arguments.
        //we look up which model object we want, 
        //we then apply the appropriate strategy and assign it that model objects value; 
        //does this propagate outside the model.... e.g if i assign mraidversion.value = 
        //model.init({'state':state});

        for(var n in data){
            //console.info(n+ ' == '+data[n]);
            var modelName = n;
            //console.info('modelName');
            //console.info(modelName);
            var currentModel = model.getModel(n);
            
            //console.info('currentModel('+n+')');
            //console.info(currentModel);
            
            if(currentModel){
                //wrap args specified in a an array as we are using apply.
                var args = [data[n]];
                //add in specified arguments, aware that they will be the 2nd++ arguments, after value of the currentModel
                if(currentModel.arguments){
                    var pos = currentModel.argumentPosition;
                    args.splice(pos,0,currentModel.arguments);
                }
                //access to the value of the model is always the first argument
                args.unshift(currentModel.value);
                
                var strategy = model.getStrategy(model.getModelProperty(n,'strategy'));//modelStrategies[model.getModelProperty(n,'strategy')];
                currentModel.value = strategy.apply(this,args);
            }
            
        }
        //console.info(mraidversion);
        console.info('********** model updated ************');
        console.info(model.getModels());
    }
    
    // PRIVATE METHODS ////////////////////////////////////////////////////////////
    /*
        on  pushChange, registers and fires specified (specified in pushChage params) changeHandlers.
    */
    mraidview.addEventListener('change', function(properties) {
        updateModel(properties);
        updateChangeHandlers(properties);
    });

    var updateChangeHandlers = function(properties){
       console.info('**** updateChangeHandlers ****');
        for (var property in properties) {

            if(changeHandlers.hasOwnProperty(property)){
                
                var handler = changeHandlers[property];
                console.log('for property "' + property + '" typeof handler is: ' + typeof(handler));           
                //executes function(args);
                handler(properties[property]);    
            }
            
        } 
    }
    
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
        
        if (listeners[event]) {
            listeners[event].broadcast(args);
        }
    }
    
    // PUBLIC METHODS ////////////////////////////////////////////////////////////////////
    
    mraid.signalReady = function() {
	/* introduced in MRAIDv1 */
		broadcastEvent(EVENTS.INFO, 'START READY SIGNAL, setting state to ' + stringify(STATES.DEFAULT));
        model.setValue('state',STATES.DEFAULT);
		broadcastEvent(EVENTS.STATECHANGE, model.getValue('state'));
        
		broadcastEvent(EVENTS.INFO, 'ready event fired');
		broadcastEvent(EVENTS.READY, 'ready event fired');
        window.clearInterval(intervalID);
    };
	
	mraid.getVersion = function() {
	/* introduced in MRAIDv1 */
        return model.getValue('version');
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
        return model.getValue('state');
    };
    
    mraid.getPlacementType = function() {
	/* introduced in MRAIDv1 */
    return model.getValue('placement')
        //return model.getModel('placement').value;//placementType;
    };
	
	mraid.isViewable = function() {
	/* introduced in MRAIDv1 */
		return model.getProperty('isViewable').value;//isViewable;
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
        if (model.getModel('placement').value === PLACEMENTS.INLINE) {
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
        var props = clone(model.getValue('expandProperties'));

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
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (resize)', 'resize');
	    } else {
	    	//if (placementType === PLACEMENTS.INLINE) {
            if (model.getValue('placement') === PLACEMENTS.INLINE) {
				mraidview.resize();
	    	}
		}
    };
    
    mraid.getResizeProperties = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getResizeProperties)', 'getResizeProperties');
	    } else {
            return clone(model.getValue('resizeProperties'));
	    	//return clone(resizeProperties);
		}
		return (null);
    };
    
    mraid.setResizeProperties = function(properties) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (setResizeProperties)', 'setResizeProperties');
	    } else {
			if (valid(properties, resizePropertyValidators, 'setResizeProperties')) {
				mraidview.setResizeProperties(properties);
			}
		}
    };
    
    mraid.getCurrentPosition = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getCurrentPosition)', 'getCurrentPosition');
	    } else {

            return clone(model.getValue('currentPosition'));
	        //return clone(currentPosition);
		}
		return (null);
    };
	
	mraid.getSize = function() {
	/* introduced in MRAIDv1, deprecated in MRAIDv2 */
        //var pos = clone(currentPosition);
        var pos = clone(model.getValue('currentPosition'));
		return ({width:pos.width, height:pos.height});
    };
    
    mraid.getMaxSize = function(bOverride) {
	/* introduced in MRAIDv2, bOverride is an mraid-web-tester extension */
	    if (!bOverride && parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getMaxSize)', 'getMaxSize');
	    } else {
            return clone(model.getValue('maxSize'))
		}
		return (null);
    };
    
    mraid.getDefaultPosition = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getDefaultPosition)', 'getDefaultPosition');
	    } else {
            return clone(model.getValue('defaultPosition'));
		}
		return (null);
    };
    
    mraid.getScreenSize = function() {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getScreenSize)', 'getScreenSize');
	    } else {
            return clone(model.getValue('screenSize'));
		}
		return (null);
    };
    
    mraid.supports = function(feature) {
	/* introduced in MRAIDv2 */
		var bSupports = false,
            supports;
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (supports)', 'supports');
	    } else {
            supports = model.getValue('supports');
            bSupports = supports[feature];
			//bSupports = supports[feature];
	    }
		return (bSupports);
    };

	mraid.storePicture = function(url) {
	/* introduced in MRAIDv2 */
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (storePicture)', 'storePicture');
	    } else {
            var supports = model.getValue('supports');
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
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (createCalendarEvent)', 'createCalendarEvent');
	    } else {
            var supports = model.getValue('supports');
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
	    if (parseFloat(model.getValue('version'), 10) < 2) {
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (playVideo)', 'playVideo');
	    } else {
            var supports = model.getValue('supports');
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
        var supports = model.getValue('supports');
        if (!supports[FEATURES.ORIENTATION]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client. (getOrientation)', 'getOrientation');
        }
        return orientation;
    };
    
    mraid.setOrientationProperties = function (properties) {
    	if (parseFloat(model.getValue('version'), 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (setOrientationProperties)', 'setOrientationProperties');
	    } else {
	    	if (valid(properties, orientationPropertyValidators, 'setOrientationProperties')) {
				mraidview.setOrientationProperties(properties);
			}
		}
    };
    
    mraid.getOrientationProperties = function () {
    	if (parseFloat(model.getValue('version'), 10) < 2) { 
			broadcastEvent(EVENTS.ERROR, 'Method not supported by this version. (getOrientationProperties)', 'getOrientationProperties');
	    } else {

	        //return clone(orientationProperties);
            return clone(model.getValue('orientationProperties'));
		}
		return (null);
    };
})();