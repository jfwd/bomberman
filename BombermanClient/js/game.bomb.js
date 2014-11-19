Flame = function(c){
  var config = c || {};
  this.pos = config.pos || 0;
  this.status = config.status || 0;
}

Flame.prototype.start = function(){
  var self = this;

  setTimeout(function(){
    self.destroy();
  }, 300);  
}

Flame.prototype.destroy = function(){
  this.status = 0;
}

Bomb = function(c){

  var config = c || {};
  this.pos = config.pos || 0;
  this.status = config.status || 0; //0: destroyed, 1: normal, 2: explode, 3: flame
  this.timeLeft = config.timeLeft || 3000; //3 секунды

  this.power = config.power || 1; //radius
}

Bomb.EXPLODE_MATRIX_3x3 = [-20, -1, 1, 20];
Bomb.EXPLODE_MATRIX_5x5 = [-40, -20, -2, -1,  1, 2, 20, 40];
// Bomb.EXPLODE_MATRIX_3x3 = [-21, -20, -19, -1, 0, 1, 19, 20, 21];

Bomb.prototype.start = function (){
  var self = this;
  setTimeout(function(){
    self.explode();
  }, this.timeLeft);
}

Bomb.prototype.explode = function() {
  var self = this;
  this.status = BOMB_EXPLODE;

  for (var i = 0; i < Bomb.EXPLODE_MATRIX_5x5.length; i++) {
    var pos = this.pos - 1 + Bomb.EXPLODE_MATRIX_5x5[i];

    if ((pos >= 0) && (pos<=(15*20))){
      this.damage(pos);
    }
  };

  setTimeout(function(){
    self.destroy();
  }, 1000);
}

Bomb.prototype.setFlame = function(pos) { //форк на осколки
  var flame = BM.fx[pos] = new Flame({
    status: 3
  });

  flame.start();
}

Bomb.prototype.damage = function(pos) {
  if (BM.hero.pos == pos) {
    alert('Герой ранен!');
  };
  if (BM.map[pos] == 10) {
    //do nothing
  } else if (BM.map[pos] == 38) {
    // debugger;
    BM.map[pos] = 0;
    this.setFlame(pos);
  } else if (BM.map[pos] == 0) {
    this.setFlame(pos);
  }
}

//удаление бомбы с поля
Bomb.prototype.destroy = function(){
  this.status = 0;
}

if (typeof exports !== "undefined") //for node
{
  exports.Bomb = Bomb;
}