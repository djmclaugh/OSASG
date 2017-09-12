"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GUI = (function () {
    function GUI(canvas) {
        var _this = this;
        this.canvas = canvas;
        this.canvas.addEventListener("mousemove", function (e) { return _this.onMouseMoveEvent(e); });
        this.canvas.addEventListener("mouseout", function (e) { return _this.onMouseOutEvent(e); });
        this.canvas.addEventListener("click", function (e) { return _this.onMouseClickEvent(e); });
    }
    GUI.prototype.onMouseMoveEvent = function (e) {
        if (this.isMyTurn) {
            this.onMouseMove(this.getMousePosition(e));
        }
    };
    GUI.prototype.onMouseClickEvent = function (e) {
        if (this.isMyTurn) {
            this.onMouseClick(this.getMousePosition(e));
        }
    };
    GUI.prototype.onMouseOutEvent = function (e) {
        if (this.isMyTurn) {
            this.onMouseOut();
        }
    };
    // Utitlity method to get the mouse's position on the canvas even if the canvas gets resized.
    GUI.prototype.getMousePosition = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        var actualX = e.clientX - rect.left;
        var actualY = e.clientY - rect.top;
        var ratio = 500 / (rect.right - rect.left);
        return { x: actualX * ratio, y: actualY * ratio };
    };
    ;
    return GUI;
}());
exports.GUI = GUI;
