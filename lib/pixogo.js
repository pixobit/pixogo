/* 
 * Copyright (C) 2018 Pixobit Solutions (https://pixobit.eu)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Pixogo = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function Pixogo(contentId, routes, options) {
    this._routes = (routes === undefined ? {} : routes);
    this._paused = false;
    this._cache = {};
    this._destroyed = false;
    this._lastRouteResolved = null;
    this._notFoundHandler = null;
    this._defaultHandler = null;
    this._genericHooks = null;
    this._historyAPIUpdateMethod = 'pushState';
    this._contentEl = document.getElementById(contentId);
    
    //Extend defaults
    this.settings = this._extend({
        googleAnalyticsID: null
    }, options);
    
    //Execute js on serverload
    var routeObj = this._getCurrentRoute(location.pathname);
    if(routeObj !== undefined) { //Yayy, we've found a route
        routeObj.route.controller(routeObj.params);
    }
    
    this._contentEl.addEventListener('transitionend', function(){
        if(this.classList.contains('page-leave-active')) { 
            this.classList.remove('page-leave-active');
            _this.navigate(window.location.pathname);
            window.scrollTo(0, 0); //Scroll to top on page change
            this.classList.add('page-enter-active');
        } else {
            this.classList.remove('page-enter-active');
        }
    });
    
    var _this = this;

    window.addEventListener('popstate', function (e) {
        _this._setLinkAsActive(this.location.pathname);
        _this.navigate(this.location.pathname);
    });
    
    this._init();
}

Pixogo.prototype = {
    _init: function() {
        var _this = this;
        if(this.settings.googleAnalyticsID !== null) {
            var gaScript = document.createElement('script');
            gaScript.onload = function () {
                window.dataLayer = window.dataLayer || [];
                function gtag() {
                    dataLayer.push(arguments);
                }
                gtag('js', new Date());
                gtag('config', _this.settings.googleAnalyticsID);
            };
            gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + this.settings.googleAnalyticsID;
            document.head.appendChild(gaScript); //or something of the likes
        }
        
        //Convert page urls to pixogo navigation
        this._convertUrls();
    },
    _findLinks: function() {
        return [].slice.call(document.querySelectorAll('a:not([target="_blank"])'));
    },
    navigate: function(path) {
        var routeObj = this._getCurrentRoute(path);

        // Do we have both a view and a route?
        if (this._contentEl) {
            if(!this._cache[path]) {
                this._cache[path] = this._getPage(path);
            }
            this._contentEl.innerHTML = this._cache[path];
            this._onLoad(path);
            //pages[route.templateId];
            if(routeObj && routeObj.route && routeObj.route.controller) {
                routeObj.route.controller(routeObj.params); //Execute onloaded function
            }
            this._convertUrls(this._contentEl.querySelectorAll('a:not([target="_blank"])'));
            return true; //Prevent default page reload
        }
        return false;
    },
    _onLoad: function(path) {
        if(this.settings.googleAnalyticsID !== null) {
            ga('create', this.settings.googleAnalyticsID, 'auto');
            ga('set', 'page', path);
            ga('send', 'pageview');
        }
    },
    _getPage: function(path) {
        const Http = new XMLHttpRequest();
        Http.open("POST", path, false);
        Http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        Http.send('contentOnly=1');
        if (Http.status === 200) {
            return Http.responseText;
        }

        Http.onreadystatechange = function(e) {
            console.log(Http.responseText);
        };
    },
    _getCurrentRoute: function(path) {
        var params = [];
        if(this._routes[path] !== undefined) {
            return {route: this._routes[path], params: []};
        } else {
            for(var routeStr in this._routes) {
                var baseUrl = routeStr.replace(/:[a-z]+\/?/, '');
                if(routeStr.includes(':')) {
                    if(path.indexOf(routeStr.replace(/(:[a-z]+\/?)+/g, '')) === 0) { //Route found
                        var paramsStr = path.replace(routeStr.replace(/(:[a-z]+\/?)+/g, ''), '').replace(/\/$/g, '');
                        if(paramsStr !== '') { params = paramsStr.split('/'); }
                        return {route: this._routes[routeStr], params: params};
                    }
                }
            }
        }
    },
    _setLinkAsActive: function(location){
        //Handle active links
        document.querySelectorAll('a.link-active').forEach(function(a){
            a.classList.remove('link-active');
        });
        document.querySelectorAll('a[href="' + location + '"]').forEach(function(a){
            a.classList.add('link-active');
        });
    },
    _convertUrls: function(links) {
        var _this = this;
        (links == undefined ? this._findLinks() : links).forEach(function (link) {
        if (!link.hasListenerAttached) {
            link.addEventListener('click', function (e) {
                var location = this.getAttribute('href');
                //Handle page transition
                _this._contentEl.classList.add('page-leave-active');
                history.pushState('', this.title, location);
                _this._setLinkAsActive(location);
                e.preventDefault();
                return false;
            });
            link.hasListenerAttached = true;
        }
      });
    },
    _extend: function(defaults, options) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }
}

return Pixogo;
})));