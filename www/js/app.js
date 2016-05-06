// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('fpa', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.controller('FpaCtrl', ['$scope', function($scope) {

}])
.controller('FpaSearchCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate',
                              function($scope, $ionicLoading, $ionicTabsDelegate) {

}])
.controller('FpaListingCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate', 
                               function($scope, $ionicLoading, $ionicTabsDelegate) {

}])
.controller('FpaMapCtrl', ['$scope', '$ionicLoading', '$ionicTabsDelegate', '$timeout',
                           function($scope, $ionicLoading, $ionicTabsDelegate, $timeout) {
  $scope.initGoogleMaps = function() {
    var myLatlng = new google.maps.LatLng(43.07493,-89.381388);
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    $timeout(function() {
      $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    }, 1000);
  };

  $scope.showMap = function(tabIndex) {
    console.log("selected tab: " + tabIndex);
    if (!$scope.map) {
      google.maps.event.addDomListener(window, "load", $scope.initGoogleMaps());
    }
  };

  $scope.centerOnMe = function() {
    if(!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function(error) {
      alert('Unable to get location: ' + error.message);
    });
  };
}]);