"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var LoginFormComponent = (function () {
    function LoginFormComponent(osasgService) {
        this.osasgService = osasgService;
        this.email = "";
        this.submitting = false;
        this.successMessage = null;
        this.errorMessage = null;
    }
    LoginFormComponent.prototype.onSubmit = function () {
        var _this = this;
        if (this.submitting) {
            return;
        }
        this.submitting = true;
        this.osasgService.requestEmail(this.email)
            .then(function (message) {
            _this.successMessage = message;
            _this.errorMessage = null;
            _this.submitting = false;
        })
            .catch(function (error) { return _this.handleError(error); });
    };
    LoginFormComponent.prototype.handleError = function (error) {
        this.successMessage = null;
        this.errorMessage = error.message;
        this.submitting = false;
    };
    return LoginFormComponent;
}());
LoginFormComponent = __decorate([
    core_1.Component({
        selector: "login-form",
        templateUrl: "/templates/login_form.html",
    })
], LoginFormComponent);
exports.LoginFormComponent = LoginFormComponent;
