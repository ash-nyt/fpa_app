// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var fpaApp = angular.module('fpa', ['ionic']);

fpaApp.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

var RouteInfo = function(id, name) {
    this.id = id;
    this.name = name;
};

fpaApp.factory('FpaIconService', [function(){
    var baseUrl = "https://img.pokemondb.net/sprites/black-white/anim/normal/PLACEHOLDER.gif"
    var irritated = ["mankey", "spearow", "cyndaquil", "voltorb"];
    var angry = ["fearow", "primeape", "electabuzz"];
    var furious = ["charizard", "gyarados", "nidoking", "ho-oh"];
    this.getIconByFpaLevel = function(level) {
        var c = "";
        if (level == 0) {
            c = "";
        } else if (level < 3) {
            c = irritated[faker.random.number(irritated.length - 1)];
        } else if (level < 6) {
            c = angry[faker.random.number(angry.length - 1)];
        } else {
            c = furious[faker.random.number(furious.length - 1)];
        }
        return (c) ? baseUrl.replace("PLACEHOLDER", c) : "http://pldh.net/media/items/ball/pokeball.png";
    };
    return this;
}]);

fpaApp.factory('MapApi', ['$ionicLoading', '$ionicTabsDelegate', '$timeout',
                  function($ionicLoading, $ionicTabsDelegate, $timeout) {
  this.map = null;
  this.markers = {};
  this.lastInfoPane = null;
  this.centerLatLng = new google.maps.LatLng(40.7, -73.9);
  this.directionsService = new google.maps.DirectionsService();
  this.directionsDisplay = new google.maps.DirectionsRenderer();

  this.initMap = function() {
       if (!this.map) {
           var myLatlng = this.centerLatLng;
           var mapOptions = {
               center: myLatlng,
               zoom: 16,
               mapTypeId: google.maps.MapTypeId.ROADMAP,
               styles: [
                   {
                       featureType: 'all',
                       stylers: [
                           { saturation: -100 }
                       ]
                   },{
                       featureType: 'road.arterial',
                       elementType: 'geometry',
                       stylers: [
                           { hue: '#000' },
                           { saturation: 50 }
                       ]
                   },{
                       featureType: 'poi.business',
                       elementType: 'labels',
                       stylers: [
                           { visibility: 'off' }
                       ]
                   }
               ]
           };
           $timeout(function () {
               this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
               this.directionsDisplay.setMap(this.map);
               this.redrawMarkers();
           }.bind(this), 100);
       }
   };
  this.calcRoute = function(start, end, waypoints) {
      var request = {
          origin: start,
          destination: end,
          travelMode: 'WALKING',
          optimizeWaypoints: true,
          waypoints: waypoints
      };
      this.directionsService.route(request, function (result, status) {
          if (status == 'OK') {
              this.directionsDisplay.setDirections(result);
          }
      }.bind(this));
  };
   this.addMarker = function(id, lat, lng, title, infoContent, iconPath) {
       var myLatLng = {lat: +(lat), lng: +(lng)};
       var marker = new google.maps.Marker({
           position: myLatLng,
           title: title,
           icon: iconPath,
           optimized: false
       });
       var infowindow = new google.maps.InfoWindow({
           content: infoContent
       });
       marker.addListener('click', function() {
            infowindow.open(this.map, marker);
            if (this.lastInfoPane) {
                this.lastInfoPane.close();
            }
            this.lastInfoPane = infowindow;
       }.bind(this));
       this.markers[id] = marker;
   };

   this.clearMarkers = function() {
       angular.forEach(this.markers, function(v,i) {
           v.setMap(null);
       });
       this.markers = {};
   };
   this.setCenterOn = function(lat, lng) {
      this.centerLatLng = new google.maps.LatLng(lat, lng);
   };
   this.redrawMarkers = function() {
       angular.forEach(this.markers, function(v,i) {
           v.setMap(this.map);
       }.bind(this));
   };
   this.triggerInfoPane = function(markerId) {
       if (this.markers[markerId]) {
           google.maps.event.trigger(this.markers[markerId], 'click');
       }
   };
   return this;
}]);

/**
 * The base controller for the app. Will contain any shared data or methods that can be used by the
 * child controllers.
 */
fpaApp.controller('FpaCtrl', ['$scope', function ($scope) {
    $scope.state = 'PA';
    $scope.city = 'Pittsburgh';
    $scope.routeInfo = null;
    $scope.results = null;

    $scope.setRouteInfo = function (routeInfo) {
        $scope.routeInfo = routeInfo;
    };

    $scope.setCustomers = function (customers) {
        $scope.customers = customers;
    };
}]);

/**
 * Search controller that is responsible for collecting user input, fetching the results set,
 * and navigating to a results view (either listing or map).
 */
