'use strict';

/* Controllers */
function InfoDetailCtrl($scope, $routeParams) {

}

function EditDetailCtrl($scope, $routeParams) {
    $scope.title = "";
    $scope.idelem = "";
}

function CampaignsCtrl($scope, $dialog) {
    $scope.urld = "zzzzzzzzzz";
    $scope.opts = {
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        template: '<div class="modal-header">' +
                '<h3>Copy your footer URL:</h3>' +
                '</div>' +
                '<div id="emailfootersdial" class="modal-body">' +
                '<input class="inpdata" type="text" onClick="this.select();" ng-readonly="true" ng-model="urld" />' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button ng-click="close(result)" class="btn btn-primary" >Close</button>' +
                '</div>', // OR: templateUrl: 'path/to/view.html',
        controller: 'DialogController',
        resolve: {}
    };

    $scope.openDialog = function(url, campaignid) {
        $scope.opts.resolve.urld = function() {
            return angular.copy(url)
        }
        var d = $dialog.dialog($scope.opts);
        d.open();
    };
}
function DialogController($scope, dialog) {
    $scope.urld = '<img src="'+dialog.options.resolve.urld() +'.png" />';
    $scope.close = function(result) {
        dialog.close(result);
    };
}