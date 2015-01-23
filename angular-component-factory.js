(function (angular) {
    'use strict';

    var componentFactoryProvider = function () {

        var componentFactory = function (componentName, overrides) {
            var componentSnakeName = componentName
                .replace(/(?:[A-Z]+)/g, function (match) { //camelCase -> snake-case
                    return '-' + match.toLowerCase();
                })
                .replace(/^-/, ''); // CamelCase -> -snake-case -> snake-case

            var _default = {
                replace: true,
                scope: {},
                restrict: 'E',
                controllerAs: 'vm',
                componentSnakeName: componentSnakeName
            };

            return angular.extend(_default, overrides);
        };

        this.$get = function () {
            return componentFactory;
        }
    };

    var decorateModule = function (module) {
        //We need to handle components that might be registered before angular has finished loading
        var queue = [];
        //This only pushes constructors to a queue, and when angular is ready it registers the directives
        module.component = function (name, constructor) {
            queue.push({name: name, constructor: constructor});
        };

        module.config(['$compileProvider', function ($compileProvider) {
            module.component = function (name, constructor) {
                //Register decorated directives
                $compileProvider.directive((name + 'Component'), ['$injector', 'componentFactory', function ($injector, componentFactory) {
                    return componentFactory(name, $injector.invoke(constructor || angular.noop) || {});
                }]);
                return module; //To allow chaining
            };

            //Registered queued components
            angular.forEach(queue, function (component) {
                module.component(component.name, component.constructor);
            });
        }]);

        module.provider('componentFactory', componentFactoryProvider);
    };

    //Expose provider as a angular module
    angular.module('kennethlynne.componentFactory', []).provider('componentFactory', componentFactoryProvider);

    //Expose decorator
    angular.componentFactory = {
        moduleDecorator: decorateModule
    }

}(angular));
