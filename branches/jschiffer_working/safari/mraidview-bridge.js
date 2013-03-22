/*
 *  Copyright (c) 2012 The mraid-web-tester project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

(function () {
    var mraidview = window.mraidview = {},
		listeners = {};
		broadcastEvent = function () {
			var i,
				key,
				event,
				handler,
				args = new Array(arguments.length);

			for (i = 0; i < arguments.length; i++) {
				args[i] = arguments[i];
			}
            
            //console.info(listeners);

            //on event change, this calls the change handlers found in mraid-main.js

			event = args.shift();

            if(event!='info'){
                console.info('mraidview-bridge.js .broadcast, listeners fire for event: '+event);
            }
            console.warn(event);
            console.dir(listeners[event])
			for (key in listeners[event]) {
				handler = listeners[event][key];
				handler.func.apply(handler.func.scope, args);
			}
		};

	mraidview.broadcastEvent = broadcastEvent;
	mraidview.scriptFound = false;
    
    //when we initAdBridge in mraidView, we go through the events and register them here.
    mraidview.addEventListener = function (event, listener, scope) {
        var key = String(listener) + String(scope),
			map = listeners[event];
    //console.info('bridge adding event: '+event)
        if (!map) {
            map = {};
            listeners[event] = map;
        }
        map[key] = {scope : (scope ? scope : {}), func : listener};
    };

    mraidview.removeEventListener = function (event, listener, scope) {
        var key = String(listener) + String(scope),
			map = listeners[event];

        if (map) {
            map[key] = null;
            delete map[key];
        }
    };
    //this triggers change event listener in mraid-main.
    //which in turn calls <i>all</i> of the change listeners
    //no.
    mraidview.pushChange = function (obj) {
        console.warn('pushChange obj');
    	console.warn(obj);
        broadcastEvent('change', obj);
    };

    mraidview.pushError = function (message, action) {
        broadcastEvent('error', message, action);
    };

	mraidview.pushInfo = function (message) {
		broadcastEvent('info', message);
	};

    mraidview.activate = function (service) {
        broadcastEvent('activate', service);
    };

    mraidview.deactivate = function (service) {
        broadcastEvent('deactivate', service);
    };

    mraidview.expand = function (URL) {
        broadcastEvent('expand', URL);
    };

    mraidview.close = function () {
        broadcastEvent('close');
    };

    mraidview.open = function (URL) {
        broadcastEvent('open', URL);
    };

    mraidview.resize = function () {
        broadcastEvent('resize');
    };

    mraidview.setExpandProperties = function (properties) {
        broadcastEvent('setExpandProperties', properties);
    };

    mraidview.setResizeProperties = function (properties) {
        broadcastEvent('setResizeProperties', properties);
    };

	mraidview.storePicture = function (url) {
		broadcastEvent('storePicture', url);
	};

	mraidview.playVideo = function (url) {
		broadcastEvent('playVideo', url);
	};

	mraidview.createCalendarEvent = function (params) {
		broadcastEvent('createCalendarEvent', params);
	};
	
	mraidview.useCustomClose = function (useCustomCloseIndicator) {
		broadcastEvent('useCustomClose', useCustomCloseIndicator);
	};
})();