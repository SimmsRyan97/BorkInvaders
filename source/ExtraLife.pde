//ExtraLife

class ExtraLife {

  //Global Variables
  float x, y;
  int speed, size;

  //Constructor
  ExtraLife (float x, float y, int speed, int size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  void drawExtraLife() { //Draws a yee
    image(heart, x - 20, y - 20);
  }

  void moveExtraLife() { //This makes the missile shoot upwards
    x = x + speed;
  }

  void updateExtraLife() { //This draws and makes the missile move up
    drawExtraLife();
    moveExtraLife();
  }
}