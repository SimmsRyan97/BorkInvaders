//SpaceShip

class SpaceShip {

  //Global Variables
  int x, y, speed, size;

  //Constructor
  SpaceShip (int x, int y, int speed, int size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  void drawSpaceShip() { //Draws a yee
    image(yee, x - 20, y - 20);
  }

  void moveSpaceShip() { //This makes the missile shoot upwards
    x = x + speed;
  }

  void updateSpaceShip() { //This draws and makes the missile move up
    drawSpaceShip();
    moveSpaceShip();
  }

  public boolean edgeDetection() { //Test to see if any aliens have hit the edge of the screen
    if (this.x >= width + 80 || this.x <= - 80) { //When the alien touches the right hand side
      return true;
    } else {
      return false;
    }
  }
}