fpaApp.controller('FpaSearchCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate', '$http', 'MapApi', 'FpaIconService',
    function ($scope, $ionicLoading, $ionicTabsDelegate, $http, MapApi, FpaIconService) {

        $scope.lovEscalationTypes = ["Standard","No Start","Vacation"];

        $scope.lov_state = [
            {'lookupCode': 'AL', 'description': 'Alabama'},
            {'lookupCode': 'FL', 'description': 'Florida'},
            {'lookupCode': 'CA', 'description': 'California'},
            {'lookupCode': 'PA', 'description': 'Pennsylvania'}
        ];

        $scope.routes = [];

        $scope.searchRoutes = function (state, city, routeInfo) {
            $scope.setRoute(routeInfo);
            $http.get('http://10.51.236.201:5000/routes/' + $scope.routeInfo.id + '/').then(function (resp) {
                $scope.setResults(resp.data);
                $ionicTabsDelegate.select(1);
            });
        };

        function getRoutesMock(n) {
            var routes = [];
            for (var i = 0; i < n; i++) {
                routes.push(new RouteInfo(faker.random.number(), faker.address.county()));
            }
            return routes;
        }

        $scope.getCustomersMock = function(n) {
            var customers = [];
            for (var i = 0; i < n; i++) {
                var escLevel = faker.random.number(10);
                var escClass = "";
                if (escLevel < 3) escClass = "esc-low";
                else if (escLevel < 7) escClass = "esc-med";
                else if (escLevel < 10) escClass = "esc-hi";
                var customer = {
                    "id": faker.random.uuid(),
                    "name": faker.name.firstName() + ' ' + faker.name.lastName(),
                    "address": faker.address.streetAddress(),
                    "city": faker.address.city(),
                    "state": faker.address.state(),
                    "zip": faker.address.zipCode(),
                    "phone_home": faker.phone.phoneNumber(),
                    "geo": {
                        "lat": 40.7 + +('.00' + faker.random.number(10000)),
                        "lng": -73.9 + +('.00' + faker.random.number(10000))
                    }
                };
                if (faker.random.number(3) === 0) {
                    customer["escalation"] = {
                        "type": $scope.lovEscalationTypes[faker.random.number($scope.lovEscalationTypes.length - 1)],
                        "level": escLevel,
                        "status": "OPEN",
                        "product": "DS",
                        "complaint": "WP",
                        "css_class": escClass
                    }
                }
                customers.push(customer);
            }
            $scope.setCustomers(customers);
            $ionicTabsDelegate.select(1);
        };

        function getRoutesApi() {
            $http({
                method: 'GET',
                url: 'http://10.51.236.201:5000/routes/'
            }).then(function successCallback(response) {
                $scope.routes = response.data.data.routes;
            }, function errorCallback(response) {
            });
        }

        $scope.searchRoutesMock = function() {
            $scope.getCustomersMock(20);
            MapApi.clearMarkers();
            angular.forEach($scope.customers, function(v,i) {
                var level = (v.escalation) ? v.escalation.level : 0;
                var content = "<h3>" + v.name + "</h3>" +
                    "<h5>" + v.address + "</h5>" +
                    "<h6>Escalation Level " + level + "</h6>";
                MapApi.addMarker(v.id, v.geo.lat, v.geo.lng, v.name, content, FpaIconService.getIconByFpaLevel(level));
                var customerCount = $scope.customers.length;
                var origin = {lat: $scope.customers[0].geo.lat, lng: $scope.customers[0].geo.lng};
                var dest = {lat: $scope.customers[customerCount - 1].geo.lat, lng: $scope.customers[customerCount - 1].geo.lng};
                var wayPoints = [];
                for (var j = 1; j < 8; j++) {
                    wayPoints.push(
                        {location: {lat: $scope.customers[j].geo.lat, lng: $scope.customers[j].geo.lng},
                            stopover: true}
                    );
                }
                MapApi.calcRoute(origin, dest, wayPoints);
            });
        };

        $scope.routes = getRoutesMock(10);

    }]);

/**
 * Listing controller will display addresses and FPA status indicators.
 */
fpaApp.controller('FpaListingCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate', '$ionicModal', 'MapApi',
    function ($scope, $ionicLoading, $ionicTabsDelegate, $ionicModal, MapApi) {

        $scope.viewCustomer = function (customer) {
            $scope.selectedCustomer = customer;
            $scope.openModal();
        };

        $scope.viewCustomerOnMap = function (customer) {
            $ionicTabsDelegate.select(2);
            MapApi.setCenterOn(customer.geo.lat, customer.geo.lng);
            MapApi.triggerInfoPane(customer.id);
        };

        $scope.escalationOnly = function (value, index, array) {
            return value.escalation != null;
        };

        $ionicModal.fromTemplateUrl('my-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function () {
            $scope.modal.show();
        };
    }]);

/**
 * Map controller will display the current result set in a map view.
 */
fpaApp.controller('FpaMapCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate', '$timeout', 'MapApi',
    function ($scope, $ionicLoading, $ionicTabsDelegate, $timeout, MapApi) {


        $scope.showMap = function (tabIndex) {
            if (!$scope.map) {
                MapApi.initMap();
                MapApi.redrawMarkers();
            }
        };

        $scope.centerOnMe = function () {
            if (!$scope.map) {
                return;
            }

            $scope.loading = $ionicLoading.show({
                content: 'Getting current location...',
                showBackdrop: false
            });

            navigator.geolocation.getCurrentPosition(function (pos) {
                $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                $scope.loading.hide();
            }, function (error) {
                alert('Unable to get location: ' + error.message);
            });
        };
    }]);
