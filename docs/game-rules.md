**Game Description**

* The game is played on a rectangular grid of size **n × m**.
* Each cell in the grid may contain a stone or be empty.
* Rows and columns are fixed; the grid does not rotate.

**Turn Structure**

On each turn, a player performs the following steps:

1. **Choose a side**
   The player selects exactly one of the four sides of the grid:

   * Top
   * Bottom
   * Left
   * Right

2. **Choose a row or column (depending on the side)**

   * If the chosen side is **Top** or **Bottom**, the player selects a **column**.
   * If the chosen side is **Left** or **Right**, the player selects a **row**.

3. **Remove stones from the chosen line**

   * Stones are removed starting from the chosen side and moving inward.
   * The player may remove **any positive number of stones**, subject to the constraints below.

**Removal Rules**

* Stones can only be removed **contiguously** from the chosen side.
* Any **empty cells at the very start of the line (on the chosen side)** are ignored.
* Once the first stone is encountered, the player may remove stones **until the first empty cell is reached**.
* The player **may not remove stones beyond the first empty cell**.
* The player may choose to remove **fewer stones** than the maximum allowed, but at least one stone must be removed.

**Restrictions**

* Stones can only be removed from the side chosen at the beginning of the turn.
* Stones cannot be removed from the middle or from the opposite side.
* A move is invalid if the selected row or column contains no stones accessible from the chosen side.

