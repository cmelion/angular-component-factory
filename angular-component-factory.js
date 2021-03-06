(function (angular) {
    'use strict';

    var componentFactoryProvider = function () {
        var _componentBaseViewPath = 'views/components/';

        // default component view path factory
        var _componentViewPathFactory = function (componentSnakeName) {
            return _componentBaseViewPath + componentSnakeName + '/' + componentSnakeName + '.html';
        };

        var componentFactory = function (componentName, overrides) {
            overrides = overrides || {};

            var componentSnakeName = componentName
                .replace(/(?:[A-Z]+)/g, function (match) { //camelCase -> snake-case
                    return '-' + match.toLowerCase();
                })
                .replace(/^-/, ''); // CamelCase -> -snake-case -> snake-case

            var _default = {
                templateUrl: _componentViewPathFactory(componentSnakeName, componentName),
                replace: true,
                scope: {},
                restrict: 'E',
                controller: componentName + 'ComponentCtrl',
                controllerAs: 'vm',
                componentSnakeName: componentSnakeName
            };

            if(overrides.template) {
                delete _default.templateUrl;
            }

            return angular.extend(_default, overrides);
        };

        this.setViewPath = function (args) {
            if (typeof args === 'string') {
                _componentBaseViewPath = args;
            }
            else if(typeof args === 'function') {
                _componentViewPathFactory = args;
            }
        };

        this.$get = function () {
            return componentFactory;
        };
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
    angular.module('cmelion.componentFactory', []).provider('componentFactory', componentFactoryProvider);

    //Expose decorator
    angular.componentFactory = {
        moduleDecorator: decorateModule
    };

}(angular));
