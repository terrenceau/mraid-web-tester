/*
 *  Copyright (c) 2012 The mraid-web-tester project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

(function() {
    var mraidview = window.mraidview = {};
	mraidview.scriptFound = false;
    
    var listeners = {};
    
    var broadcastEvent = function() {
        var args = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) args[i] = arguments[i];
        var event = args.shift();
        for (var key in listeners[event]) {
            var handler = listeners[event][key];
            handler.func.apply(handler.func.scope, args);
        }
    }
    
	mraidview.broadcastEvent = broadcastEvent;
	
    mraidview.addEventListener = function(event, listener, scope) {
        var key = String(listener) + String(scope);
        var map = listeners[event]
        if (!map) {
            map = {};
            listeners[event] = map;
        }
        map[key] = {scope:(scope?scope:{}),func:listener};
    };
    
    mraidview.removeEventListener = function(event, listener, scope) {
        var key = String(listener) + String(scope);
        var map = listeners[event];
        if (map) {
            map[key] = null;
            delete map[key];
        }
    };
    
    mraidview.pushChange = function(obj) {
        broadcastEvent('change', obj);
    };
    mraidview.pushError = function(message, action) {
        broadcastEvent('error', message, action);
    };
	mraidview.pushInfo = function(message) {
		broadcastEvent('info', message);
	};
    mraidview.activate = function(service) {
        broadcastEvent('activate', service);
    };
    mraidview.deactivate = function(service) {
        broadcastEvent('deactivate', service);
    };
    mraidview.expand = function(dimensions, URL) {
        broadcastEvent('expand', dimensions, URL);
    };
    mraidview.close = function() {
        broadcastEvent('close');
    };
    mraidview.hide = function() {
        broadcastEvent('hide');
    };
    mraidview.show = function() {
        broadcastEvent('show');
    };
    mraidview.open = function(URL, controls) {
        broadcastEvent('open', URL, controls);
    };
    mraidview.resize = function(width, height) {
        broadcastEvent('resize', width, height);
    };
    mraidview.setExpandProperties = function(properties) {
        broadcastEvent('setExpandProperties', properties);
    };
})();