"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ts_turnbased_connect_1 = require("ts-turnbased-connect");
var assets_1 = require("./assets");
var GUI_1 = require("./GUI");
var ConnectGUI = (function (_super) {
    __extends(ConnectGUI, _super);
    function ConnectGUI(gameName, options, canvas) {
        var _this = _super.call(this, canvas) || this;
        if (gameName == "tictactoe") {
            _this.options = ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.tictactoeOptions());
        }
        else if (gameName == "connect6") {
            _this.options = ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.connect6Options(options.boardWidth, options.boardHeight));
        }
        else {
            _this.options = ts_turnbased_connect_1.sanitizeOptions(options);
        }
        _this.background = assets_1.getGoBoardImage(_this.options.boardWidth, _this.options.boardHeight);
        _this.playedMoves = new Array();
        _this.mouseTarget = null;
        _this.presets = new Array();
        return _this;
    }
    ConnectGUI.prototype.setUpdates = function (updates) {
        // Ignore the empty "game start" event;
        this.playedMoves = new Array();
        this.game = new ts_turnbased_connect_1.Connect(this.options);
        this.game.start();
        for (var i = 1; i < updates.length; ++i) {
            this.addUpdate(updates[i]);
        }
        this.presets = new Array();
        this.mouseTarget = null;
        this.needsRedraw = true;
    };
    ConnectGUI.prototype.addUpdate = function (update) {
        var move = update.publicInfo;
        this.game.playMove(move, this.playedMoves.length % 2);
        this.playedMoves.push(move);
        this.presets = new Array();
        this.mouseTarget = null;
        this.needsRedraw = true;
    };
    ;
    ConnectGUI.prototype.onMouseMove = function (p) {
        var c = this.getMouseTarget(p);
        if (!this.isSameCoordinate(this.mouseTarget, c)) {
            this.needsRedraw = true;
        }
        this.mouseTarget = c;
    };
    ConnectGUI.prototype.onMouseClick = function (p) {
        this.onMouseMove(p);
        if (!this.mouseTarget) {
            return;
        }
        var index = this.indexInPresets(this.mouseTarget);
        if (index == -1) {
            this.presets.push(this.mouseTarget);
        }
        else {
            this.presets.splice(index, 1);
        }
        this.mouseTarget = null;
        this.needsRedraw = true;
    };
    ConnectGUI.prototype.onMouseOut = function () {
        if (this.mouseTarget != null) {
            this.needsRedraw = true;
        }
        this.mouseTarget = null;
    };
    ConnectGUI.prototype.getMove = function () {
        if (this.hasEnoughPresets()) {
            return this.presets;
        }
        return null;
    };
    ConnectGUI.prototype.hasEnoughPresets = function () {
        if (this.playedMoves.length == 0) {
            return this.presets.length == this.options.q;
        }
        var spacesLeft = this.options.boardWidth * this.options.boardHeight;
        spacesLeft -= (this.playedMoves.length - 1) * this.options.p;
        spacesLeft -= this.options.q;
        return this.presets.length == Math.min(this.options.p, spacesLeft);
    };
    ConnectGUI.prototype.draw = function () {
        this.needsRedraw = false;
        var context = this.canvas.getContext("2d");
        context.drawImage(this.background, 0, 0);
        for (var i = 0; i < this.playedMoves.length; ++i) {
            var move = this.playedMoves[i];
            var image_1 = i % 2 == 0 ? assets_1.BLACK_STONE : assets_1.WHITE_STONE;
            var coordinates = Array.isArray(move) ? move : [move];
            for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
                var c = coordinates_1[_i];
                this.drawImageAtCoordinate(image_1, c, context);
            }
        }
        var image = this.playedMoves.length % 2 == 0 ? assets_1.BLACK_STONE : assets_1.WHITE_STONE;
        for (var _a = 0, _b = this.presets; _a < _b.length; _a++) {
            var c = _b[_a];
            this.drawImageAtCoordinate(image, c, context, 0.5);
        }
        if (this.mouseTarget) {
            this.drawImageAtCoordinate(image, this.mouseTarget, context, 0.2);
        }
        if (this.playedMoves.length > 0) {
            var lastMoveImage = this.playedMoves.length % 2 == 0 ? assets_1.WHITE_STONE_LM : assets_1.BLACK_STONE_LM;
            var lastMove = this.playedMoves[this.playedMoves.length - 1];
            var coordinates = Array.isArray(lastMove) ? lastMove : [lastMove];
            for (var _c = 0, coordinates_2 = coordinates; _c < coordinates_2.length; _c++) {
                var c = coordinates_2[_c];
                this.drawImageAtCoordinate(lastMoveImage, c, context);
            }
        }
        var winLine = this.game.getWinLine();
        if (winLine) {
            var winLineImage = this.playedMoves.length % 2 == 0 ? assets_1.WHITE_STONE_WL : assets_1.BLACK_STONE_WL;
            for (var _d = 0, winLine_1 = winLine; _d < winLine_1.length; _d++) {
                var c = winLine_1[_d];
                this.drawImageAtCoordinate(winLineImage, c, context);
            }
        }
    };
    ConnectGUI.prototype.drawImageAtCoordinate = function (image, c, ctx, alpha) {
        if (alpha === void 0) { alpha = 1; }
        ctx.save();
        ctx.globalAlpha *= alpha;
        var p = this.coordinateToPosition(c);
        ctx.drawImage(image, p.x, p.y);
        ctx.restore();
    };
    ConnectGUI.prototype.mousePositionToCoordinate = function (p) {
        return {
            x: Math.round(((p.x - 25) / 25) - ((19 - this.options.boardWidth) / 2)),
            y: Math.round(((p.y - 25) / 25) - ((19 - this.options.boardHeight) / 2))
        };
    };
    ConnectGUI.prototype.coordinateToPosition = function (c) {
        return {
            x: 13 + ((c.x + ((19 - this.options.boardWidth) / 2)) * 25),
            y: 13 + ((c.y + ((19 - this.options.boardHeight) / 2)) * 25)
        };
    };
    ConnectGUI.prototype.isValidCoordinate = function (c) {
        return c.x >= 0 && c.x < this.options.boardWidth && c.y >= 0 && c.y < this.options.boardHeight;
    };
    ConnectGUI.prototype.isOccupiedCoordinate = function (c) {
        for (var _i = 0, _a = this.playedMoves; _i < _a.length; _i++) {
            var move = _a[_i];
            var coordinates = Array.isArray(move) ? move : [move];
            for (var _b = 0, coordinates_3 = coordinates; _b < coordinates_3.length; _b++) {
                var occupied = coordinates_3[_b];
                if (this.isSameCoordinate(c, occupied)) {
                    return true;
                }
            }
        }
        return false;
    };
    ConnectGUI.prototype.indexInPresets = function (c) {
        for (var i = 0; i < this.presets.length; ++i) {
            if (this.isSameCoordinate(c, this.presets[i])) {
                return i;
            }
        }
        return -1;
    };
    ConnectGUI.prototype.isSameCoordinate = function (c1, c2) {
        if (c1 == c2) {
            return true;
        }
        if (!c1 || !c2) {
            return false;
        }
        return c1.x == c2.x && c1.y == c2.y;
    };
    ConnectGUI.prototype.getMouseTarget = function (p) {
        var c = this.mousePositionToCoordinate(p);
        if (!this.isValidCoordinate(c) || this.isOccupiedCoordinate(c)) {
            c = null;
        }
        if (c && this.indexInPresets(c) == -1 && this.hasEnoughPresets()) {
            c = null;
        }
        return c;
    };
    return ConnectGUI;
}(GUI_1.GUI));
exports.ConnectGUI = ConnectGUI;
