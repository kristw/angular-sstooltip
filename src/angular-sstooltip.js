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

        scope.$on('sstooltip:show', function(event, tooltipKey, data){
          if(tooltipKey==scope.tooltipKey){
            safeApply(scope, function(){
              scope.data = data.data;
            });
            tip.show(null, data.mouseEvent);
          }
        });

        scope.$on('sstooltip:move', function(event, tooltipKey, data){
          if(tooltipKey==scope.tooltipKey){
            tip.show(null, data.mouseEvent);
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

      function show(mouseEvent, data){
        $scope.$broadcast('sstooltip:show', tooltipKey, {
          mouseEvent: mouseEvent,
          data: data
        });
      }

      function move(mouseEvent, data){
        $scope.$broadcast('sstooltip:move', tooltipKey, {
          mouseEvent: mouseEvent,
          data: data
        });
      }

      function hide(){
        $scope.$broadcast('sstooltip:hide', tooltipKey);
      }

      function triggerOnScopeEvents(triggerShowEvent, triggerMoveEvent, triggerHideEvent, dataFn, mouseEventFn){
        var getData = functor(dataFn, function(event, data){return data.data;});
        var getMouseEvent = functor(mouseEventFn, function(event, data){return data.mouseEvent;});

        // register events that trigger tooltip to show
        if(triggerShowEvent){
          $scope.$on(triggerShowEvent, function(){
            var args = Array.prototype.slice.call(arguments, 0);
            show(getMouseEvent.apply(this, args), getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to move
        if(triggerMoveEvent){
          $scope.$on(triggerMoveEvent, function(){
            var args = Array.prototype.slice.call(arguments, 0);
            move(getMouseEvent.apply(this, args), getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to hide
        if(triggerHideEvent){
          $scope.$on(triggerHideEvent, function(){ hide(); });
        }
      }

      function triggerOnDomEvents(dom, triggerShowEvent, triggerMoveEvent, triggerHideEvent, dataFn){
        var getData = functor(dataFn, function(event){return event.data;});

        var $dom = isFunction(dom.on) ? dom : angular.element(dom);

        // register events that trigger tooltip to show
        if(triggerShowEvent){
          $dom.on(triggerShowEvent, function(mouseEvent){
            var args = Array.prototype.slice.call(arguments, 0);
            show(mouseEvent, getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to move
        if(triggerMoveEvent){
          $dom.on(triggerMoveEvent, function(mouseEvent){
            var args = Array.prototype.slice.call(arguments, 0);
            move(mouseEvent, getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to hide
        if(triggerHideEvent){
          $dom.on(triggerHideEvent, function(){ hide(); });
        }
      }

      function triggerOnD3Events(dispatcher, triggerShowEvent, triggerMoveEvent, triggerHideEvent, dataFn){
        var getData = functor(dataFn, function(d){return d;});

        // register events that trigger tooltip to show
        if(triggerShowEvent){
          dispatcher.on(triggerShowEvent, function(){
            var args = Array.prototype.slice.call(arguments, 0);
            show(d3.event, getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to move
        if(triggerMoveEvent){
          dispatcher.on(triggerMoveEvent, function(){
            move(d3.event, getData.apply(this, args));
          });
        }
        // register events that trigger tooltip to hide
        if(triggerHideEvent){
          dispatcher.on(triggerHideEvent, function(){ hide(); });
        }
      }

      return{
        triggerOnScopeEvents: triggerOnScopeEvents,
        triggerOnDomEvents: triggerOnDomEvents,
        triggerOnD3Events: triggerOnD3Events,
        show: show,
        move: move,
        hide: hide
      };
    };
  }]);

  return module;

  //---------------------------------------------------
  // END code for this module
  //---------------------------------------------------
}));




