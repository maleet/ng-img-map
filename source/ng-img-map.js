(function (angular) {
    'use strict';

    angular.module('ngImgMap', ['ngTouch'])

           .factory('ngImgMapCurArea', ['$document', function ($document) {

               var curArea = {
                   area: undefined, mouse: [0, 0], action: undefined
               };

               function _updateCoords(coords) {
                   var me = this;
                   if (coords[0] > coords[2]) {
                       _exchange(coords, 0, 2)
                   }
                   if (coords[1] > coords[3]) {
                       _exchange(coords, 1, 3)
                   }
               }

               function _exchange(item, a, b) {
                   var tmp = item[a];
                   item[a] = item[b];
                   item[b] = tmp;
               }

               $document.find('body').on('mouseup', function releaseArea(e) {

                   if (angular.isDefined(curArea.area)) {
                       _updateCoords(curArea.area.coords);
                       delete curArea.area.isDraging;
                       curArea.area = undefined;
                   }
               });

               return curArea;

           }])

           .factory('ngImgMapCalculation', ['$timeout', function ($timeout) {

               var calculation = function (img, can) {

                   this.dx = 0;
                   this.dy = 0;

                   this.imgw = img[0];
                   this.imgh = img[1];
                   this.img = [this.imgw, this.imgh];

                   this.canw = Math.min(img[0], can[0]);
                   this.canh = Math.min(img[1], can[1]);

                   this.ratioh = (img[1] && this.canh) ? (this.canh / img[1]) : 1;
                   this.ratiow = (img[0] && this.canw) ? (this.canw / img[0]) : 1;
                   this.ratio = Math.min(this.ratioh, this.ratiow);
               };

               calculation.prototype.init = function (action, curArea, pos) {
                   var me = this;

                   me._getOffset(curArea, pos);

                   if ((me.dx == 0) && (me.dy == 0)) {
                       return false;
                   }

                   me.curA = curArea;
                   me.coords = me.curA.area.coords;

                   me.curA.mouse = pos;

                   switch (action[0]) {
                       case 'move'  :
                           me['_move']();
                           break;
                       case 'resize':
                           me['_resize'](action[1]);
                           break;
                   }

               };

               calculation.prototype.getDragAction = function (name) {
                   var handler = name.split(" "),

                       action = 'move',

                       offset = [0, 0, 0, 0];

                   angular.forEach(handler, function (item) {
                       switch (item) {

                           case 'bar-remove': {
                               action = undefined;
                               break;
                           }

                           case 'dragline':
                           case 'dragdot' : {
                               action = 'resize';
                               break;
                           }

                           default: {
                               var offsetKey = new RegExp('ord\-([nswe]+)').exec(item) || [];
                               if (offsetKey.length) {
                                   var offsetArr = offsetKey[1].split('');
                                   angular.forEach(offsetArr, function (key) {
                                       switch (key) {
                                           case 'w':
                                               offset[0] = 1;
                                               break;
                                           case 'n':
                                               offset[1] = 1;
                                               break;
                                           case 'e':
                                               offset[2] = 1;
                                               break;
                                           case 's':
                                               offset[3] = 1;
                                               break;
                                       }
                                   });
                               }
                           }
                       }
                   });

                   return [action, offset];
               };

               calculation.prototype.checkCoords = function (c) {

                   c[0] = +c[0] || 0;
                   c[1] = +c[1] || 0;
                   c[2] = +c[2] || 0;
                   c[3] = +c[3] || 0;
                   var me = this,

                       dx = 0, dy = 0,

                       x1 = c[0], y1 = c[1], x2 = c[2], y2 = c[3];

                   if (x1 < 0) {
                       dx = -x1;
                       x1 = x2 = 1;
                   }
                   if (x2 > me.imgw) {
                       dx = me.imgw - x2;
                       x1 = x2 = 1;
                   }

                   if (y1 < 0) {
                       dy = -y1;
                       y1 = y2 = 1;
                   }
                   if (y2 > me.imgh) {
                       dy = me.imgh - y2;
                       y1 = y2 = 1;
                   }

                   if (x1 || y1) {
                       c[0] += x1 * dx;
                       c[1] += y1 * dy;
                       c[2] += x2 * dx;
                       c[3] += y2 * dy;
                   }

                   if (Math.abs(c[0] - c[2]) > me.imgw || Math.abs(c[1] - c[3]) > me.imgh) {

                       for (var i = 0, len = c.length; i < len; i++) {
                           c[i] = _limit(c[i], 0, me.img[i % 2]);
                       }
                   }
                   return c;
               };

               calculation.prototype._getOffset = function (curArea, pos) {
                   var me = this;
                   me.dx = parseInt((pos[0] - curArea.mouse[0]) / me.ratio), me.dy = parseInt((pos[1] - curArea.mouse[1]) / me.ratio);
               };

               calculation.prototype._move = function () {
                   var me = this;
                   me._checkEdge(me.coords, [me.coords[0] + me.dx, me.coords[1] + me.dy, me.coords[2] + me.dx, me.coords[3] + me.dy], [1, 1, 1, 1])
               };

               calculation.prototype._resize = function (offset) {
                   var me = this;
                   me._checkEdge(me.coords, [me.coords[0] + me.dx * offset[0], me.coords[1] + me.dy * offset[1], me.coords[2] + me.dx * offset[2], me.coords[3] + me.dy * offset[3]], offset);
               };

               calculation.prototype._checkEdge = function (coords_o, coords_n, offset) {
                   var me = this;

                   for (var i = 0, len = coords_n.length; i < len; i++) {
                       if (coords_n[i] > me.img[i % 2] || coords_n[i] < 0) {
                           coords_n[i] = coords_o[i];

                           var opposite = (i + 2) % 4;
                           if (offset[opposite]) {
                               coords_n[opposite] = coords_o[opposite];
                           }
                       }
                   }
                   me.curA.area.coords = coords_n;
               };

               function _limit(num, min, max) {
                   if (num > max) {
                       return max
                   }
                   if (num < min) {
                       return min
                   }
                   return num;
               }

               return calculation;

           }])

           .controller('ngImgMapCtrl', ['$scope', 'ngImgMapCalculation', 'ngImgMapCurArea', function ($scope, ngImgMapCalculation, ngImgMapCurArea) {

               var curArea = ngImgMapCurArea, localArea = null, fn, m, imgSize, canSize, calculation, ratio;

               function init() {
                   fn = $scope.ngImgMapFns;
                   m = $scope.m = $scope.ngModel;

                   if (angular.isUndefined(m)) {
                       return console.warn("ngImgMap need correct ngModel, please check data & format!");
                   }

                   if (fn && angular.isFunction(fn.getImgSize)) {
                       imgSize = fn.getImgSize(m) || [1000, 100];
                   } else {
                       imgSize = [1000, 100];
                       console.warn("ngImgMap need fn to get ImgSize, now use [1000, 100] !");
                   }

                   if (fn && angular.isFunction(fn.getCanSize)) {
                       canSize = fn.getCanSize(m) || [1000, 100];
                   } else {
                       canSize = [1000, 100];
                       console.warn("ngImgMap need fn to get CanSize, now use [1000, 100] !");
                   }

                   calculation = new ngImgMapCalculation(imgSize, canSize);
                   ratio = calculation.ratio;

                   m.getCalculation = function () {
                       return calculation;
                   };

                   if (angular.isDefined(m)) {
                       angular.forEach(m.maps, function (area) {
                           area.ratio = ratio;
                           calculation.checkCoords(area.coords);
                       })
                   }

                   $scope.wrapperStyle = (function () {
                       var can = calculation.img;
                       return {
                           'width': can[0] * ratio + 'px', 'height': can[1] * ratio + 'px', 'background-image': 'url(' + m.pic_url + ')'
                       };
                   })();
               }

               init();

               $scope.$watch('m.pic_url', function () {
                   if (calculation) {
                       init();
                   }
               });

               $scope.catchArea = function (e, area) {

                   e.preventDefault();
                   e.stopPropagation();
                   if (angular.isDefined(area) && area.coords) {
                       localArea = area;
                       curArea.area = area;

                       var event = getEventWithPositions(e);

                       curArea.mouse = [event.pageX, event.pageY];
                       curArea.action = calculation.getDragAction(e.target['className']);
                       if (['move', 'resize'].indexOf(curArea.action[0]) > -1) {
                           curArea.area.isDraging = true;
                       }
                   }
               };

               $scope.trackMove = function (e) {
                   e.stopPropagation();
                   if (localArea != curArea.area) {
                       return;
                   }
                   var action = curArea.action;
                   if (angular.isDefined(curArea.area) && angular.isDefined(action[0]) && curArea.area.coords) {
                       // jquery wrapper
                       var event = getEventWithPositions(e);
                       calculation.init(action, curArea, [event.pageX, event.pageY]);
                   }
               };

               $scope.removeArea = function (map, index) {
                   if (angular.isDefined(map[index])) {
                       map.splice(index, 1);
                   }
               };

               $scope.getAreaStyle = function (area) {
                   var coords = area.coords || [10, 10, 50, 50];
                   return {
                       width: parseInt(Math.abs(coords[0] - coords[2]) * ratio) + 'px',
                       height: parseInt(Math.abs(coords[1] - coords[3]) * ratio) + 'px',
                       left: parseInt(Math.min(coords[0], coords[2]) * ratio) + 'px',
                       top: parseInt(Math.min(coords[1], coords[3]) * ratio) + 'px'
                   };
               };

               $scope.getCurSize = function (c) {
                   var w = Math.abs(c[2] - c[0]), h = Math.abs(c[3] - c[1]);
                   return [w, h].join(' * ');
               }

               function getEventWithPositions(e) {
                   // jquery wrapper
                   var event = e.originalEvent || e;

                   if (event.type == "touchstart" || event.type == "touchmove") {
                       event = event.touches[0];
                   }
                   return event;
               }
           }])

           .directive('ngImgMap', ['$timeout', function ($timeout) {
               return {
                   restrict: 'EA',
                   scope: {
                       ngImgMapFns: "=ngImgMapFns",
                       ngModel: "=ngModel",
                       readOnly: "="
                   },
                   templateUrl: 'ngImgMap.html',
                   controller: 'ngImgMapCtrl'
               };
           }])

           .run(['$templateCache', function ($templateCache) {
               var template = '<div class="img-map-wrapper" ng-class="{readonly: readOnly}" ng-mousemove="trackMove($event)" ng-style="wrapperStyle">' +
                   '    <div ng-repeat="area in m.maps" class="map-area"  ng-mousedown="catchArea($event, area)" ng-touchmove="trackMove($event)" ng-touchstart="catchArea($event, area)"' +
                   ' ng-class="{draging: area.isDraging}"' +
                   ' ng-style="getAreaStyle(area)">' +
                   '        <div class="dragbar">' + '            <div class="bar-title">{{$index+1}}</div>' +
                   '            <div class="bar-remove" ng-click="removeArea(m.maps, $index)">&times;</div>' + '            <div class="bar-size">{{getCurSize(area.coords)}}</div>' +
                   '            <div class="bar-coords">{{area.coords}}</div>' + '        </div>' + '        <div class="ord-n dragline"></div>' + '        <div class="ord-e dragline"></div>' +
                   '        <div class="ord-s dragline"></div>' + '        <div class="ord-w dragline"></div>' + '        <div class="ord-n dragdot"></div>' +
                   '        <div class="ord-e dragdot"></div>' + '        <div class="ord-s dragdot"></div>' + '        <div class="ord-w dragdot"></div>' +
                   '        <div class="ord-nw dragdot"></div>' + '        <div class="ord-ne dragdot"></div>' + '        <div class="ord-sw dragdot"></div>' +
                   '        <div class="ord-se dragdot"></div>' + '    </div>' + '</div>';
               $templateCache.put('ngImgMap.html', template);
           }]);

})(angular);
