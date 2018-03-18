var app=angular.module('app1',[]);
app.controller('Ctrl',['$http', function($http) {
    console.log("Ctrl start");
    var ctrl = this;
    $http.get('/konto').then(function (rep) { ctrl.konto = rep.data; },
    function(err) {

    })

    ctrl.kwota = 0;
    ctrl.wplac = function () {
        $http.post('/konto',{kwota: ctrl.kwota}).then(
            function (rep) { ctrl.konto = rep.data; ctrl.komunikat='OK!' }
        ).catch(function (err) { ctrl.komunikat = 'Wplata nieudana' });
    }
}]);