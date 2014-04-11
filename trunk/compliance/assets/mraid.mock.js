///////////////////////////////
// this object-class provides a mock-object for testing mraid resize functionality
// for more complete mraid testing, use http://webtester.mraid.org/
//
// this object has a dependency on the external $log library
//
mraid = {

// use a namespace-global to store the resizeProperties 
    resizeProps : {
        'initialized': false,
        'valid': false
    },

/**
* provide a mock implementation of resize()
* @namespace mraid
* @method resize
* @throws {Exception} if resizeProperties does not have a value for width
*/
    resize : function() {
        $log.it('resizing', DEBUG);
        if (!mraid.resizeProps.initialized) {
            throw ({'message' : 'could not resize because props not init'});
        }
        if (!mraid.resizeProps.valid) {
            throw ({'message' : 'could not resize because props not valid'});
        }
    },

/**
* provide a mock implementation of getResizeProperties()
* @namespace mraid
* @method getResizeProperties
* @returns {Object} the namespace resizeProperties
*/
    getResizeProperties : function () {
        $log.it('getting properties', DEBUG);
        return mraid.resizeProps;
    },

/**
* provide a mock implementation of setResizeProperties()
* @namespace mraid
* @method setResizeProperties
* @param {Object} props resizeProperties object
* @throws {Exception} if resizeProperties have invalid values or are out of range
*/
    setResizeProperties : function (props) {
        $log.it('setting properties', DEBUG);
        var resizeProps = mraid.resizeProps,
            positionAllowed = true;

        //assume failure
        resizeProps.valid = false;

        //check invalid types
        if (isNaN(parseInt(props.width, 10))) {
            throw ({'message' : 'resize.width is not a number'});
        }
        if (isNaN(parseInt(props.height, 10))) {
            throw ({'message' : 'resize.height is not a number'});
        }
        if (isNaN(parseInt(props.offsetX, 10))) {
            throw ({'message' : 'resize.offsetX is not a number'});
        }
        if (isNaN(parseInt(props.offsetY, 10))) {
            throw ({'message' : 'resize.offsetY is not a number'});
        }

        //check invalid values
        switch (props.customClosePosition) {
        case 'top-left':
        case 'top-right':
        case 'center':
        case 'bottom-left':
        case 'bottom-right':
        case 'top-center':
        case 'bottom-center':
            break;
        default:
            throw ({'message' : 'resize.customClosePosition is not a valid value'});
        }
        if (typeof props.allowOffscreen !== 'boolean') {
            throw ({'message' : 'resize.allowOffscreen is not a boolean value'});
        }

        //check too small range
        if (props.width < 50) {
            throw ({'message' : 'resize.width is less than 50'});
        }
        if (props.height < 50) {
            throw ({'message' : 'resize.height is less than 50'});
        }

        //check too large range
        if (props.width > window.innerWidth && !props.allowOffscreen) {
            throw ({'message' : 'resize.width is too large to not allow off screen'});
        }
        if (props.height > window.innerHeight && !props.allowOffscreen) {
            throw ({'message' : 'resize.height is too large to not allow off screen'});
        }

        //check close position offscreen
        switch (props.customClosePosition) {
        case 'top-left':
             //assume default location is at 0,0
            if (props.offsetX < 0 || props.offsetY < 0) {
                positionAllowed = false;
            }
            break;
        case 'top-right':
             //assume default location is at 0,0 and width requested is full screen
            if (props.width + props.offsetX > window.innerWidth || props.offsetY < 0) {
                positionAllowed = false;
            }
            break;
        case 'center':
            //@TODO
            break;
        case 'bottom-left':
            //assume default location is at 0,0 and height requested is full screen
            if (props.offsetX < 0 || props.height + props.offsetY > window.innerHeight) { 
                positionAllowed = false;
            }
            break;
        case 'bottom-right':
            //assume default location is at 0,0 and height requested is full screen
            if (props.width + props.offsetX > window.innerWidth || props.height + props.offsetY > window.innerHeight) {
                positionAllowed = false;
            }
            break;
        case 'top-center':
            //assume default location is at 0,0; @TODO width check
            if (props.offsetY < 0) {
                positionAllowed = false;
            }
            break;
        case 'bottom-center':
             //assume default location is at 0,0 and height requested is full screen; @TODO width check
            if (props.height + props.offsetY > window.innerHeight) {
                positionAllowed = false;
            }
            break;
        default : 
            positionAllowed = true;
        }
        if (props.allowOffscreen && !positionAllowed) {
            throw ({'message' : 'resize.customClosePosition can not be offscreen'});
        }

        //set values
        resizeProps.initialized = true;
        resizeProps.valid = true;
        resizeProps.width = props.width;
        resizeProps.height = props.height;
        resizeProps.offsetX = props.offsetX;
        resizeProps.offsetY = props.offsetY;
        resizeProps.customClosePosition = props.customClosePosition;
        resizeProps.allowOffscreen = props.allowOffscreen;
    },

/**
* provide stub for addEventListener() -- all values are ignored
* @namespace mraid
* @method addEventListener
* @param {String} evt name of event to listen for
* @param {Function} method to call when event triggered
*/
    addEventListener : function(evt, listener) {
        $log.it('adding listener for ' + evt, DEBUG);
    },

/**
* provide a mock implementation of getVersion()
* @namespace mraid
* @method getVersion
* @returns {String} always the string '2.0'
*/
    getVersion : function() {
        $log.it('getting version', DEBUG);
        return ('2.0');
    },

/**
* provide a mock implementation of getMaxSize()
* @namespace mraid
* @method getMaxSize
* @returns {Object} JavaScript object with .width and .height properties matching the current browser window max size
*/
    getMaxSize : function() {
        $log.it('getting max size', DEBUG);
        var maxSize = {
            'width' : window.innerWidth,
            'height' : window.innerHeight
        };
        return maxSize;
    },

/**
* provide stub for getState() -- always returns 'default'
* @namespace mraid
* @method getState
* @returns {String} state is always 'default'
*/
    getState : function() {
        return 'default';
    }
};