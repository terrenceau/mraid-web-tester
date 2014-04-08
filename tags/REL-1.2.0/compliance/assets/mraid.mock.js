///////////////////////////////
// this object-class provides a mock-object for testing mraid resize functionality
// for more complete mraid testing, use http://webtester.mraid.org/
//
// this object has a dependency on the external $log library
//
mraid = {

// use a namespace-global to store the resizeProperties 
    resizeProps : {},

/**
* provide a mock implementation of resize()
* @namespace mraid
* @method resize
* @throws {Exception} if resizeProperties does not have a value for width
*/
    resize : function() {
        $log.it('resizing', DEBUG);
        if (!mraid.resizeProps.width) {
            throw ({'message' : 'could not resize because props not init'});
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
        var resizeProps = mraid.resizeProps;

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
        if (props.width > window.outerWidth && !props.allowOffscreen) {
            throw ({'message' : 'resize.width is too large to not allow off screen'});
        }
        if (props.height > window.outerHeight && !props.allowOffscreen) {
            throw ({'message' : 'resize.height is too large to not allow off screen'});
        }

        //set values
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
            'width' : window.outerWidth,
            'height' : window.outerHeight
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