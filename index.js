(function (angular) {
    var app = angular.module('ngImgMapDemo', ['ngImgMap']);

    app.controller('DemoCtrl', function ($scope) {
        $scope.img = {
            "pic_url": "images/demo-400x300.png",
            "maps": [
                {
                    "coords": [61, 137, 118, 186],
                    "ratio": 1,
                    "description": "I am batman"
                },
                {
                    "coords": [240, 47, 341, 135],
                    "ratio": 1,
                    "description": "I am superman"
                }
            ]
        };

        $scope.mapFns = {

            getCanSize: function (img) {
                return _getImgSize(img.pic_url);
            },

            getImgSize: function (img) {
                return _getImgSize(img.pic_url) || [950, 500];
            }
        };

        $scope.mapFnsLowerRatio = {
            getCanSize: function (img) {
                return [200, 150];
            },

            getImgSize: function (img) {
                return _getImgSize(img.pic_url) || [950, 500];
            }
        }

        function _getImgSize(url) {
            var reg = new RegExp('(\\d+)x(\\d+)\.');
            result = reg.exec(url);
            if (result && result.length > 1) {
                return result.slice(1);
            } else {
                return false;
            }
        }

        $scope.addArea = function (img) {
            if (!img || !img.maps || !angular.isArray(img.maps)) {
                img = angular.isObject(img) ? img : {};
                img.maps = [];
            }
            var calculation = img.getCalculation(), lastImg = img.maps.slice(-1)[0], lastImgLeft = lastImg ? lastImg.coords[0] : 0, lastImgTop = lastImg ? lastImg.coords[1] : 0,
                newImgCoords = [lastImgLeft + 30, lastImgTop + 30, lastImgLeft + 100, lastImgTop + 100];

            if (calculation) {
                img.maps.push({coords: calculation.checkCoords(newImgCoords)});
            } else {
                img.maps.push({coords: newImgCoords});
            }
        };

        $scope.catchArea = function (area) {
            area.isDraging = true;
        };

        $scope.releaseArea = function (area) {
            if (area.hasOwnProperty('isDraging')) {
                delete area.isDraging
            }
        };

        $scope.$watch('img', function (nVal, oVal) {
            $scope.imgJson = angular.toJson(nVal, true);
        }, true);

    });

})(angular);