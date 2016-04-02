// Set this to 31 instead of 32 since javascript bitwise operators return numbers instead of
// UINTs...
// So if x = 2147483648 = 1000 0000 0000 0000 0000 0000 0000 0000,
// We have x & x == -x which is not what we want...
// Only using the first 31 bits of the numbers stops this problem since everything will be
// considered positive.
const UINT_SIZE = 31;

function Board(width, height, numberOfStates) {
  this.w = width;
  this.h = height;
  this.N = width * height;
  this.numStates = numberOfStates;
  this.cellSize = Math.ceil(Math.log(this.numStates) / Math.LN2);
  if (this.cellSize > UINT_SIZE) {
    throw new Error("Board only supports 2^" + UINT_SIZE + " states per cell");
  }
  this.cellsPerUINT = Math.floor(UINT_SIZE / this.cellSize);
  this.data = new Uint32Array(Math.ceil(this.N / this.cellsPerUINT));
}

module.exports = Board;

function rangeMask(start, end) {
  var mask = Math.pow(2, end - start) - 1;
  return mask << start;
}

Board.prototype.toString = function() {
  var result = "";
  for (var j = 0; j < this.h; ++j) {
    for (var i = 0; i < this.w; ++i) {
      result += this.getStateAtCoordinate({x: i, y: j});
    }
    result += "\n";
  }
  return result;
};

Board.prototype.positionToCoordinate = function(position) {
  if (!this.isValidPosition(position)) {
    throw new Error("Invalid position: " + position); 
  }
  return {x: position % this.w, y: Math.floor(position / this.w)};
};

Board.prototype.coordinateToPosition = function(coordinate) {
  if (!this.isValidCoordinate(coordinate)) {
    throw new Error("Invalid coordinate: " + JSON.stringify(coordinate)); 
  }
  return coordinate.x + (coordinate.y * this.w);
};

Board.prototype.isValidPosition = function(position) {
  return position >= 0 && position < this.N;
};

Board.prototype.isValidCoordinate = function(coordinate) {
  var x = coordinate.x;
  var y = coordinate.y;
  return x >= 0 && x < this.w && y >= 0 && y < this.h;
};

Board.prototype.swappedXYPosition = function(position) {
  var c = this.positionToCoordinate(position);
  c = this.swappedXYCoordinate(c);
  return this.coordinateToPosition(c);
};

Board.prototype.swappedXYCoordinate = function(c) {
  return {x: c.y, y:c.x};
};

Board.prototype.hasPositionsWithState = function(state) {
  if (state < 0 || state >= this.numStates) {
    throw new Error("invalid state: " + state);
  }
  for (var i = 0; i < this.N; ++i) {
    if (this.getStateAtPosition(i) === state) {
      return true;
    }
  }
  return false;
};

Board.prototype.getPositionsWithState = function(state) {
  if (state < 0 || state >= this.numStates) {
    throw new Error("Invalid state: " + state);
  }
  var positions = [];
  for (var i = 0; i < this.N; ++i) {
    if (this.getStateAtPosition(i) === state) {
      positions.push(i);
    }
  }
  return positions;
};

Board.prototype.getCoordinatesWithState = function(state) {
  return this.getPositionsWithState(state).map(this.positionToCoordinate.bind(this));
};

Board.prototype.setStateAtPosition = function(position, state) {
  if (!this.isValidPosition(position)) {
    throw new Error("Invalid position: " + position);
  }
  if (state < 0 || state >= this.numStates) {
    throw new Error("Invalid state: " + state);
  };
  var index = Math.floor(position / this.cellsPerUINT);
  var startBit = this.cellSize * (position % this.cellsPerUINT);
  this.data[index] &= ~rangeMask(startBit, startBit + this.cellSize);
  this.data[index] |= state << startBit;
};

Board.prototype.setStateAtCoordinate = function(coordinate, state) {
  this.setStateAtPosition(this.coordinateToPosition(coordinate), state);
}             

Board.prototype.getStateAtPosition = function(position) {
  if (!this.isValidPosition(position)) {
    throw new Error("Invalid position: " + position);
  }
  var index = Math.floor(position / this.cellsPerUINT);
  var startBit = this.cellSize * (position % this.cellsPerUINT);
  var state = this.data[index] & rangeMask(startBit, startBit + this.cellSize);
  var result = state >> startBit;
  if (result < 0) {
    console.log(this.data[index]);
    console.log(this.data[index] & rangeMask(startBit, startBit + this.cellSize));  
    console.log(this.data);
    console.log(index);
    console.log(startBit);
    console.log(state);
  }
  return result;
};

Board.prototype.getStateAtCoordinate = function(coordinate) {
  return this.getStateAtPosition(this.coordinateToPosition(coordinate));
};

