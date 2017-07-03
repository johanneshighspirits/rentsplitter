/**
*   Store a timespan. 
*/
function HourSelection() {
  this.from;
  this.to;
}

HourSelection.prototype.getSelectedHours = function() {
  var selection = [];
  if (this.hasSelection) {
    for (var h = this.from; h < this.to; h++) {
      selection.push(h);
    }
  }
  return selection;
}

HourSelection.prototype.selectHour = function(hour) {
  if (!this.from) {
    // No selection exists
    this.from = hour;
    this.to = hour + 1;
  } else if (hour < this.from) {
    this.from = hour;
  } else if (hour > this.to - 1) {
    this.to = hour + 1;
  }
}

HourSelection.prototype.deselectHour = function(hour) {
  if (this.from) {
    // Selection exists
    if (hour == this.from || this.from == this.to - 1) {
      this.from = undefined;
      this.to = undefined;
    } else {
      this.to = hour;
    }
  }
}

HourSelection.prototype.hourIsSelected = function(hour) {
  var isSelected = hour >= this.from && hour < this.to && this.from < this.to;
  return isSelected;
}

HourSelection.prototype.hasSelection = function() {
  return this.from !== undefined && this.to !== undefined;
}


/**
*   Display a 24-hour clock where user can choose a time span.
*/
function TimeSelector(canvasId, date, day, month, callback) {
  this.canvas = document.getElementById(canvasId);
  this.date = date;
  this.day = day;
  this.month = month;
  this.submitBooking = callback;
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.center = {
    x: this.width / 2,
    y: this.height / 2
  }
  this.ctx = this.canvas.getContext('2d');
  this.highlightedHour;
  this.selectedHours = new HourSelection();
  // Colors
  this.colors = {
    dayText:          '#333',
    nightText:        '#DDD',
    day:              '#EEE',
    night:            '#222',
    dateText:         'rgb(31, 117, 157)',
    bookingText:      'rgb(202, 170, 71)',
    selectedDay:      '#9ac9da',
    selectedNight:    'rgba(52, 102, 117, 0.8)',
    highlightedDay:   'rgba(0, 0, 0, 0.2)',
    highlightedNight: 'rgba(255, 255, 255, 0.2)',
  }
  // Text defaults
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  // Draw first frame
  this.draw();
  // Register listeners
  this.handleMouseDownRef = this.handleMouseDown.bind(this);
  this.handleHoverRef = this.handleHover.bind(this);
  this.canvas.addEventListener("mousedown", this.handleMouseDownRef);
  this.canvas.addEventListener("mousemove", this.handleHoverRef);
}

/**
*   Draw background items, then save context.
*/
TimeSelector.prototype.drawBackground = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
  // Draw Night half of clock
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, (this.width - 100) / 2, 0, Math.PI);
  this.ctx.fillStyle = this.colors.night;
  this.ctx.fill();
  // Draw Day half of clock
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, (this.width - 100) / 2, Math.PI, 2 * Math.PI);
  this.ctx.fillStyle = this.colors.day;
  this.ctx.fill();
}

/**
*   Draw a slice of the circle, representing a number of hours
*   @param {Number} from      - A Number between 0-23
*   @param {Number} [to]      - A Number between 1-24
*   @param {String} [color]   - The color for the time span.
*   @param {Boolean} [stroke] - If true: stroke, else fill.
*/
TimeSelector.prototype.drawHourPie = function(from, to, color, stroke) {
  var to = to || from + 1;
  var color = color || '#000';
  var stroke = stroke || false;
  // Draw hour pie
  var hourRadian = (2* Math.PI) / 24;
  var startAngle = from * hourRadian;
  var endAngle = to * hourRadian;
    
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, (this.width - 100) / 2, startAngle, endAngle);
  this.ctx.arc(this.center.x, this.center.y, (this.width - 300) / 2, endAngle, startAngle, true);
  if (stroke) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.closePath();
    this.ctx.stroke();
  } else {
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
}

