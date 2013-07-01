'use strict';

/* App Module */

//angular.module('emailfooters', ['phonecatFilters', 'phonecatServices']).
angular.module('emailfooters-frontpage', []).
        config(['$routeProvider', function($routeProvider) {
        $routeProvider.
                when('/', {controller: InfoDetailCtrl}).
                when('/phones', {templateUrl: 'partials/info.html', controller: InfoDetailCtrl});
        //  when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
        //   otherwise({redirectTo: '/phones'});
    }])

angular.module('ng-index', ['ui.bootstrap']);