// Define module using Universal Module Definition pattern
// https://github.com/umdjs/umd/blob/master/amdWeb.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // Support AMD. Register as an anonymous module.
    // EDIT: List all dependencies in AMD style
    define(['jquery', 'angular', 'sstooltip'], factory);
  } else {
    // No AMD. Set module as a global variable
    // EDIT: Pass dependencies to factory function
    factory(root.$, root.angular, root.sstooltip);
  }
}(this,
//EDIT: The dependencies are passed to this function
function ($, angular, sstooltip) {
  //---------------------------------------------------
  // BEGIN code for this module
  //---------------------------------------------------

  function safeApply(scope, fn){
    if(scope.$$phase || scope.$root.$$phase) fn();
    else scope.$apply(fn);
  }

  var isFunction = function(functionToCheck){
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  };

  var module = angular.module('sstooltip', []);

  module.directive('sstooltip', [function (){
    return {
      restrict: 'AE',
      replace: true,
      template: '<div class="sstooltip-container"><div class="sstooltip"><div ng-if="tooltipText">{{tooltipText}}</div><div ng-if="tooltipSrc"><ng-include src="tooltipSrc"></ng-include></div></div></div>',
      scope:{
        tooltipKey: '@',
        tooltipSrc: '=',
        tooltipText: '='
      },
      link: function(scope, element, attrs) {

        /* jshint ignore:start */
        var tooltipElement = element[0].querySelector('.sstooltip');
        var tip = new sstooltip(tooltipElement);
        /* jshint ignore:end */

        if(attrs.tooltipTheme){
          angular.element(tooltipElement).addClass('sstooltip-'+attrs.tooltipTheme);
        }

        // Hide tooltip on touch (for touch devices)
        angular.element(tooltipElement).on('touchstart', function(e){
          tip.hide();
          e.preventDefault();
          e.stopPropagation();
        });

        scope.$on('sstooltip:show', function(event, tooltipKey, mouseEvent, data){
          if(tooltipKey==scope.tooltipKey){
            safeApply(scope, function(){
              scope.data = data;
            });
            tip.show(null, mouseEvent);
          }
        });

        scope.$on('sstooltip:move', function(event, tooltipKey, mouseEvent){
          if(tooltipKey==scope.tooltipKey){
            tip.show(null, mouseEvent);
          }
        });

        scope.$on('sstooltip:hide', function(){
          tip.hide();
        });
      }
    };
  }]);

  // Special version of functor that accepts a default value
  // which will be return when the input value is null
  function functor(v, defaultValue){
    if(isFunction(v)){
      return v;
    }
    return isFunction(v) ? v : (
      v ? function() { return v; } : defaultValue
    );
  }

  module.factory('sstooltipManager', [function(){
    return function($scope, tooltipKey){
      var manager = {};

      function show(mouseEvent, data){
        $scope.$broadcast('sstooltip:show', tooltipKey, mouseEvent, data);
        return manager;
      }

      function move(mouseEvent){
        $scope.$broadcast('sstooltip:move', tooltipKey, mouseEvent);
        return manager;
      }

      function hide(){
        $scope.$broadcast('sstooltip:hide', tooltipKey);
        return manager;
      }

      function triggerOn(on, showEvent, moveEvent, hideEvent, getData, getMouseEvent){
        // register events that trigger tooltip to show
        if(showEvent){
          on(showEvent, function(){
            var args = Array.prototype.slice.call(arguments, 0);
            show(getMouseEvent.apply(this, args), getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to move
        if(moveEvent){
          on(moveEvent, function(){
            var args = Array.prototype.slice.call(arguments, 0);
            move(getMouseEvent.apply(this, args));
          });
        }
        // register events that trigger tooltip to hide
        if(hideEvent){
          on(hideEvent, function(){ hide(); });
        }
        return manager;
      }

      function watchScope(showEvent, moveEvent, hideEvent, dataFn, mouseEventFn){
        return triggerOn(
          $scope.$on, showEvent, moveEvent, hideEvent,
          functor(dataFn, function(event, data){return data.data;}),
          functor(mouseEventFn, function(event, data){return data.mouseEvent;})
        );
      }

      function watchDom(dom, showEvent, moveEvent, hideEvent, dataFn, mouseEventFn){
        var $dom = isFunction(dom.on) ? dom : angular.element(dom);
        return triggerOn(
          $dom.on, showEvent, moveEvent, hideEvent,
          functor(dataFn, function(event){return event.data;}),
          functor(mouseEventFn, function(event){return event;})
        );
      }

      function watchD3(dispatcher, showEvent, moveEvent, hideEvent, dataFn, mouseEventFn){
        return triggerOn(
          dispatcher.on, showEvent, moveEvent, hideEvent,
          functor(dataFn, function(d, i){return d;}),
          functor(mouseEventFn, function(){return d3.event;})
        );
      }

      manager.show = show;
      manager.move = move;
      manager.hide = hide;
      manager.watchScope = watchScope;
      manager.watchDom = watchDom;
      manager.watchD3 = watchD3;

      return manager;
    };
  }]);

  return module;

  //---------------------------------------------------
  // END code for this module
  //---------------------------------------------------
}));




