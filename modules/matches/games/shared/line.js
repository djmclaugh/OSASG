function Line(c1, c2) {
  this.c1 = c1;
  this.c2 = c2;
}

module.exports = Line;

Line.prototype.getLength = function() {
  var xDiff = Math.abs(this.c1.x - this.c2.x);
  var yDiff = Math.abs(this.c1.y - this.c2.y);
  return Math.max(xDiff, yDiff) + 1;
};