/**
*   Draw lines marking the hours
*/
TimeSelector.prototype.drawHourLines = function() {
  var angle = 360 / 48,
      lineLength;
  this.ctx.strokeStyle = this.colors.nightText;
  this.ctx.lineWidth = 1;
  for (var h = 0; h < 48; h++) {
    if (h >= 24) this.ctx.strokeStyle = this.colors.dayText;
    if (h % 2 === 0) {
      // Hour
      lineLength = 25;
    } else {
      // Half hour
      lineLength = 10;
    }
    this.ctx.translate(this.center.x, this.center.y);
    this.ctx.rotate((h * angle) * Math.PI / 180);
    this.ctx.beginPath();
    this.ctx.moveTo(250 - lineLength, 0);
    this.ctx.lineTo(250, 0);
    this.ctx.stroke();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/**
*
*/
TimeSelector.prototype.drawHourNumbers = function() {
  var radius = 200.0;
  var hour = 0;
  this.ctx.font = "400 12px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif"
  this.ctx.fillStyle = this.colors.nightText;
  for (var h = 0; h < (2 * Math.PI); h += ((2 * Math.PI) / 24)) {
    if (hour >= 12) this.ctx.fillStyle = this.colors.dayText;
    var x = this.center.x + (radius * Math.cos(h));
    var y = this.center.y + (radius * Math.sin(h));
    if (hour > 0) {
      this.ctx.fillText(hour, x, y);
    }
    hour++;
  }
}

/**
*   Draw todays date
*/
TimeSelector.prototype.drawDate = function() {
  // Date
  this.ctx.font = "700 36px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif"
  this.ctx.fillStyle = this.colors.dateText;
  this.ctx.fillText(this.date, this.center.x, this.center.y - 98);
  this.ctx.font = "300 18px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif"
  // Weekday
  this.ctx.fillText(this.day.substr(0,3).toUpperCase(), this.center.x, this.center.y - 123);
  // Month
  this.ctx.font = "400 18px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif"
  this.ctx.fillText(this.month.substr(0,3).toUpperCase(), this.center.x, this.center.y - 72);
}

/**
*   Draw submit button
*/
TimeSelector.prototype.drawSubmit = function() {
  // Draw circle
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, 50, 0, 2 * Math.PI);
  this.ctx.fillStyle = this.highlightSubmit ? this.colors.bookingText : "#FFF";    
  this.ctx.save();
  this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  this.ctx.shadowBlur = 22;
  this.ctx.shadowOffsetX = 0;
  this.ctx.shadowOffsetY = 0;
  this.ctx.fill();
  this.ctx.restore();
  // Draw 'OK'
  this.ctx.font = "100 36px 'Helvetica Neue', 'HelveticaNeue-Light', Helvetica, Arial, sans-serif"
  this.ctx.fillStyle = this.highlightSubmit ? "#EEE" : "#000";
  this.ctx.fillText("OK", this.center.x, this.center.y);
}

/**
*
*/
TimeSelector.prototype.drawTimeRange = function() {
  this.ctx.font = "100 36px 'Quicksand', Quicksand, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  this.ctx.fillStyle = this.colors.bookingText;
  var text = "Choose time";
  if (this.selectedHours.hasSelection()) {
    text = this.selectedHours.from + ":00-" + this.selectedHours.to + ":00";
  }
  this.ctx.fillText(text, this.center.x, this.center.y + 84);
}
/**
*   Find which hour a point belongs to
*   @param {Number} x - The x coordinate of the point
*   @param {Number} y - The y coordinate of the point
*/
TimeSelector.prototype.hourFromPoint = function(x, y) {
  // Calculate degree relative from canvas center.
  // E.g. A point of x: 100px and y: 100px would return 45°
  var degree = Math.atan2(y - this.center.y, x - this.center.x) * 180 / Math.PI;
  // Convert negative degrees to positive
  if (degree < 0) degree = 360 + degree;
  // Return which hour the point is in.
  // 0 means the hour between 00:00-01:00 (am)
  // 1 means 01:00-02:00 and so on
  return Math.floor((degree / 360) * 24);
}

TimeSelector.prototype.mouseIsAboveSubmit = function(x, y) {
  var isAboveSubmit = ((x - this.center.x) ** 2) + ((y - this.center.y) ** 2) < 50 ** 2;
  return isAboveSubmit;
}

/**
*   Calculates the next frame in preparation for drawing
*/
TimeSelector.prototype.prepare = function() {
//  this.drawHourPie(17, 22);
}

/**
*   Updates canvas by clearing and then drawing to it.
*/
TimeSelector.prototype.draw = function() {
  // Empty canvas
  this.clear();
  // Draw background
  this.drawBackground();
  // Prepare for drawing
  this.prepare();
  // Draw selected hours if any
  this.selectedHours.getSelectedHours().forEach(function(hour) {
    this.drawHourPie(hour, hour + 1, hour >= 12 ? this.colors.selectedDay : this.colors.selectedNight);
  }, this);

  // Draw highlighted hour if user hovers on canvas
  if (this.highlightedHour !== undefined) {
    var color = this.colors.bookingText; // this.highlightedHour >= 12 ? this.colors.highlightedDay : this.colors.highlightedNight;
    this.drawHourPie(this.highlightedHour, this.highlightedHour + 1, color, true);
  };
  // Display selected time range
  this.drawTimeRange();
  // Draw hour lines
  this.drawHourLines();
  // Draw hour numbers
  this.drawHourNumbers();
  // Draw Date
  this.drawDate();
  // Draw submit button
  this.drawSubmit();
}

/**
*   Clear canvas
*/
TimeSelector.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

/**
*   Handle mouse click on canvas
*   If hour is not selected, select it.
*   If hour is selected, deselect it
*   If mouse is over submit button - submit
*/
TimeSelector.prototype.handleMouseDown = function(e) {
  if (this.mouseIsAboveSubmit(e.offsetX, e.offsetY)) {
    if (this.selectedHours.hasSelection()) {
      // Remove event listeners
      this.clearListeners();
      // Envoke callback to submit booking
      this.submitBooking(this.selectedHours.from, this.selectedHours.to);
    } else {
      var ok = confirm("Nothing selected.\nPlease click (or drag) on the hours you want to book.\n\nPress cancel to close without making a booking.");
      if (!ok) {
        this.clearListeners();
        this.submitBooking(false);
      }
    }
  } else {
    var hour = this.hourFromPoint(e.offsetX, e.offsetY);
    this.isSelecting = !this.selectedHours.hourIsSelected(hour);
    if (this.isSelecting) {
      this.selectedHours.selectHour(hour);
    } else {
      this.selectedHours.deselectHour(hour);
    }
    // Attach event listener to canvas
    this.dragSelectHoursRef = this.dragSelectHours.bind(this);
    this.hoursSelectedRef = this.hoursSelected.bind(this);
    e.target.addEventListener("mousemove", this.dragSelectHoursRef);
    e.target.addEventListener("mouseup", this.hoursSelectedRef);
  }
  this.draw();
}


TimeSelector.prototype.clearListeners = function() {
  this.canvas.removeEventListener("mousedown", this.handleMouseDownRef);
  this.canvas.removeEventListener("mousemove", this.handleHoverRef);
}


/**
*   Handle mouse hover over canvas
*/
TimeSelector.prototype.handleHover = function(e) {
  if (this.mouseIsAboveSubmit(e.offsetX, e.offsetY)) {
    this.highlightSubmit = true;
    this.highlightedHour = undefined;
  } else {
    var hour = this.hourFromPoint(e.offsetX, e.offsetY);
    this.highlightSubmit = false;
    this.highlightedHour = hour;    
  }
  this.draw();
}

/**
*   Handle mouse dragging over hours to select/book
*/
TimeSelector.prototype.dragSelectHours = function(e) {
  var hour = this.hourFromPoint(e.offsetX, e.offsetY);
  if (this.isSelecting && hour >= this.selectedHours.to - 1) {
    this.selectedHours.selectHour(hour);
  } else {
    this.selectedHours.deselectHour(hour);
  }
  this.draw();
}

/**
*   User has finished selecting hours
*/
TimeSelector.prototype.hoursSelected = function(e) {
  e.target.removeEventListener("mousemove", this.dragSelectHoursRef);
  e.target.removeEventListener("mouseup", this.hoursSelectedRef);
}




