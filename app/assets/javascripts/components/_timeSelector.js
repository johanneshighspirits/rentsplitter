/**
*   Store a timespan. 
*/
function HourSelection() {
  this.from = undefined;
  this.to = undefined;
}

/**
*   Return all hours in selection as array
*/
HourSelection.prototype.getSelectedHours = function() {
  var selection = [];
  if (this.hasSelection) {
    for (var h = this.from; h < this.to; h++) {
      selection.push(h);
    }
  }
  return selection;
}

/**
*   Select hour if it is not already booked
*/
HourSelection.prototype.selectHour = function(hour) {
  if (this.isFreeToBook(hour)) {
    // This hour is not already booked
    if (this.from == undefined) {
      // No selection exists
      this.from = hour;
      this.to = hour + 1;
    } else if (hour < this.from) {
      this.from = hour;
    } else if (hour > this.to - 1) {
      this.to = hour + 1;
    }
    // Check if range is valid
    if(!this.rangeIsFreeToBook(this.getSelectedHours())) {
      console.error("Already booked!");
      var h = this.from;
      while (this.isFreeToBook(h++)) {
        this.to = h;
      }
    }
  } else {
    var prevBooking = this.bookingFor(hour);
    console.log("Already booked by ", prevBooking);
    alert(prevBooking.from + ":00-" + prevBooking.to + ":00 is already booked by " + prevBooking.bookedBy.name);
  }
  // Make sure this.from is less than this.to
  if (this.from > this.to) {
    // Swap values
    var to = this.from;
    this.to = this.from;
    this.from = to;
  }
}

HourSelection.prototype.selectFrom = function(hour) {
  if (hour == this.to) {
    this.removeSelection();
  } else {
    this.from = hour;
  }
}

HourSelection.prototype.selectTo = function(hour) {
  if (hour == this.from) {
    this.removeSelection();
  } else {
    this.to = hour;
  }
}

HourSelection.prototype.removeSelection = function() {
  this.from = undefined;
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

HourSelection.prototype.registerBookings = function(bookings) {
  this.bookings = bookings || [];
  this.bookings.hours = [];
  if (bookings) {
    bookings.forEach(function(booking) {
      var hour = booking.from;
      while(hour < booking.to) {
        this.bookings.hours.push(hour);
        hour++;
      }
    }, this)
  }
}

/**
*   Check if `hour` is available for booking
*   @param {Number} hour - The hour to check
*   @returns {Boolean}
*/
HourSelection.prototype.isFreeToBook = function(hour) {
  var isFree = true;
  if (this.bookings.hours.includes(hour)) {
    isFree = false;
  };
  return isFree;
}

/**
*   Check if range of hours is available for booking
*   @param {Array} hours - The hours to check
*   @returns {Boolean}
*/
HourSelection.prototype.rangeIsFreeToBook = function(hours) {
  var isFree = true;
  hours.forEach(function(hour) {
    if (this.bookings.hours.includes(hour)) {
      isFree = false;
    };
  }, this);
  return isFree;
}

/**
*   Returns previously made booking for specified hour
*/
HourSelection.prototype.bookingFor = function(hour) {
  var result;
  this.bookings.forEach(function(booking) {
    if (booking.from <= hour && booking.to >= hour + 1) {
      result = booking;
    }
  })
  return result;
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
function TimeSelector(canvasId, date, day, month, bookings, callback) {
  this.canvas = document.getElementById(canvasId);
  this.date = date;
  this.day = day;
  this.month = month;
  this.selectedHours = new HourSelection();
  this.selectedHours.registerBookings(bookings);
  this.submitBooking = callback;
  this.animationCompletion = 0;
  this.hourOffset = -6;
  
  this.ctx = this.canvas.getContext('2d');
  this.highlightedHour;
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

  // Register listeners
  this.handleMouseDownRef = this.handleMouseDown.bind(this);
  this.handleHoverRef = this.handleHover.bind(this);
  this.canvas.addEventListener("mousedown", this.handleMouseDownRef);
  this.canvas.addEventListener("mousemove", this.handleHoverRef);
  this.canvas.addEventListener("touchstart", this.handleMouseDownRef);
  this.canvas.addEventListener("touchmove", this.handleHoverRef);
  // Update sizes and draw first frame
  this.updateCanvasSize();
  window.addEventListener("resize", this.updateCanvasSize.bind(this));
}

TimeSelector.prototype.updateCanvasSize = function() {
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.radius = (this.width - 20) / 2;
  this.center = {
    x: this.width / 2,
    y: this.height / 2
  };
  
  if (this.width > 480) {
    // Default
    this.cancelBtnMargin = 20;
    this.cancelBtnSize = 30;
    this.fontSizes = {
      timeRange: 34,
      info: 14,
      dateDisplay: 16
    };  
  } else if (this.width > 320) {
    // Mid size
    this.cancelBtnMargin = 20;
    this.cancelBtnSize = 20;
    this.fontSizes = {
      timeRange: 22,
      info: 10,
      dateDisplay: this.width * 0.03
    };
  } else {
    // Small
    this.cancelBtnMargin = 10;
    this.cancelBtnSize = 20;
    this.fontSizes = {
      timeRange: 12,
      info: 8,
      dateDisplay: 10
    };
  }

  this.draw();
}

/**
*   Shows TimeSelector by scaling UI from a point.
*/
TimeSelector.prototype.enterFrom = function(x, y) {
  this.thumbnailX = x;
  this.thumbnailY = y;
  var xMargin = Math.max((window.innerWidth - 700) / 2, 0);
  requestAnimationFrame(this.growFromPoint.bind(this, x, y, xMargin));
}

/**
*   Hides TimeSelector by scaling UI to a point.
*/
TimeSelector.prototype.discardTo = function(x, y) {
  var xMargin = Math.max((window.innerWidth - 700) / 2, 0);
  requestAnimationFrame(this.shrinkToPoint.bind(this, x, y, xMargin));
}

/**
*
*/
TimeSelector.prototype.growFromPoint = function(x, y, xMargin) {
  this.animationCompletion += 0.05;
  var xPos = (x - this.center.x - xMargin) * (1 - this.animationCompletion);
  var yPos = (y - this.center.y + 10) * (1 - this.animationCompletion);
  if (this.animationCompletion < 1) {
    this.canvas.style.transform = "translate(" + xPos + "px, " + yPos + "px)";
    this.draw();
    requestAnimationFrame(this.growFromPoint.bind(this, x, y, xMargin));
  } else {
    this.animationCompletion = 1;
    this.canvas.style.transform = "none";
    this.draw();
  }
}

/**
*
*/
TimeSelector.prototype.shrinkToPoint = function(x, y, xMargin) {
  this.animationCompletion -= 0.075;
  var xPos = (x - this.center.x - xMargin) * (this.animationCompletion - 1);
  var yPos = (y - this.center.y + 10) * (this.animationCompletion - 1);
  if (this.animationCompletion > 0) {
    this.canvas.style.transform = "translate(" + (-1 * xPos) + "px, " + (-1 * yPos) + "px)";
    this.draw();
    requestAnimationFrame(this.shrinkToPoint.bind(this, x, y, xMargin));
  } else {
    this.animationCompletion = 0;
    this.draw();
  }
}

/**
*   Draw background items.
*/
TimeSelector.prototype.drawBackground = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
  // Draw Night half of clock
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, this.radius * this.animationCompletion, 0, Math.PI);
  this.ctx.fillStyle = this.colors.night;
  this.ctx.fill();
  // Draw Day half of clock
  this.ctx.beginPath();
  this.ctx.arc(this.center.x, this.center.y, this.radius * this.animationCompletion, Math.PI, 2 * Math.PI);
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
  var startAngle = (from - this.hourOffset) * hourRadian;
  var endAngle = (to - this.hourOffset) * hourRadian;
    
  if (stroke) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.arc(this.center.x, this.center.y, (this.radius + 5 * this.animationCompletion), startAngle, endAngle);
//    this.ctx.arc(this.center.x, this.center.y, ((this.radius - 100) * this.animationCompletion), endAngle, startAngle, true);
    this.ctx.stroke();
  } else {
    this.ctx.beginPath();
    this.ctx.arc(this.center.x, this.center.y, (this.radius * this.animationCompletion), startAngle, endAngle);
    this.ctx.arc(this.center.x, this.center.y, ((this.radius - (this.radius * 0.4)) * this.animationCompletion), endAngle, startAngle, true);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    if (this.ctx.globalAlpha == 1) {
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
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
      lineLength *= 2.5;
    } else {
      // Half hour
      lineLength = this.width / 60;
    }
    this.ctx.translate(this.center.x, this.center.y);
    this.ctx.rotate((h * angle) * Math.PI / 180);
    this.ctx.beginPath();
    this.ctx.moveTo((this.radius - lineLength) * this.animationCompletion, 0);
    this.ctx.lineTo(this.radius * this.animationCompletion, 0);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/**
*
*/
TimeSelector.prototype.drawHourNumbers = function() {
  var hour = 0;
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.font = "400 12px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif"
  for (var h = 0; h < (2 * Math.PI); h += ((2 * Math.PI) / 24)) {
    var x = this.center.x + (((this.radius - this.radius / 5) * this.animationCompletion) * Math.cos(h));
    var y = this.center.y + (((this.radius - this.radius / 5) * this.animationCompletion) * Math.sin(h));
    this.ctx.fillStyle = hour >= 12 ? this.colors.dayText : this.colors.nightText;
    // Mark start and end selection if any
    var selectedHourCircle = false;
    if (this.selectedHours.hasSelection()) {
      var correctedHour = this.offsetCorrectedHour(hour);      
      if (correctedHour == this.selectedHours.from || correctedHour == this.selectedHours.from + 24 || correctedHour == this.selectedHours.to) {
//        this.drawHourCircle(correctedHour);
        selectedHourCircle = true;
        var r = this.width * 0.041;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colors.day; //hour >= 12 ? this.colors.day : this.colors.night;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowColor = hour < 12 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)';
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();        
        this.ctx.restore();
      }
    }

    var display = this.offsetCorrectedHour(hour);
    if (this.highlightedHour < 12 && hour + this.hourOffset === 0) display = "0";
    if (selectedHourCircle) this.ctx.fillStyle = this.colors.dayText;
    if (display) this.ctx.fillText(display, x, y);
    hour++;
  }
}

/**
*   Returns hour with offset applied
*/
TimeSelector.prototype.offsetCorrectedHour = function(hour) {
  return hour + this.hourOffset > 0 ? hour + this.hourOffset : hour + this.hourOffset + 24;
}

/**
*   Draw cancel button
*/
TimeSelector.prototype.drawCancelBtn = function() {
  if (this.animationCompletion < 1) return;
  this.ctx.strokeStyle = this.highlightCancel ? "#FFF" : "#AAA";
  this.ctx.lineWidth = 2;
  var corners = {
    left: this.width - (this.cancelBtnMargin + this.cancelBtnSize),
    right: this.width - this.cancelBtnMargin,
    top: this.cancelBtnMargin,
    bottom: this.cancelBtnMargin + this.cancelBtnSize
  };
  this.ctx.beginPath();
  this.ctx.moveTo(corners.left, corners.top);
  this.ctx.lineTo(corners.right, corners.bottom);
  this.ctx.closePath();
  this.ctx.stroke();
  this.ctx.beginPath();
  this.ctx.moveTo(corners.right, corners.top);
  this.ctx.lineTo(corners.left, corners.bottom);
  this.ctx.closePath();
  this.ctx.stroke();
}

/**
*   Draw todays date
*/
TimeSelector.prototype.drawDate = function() {
  this.ctx.save();
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.translate(this.center.x * (1 - this.animationCompletion), this.center.y * (1 - this.animationCompletion));
  this.ctx.scale(this.animationCompletion, this.animationCompletion);
  // Date
  this.ctx.font = "700 " + this.fontSizes.timeRange + "px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif";
  this.ctx.fillStyle = this.colors.dateText;
  this.ctx.fillText(this.date, this.center.x, this.center.y * 0.62);
  this.ctx.font = "300 " + this.fontSizes.dateDisplay + "px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif";
  // Weekday
  this.ctx.fillText(this.day.substr(0,3).toUpperCase(), this.center.x, this.center.y * 0.54);
  // Month
  this.ctx.font = "400 " + this.fontSizes.dateDisplay + "px 'Quicksand', Quicksand, 'HelveticaNeue', Helvetica, Arial, sans-serif";
  this.ctx.fillText(this.month.substr(0,3).toUpperCase(), this.center.x, this.center.y * 0.71);
  this.ctx.restore();
}

/**
*   Draw submit button
*/
TimeSelector.prototype.drawSubmit = function() {
  if (this.selectedHours.hasSelection()) {
    // Draw OK Button
    this.ctx.beginPath();
    this.ctx.arc(this.center.x, this.center.y, ((this.width / 12) * this.animationCompletion), 0, 2 * Math.PI);
    this.ctx.fillStyle = this.highlightSubmit ? this.colors.bookingText : "#FFF";    
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 22;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fill();
    this.ctx.restore();
    // Draw 'OK' text
    var fontSize = this.fontSizes.timeRange * this.animationCompletion;
    this.ctx.font = "100 " + fontSize + "px 'Helvetica Neue', 'HelveticaNeue-Light', Helvetica, Arial, sans-serif";
    this.ctx.fillStyle = this.highlightSubmit ? "#EEE" : "#000";
    this.ctx.fillText("OK", this.center.x, this.center.y);
  } else {
    // Draw Day/Night icons
    var size = (this.width * 0.083) * this.animationCompletion;
    // Moon
    var moon = document.getElementById('moon');
    this.ctx.drawImage(moon, this.center.x - (size / 2), (this.center.y + (this.height * 0.016 * this.animationCompletion)), size, size)
    // Sun
    var sun = document.getElementById('sun');
    this.ctx.drawImage(sun, this.center.x - (size / 2), (this.center.y - (this.height * 0.1 * this.animationCompletion)), size, size)
  }
}

/**
*
*/
TimeSelector.prototype.drawTimeRange = function() {
  this.ctx.save();
  this.ctx.translate(this.center.x * (1 - this.animationCompletion), this.center.y * (1 - this.animationCompletion));
  this.ctx.scale(this.animationCompletion, this.animationCompletion);
  this.ctx.font = "100 " + this.fontSizes.timeRange + "px 'Quicksand', Quicksand, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  this.ctx.fillStyle = this.colors.bookingText;
  var text = "Choose time";
  if (this.selectedHours.hasSelection()) {
    text = this.selectedHours.from + ":00-" + this.selectedHours.to + ":00";
  }
  this.ctx.fillText(text, this.center.x, this.center.y * 1.28);
  this.ctx.restore();
}

/**
*
*/
TimeSelector.prototype.drawInfo = function(info) {
  this.ctx.font = "100 " + this.fontSizes.info + "px 'Quicksand', Quicksand, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  var text = info;
  this.ctx.fillText(text, this.center.x, this.center.y * 1.4);
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
  var hour = Math.floor((degree / 360) * 24) + this.hourOffset;
  return hour >= 0 ? hour : hour + 24;
}

TimeSelector.prototype.mouseIsAboveSubmit = function(x, y) {
  if (!this.selectedHours.hasSelection()) return false;
  var xPos = x - this.center.x;
  var yPos = y - this.center.y;
  var isAboveSubmit = (xPos * xPos) + (yPos * yPos) < 50 * 50;
  return isAboveSubmit;
}

TimeSelector.prototype.mouseIsAboveCancel = function(x, y) {
  return x > this.width - ((2 * this.cancelBtnMargin) + this.cancelBtnSize) && y < (2 * this.cancelBtnMargin) + this.cancelBtnSize;
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
  var info = "";
  // Draw previous bookings if any
  this.selectedHours.bookings.forEach(function(booking) {
    if (this.highlightBooking !== undefined && this.highlightBooking.id == booking.id) {
      this.ctx.globalAlpha = 0.8;
      info = booking.bookedBy.name;
    } else {
      this.ctx.globalAlpha = 0.5;
    }
    var color = booking.color;
    var hour = booking.from;
    while (hour < booking.to) {
      this.drawHourPie(hour, hour + 1, color);
      hour++;
    }
  }, this);
  this.ctx.globalAlpha = 1;
  
  // Draw selected hours if any
  this.selectedHours.getSelectedHours().forEach(function(hour) {
    var color = hour >= 12 + this.hourOffset && hour < 24 + this.hourOffset ? this.colors.selectedDay : this.colors.selectedNight;
    this.drawHourPie(hour, hour + 1, color);
  }, this);

  // Draw highlighted hour if user hovers on canvas
  if (this.highlightedHour !== undefined) {
    var color = this.colors.bookingText; // this.highlightedHour >= 12 ? this.colors.highlightedDay : this.colors.highlightedNight;
    this.drawHourPie(this.highlightedHour, this.highlightedHour + 1, color, true);
    if (info === "") {
      if (this.selectedHours.hasSelection()) {
        info = "Click OK to book";
      } else {
        info = this.highlightedHour + ":00 - " + (this.highlightedHour + 1) + ":00";
      }
    }
  };
  // Display selected time range
  this.drawTimeRange();
  // Display user feedback
  this.drawInfo(info);
  // Draw hour lines
  this.drawHourLines();
  // Draw hour numbers
  this.drawHourNumbers();
  // Draw Date
  this.drawDate();
  // Draw submit button
  this.drawSubmit();
  // Draw cancel button
  this.drawCancelBtn();
}

/**
*   Clear canvas
*/
TimeSelector.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}


TimeSelector.prototype.clearListeners = function() {
  this.canvas.removeEventListener("mousedown", this.handleMouseDownRef);
  this.canvas.removeEventListener("mousemove", this.handleHoverRef);
  this.canvas.removeEventListener("touchstart", this.handleMouseDownRef);
  this.canvas.removeEventListener("touchmove", this.handleHoverRef);
}



/**
*   Handle mouse click on canvas
*   If hour is not selected, select it.
*   If hour is selected, deselect it
*   If mouse is over submit button - submit
*   If mouse is over cancel button - cancel
*/
TimeSelector.prototype.handleMouseDown = function(e) {
  // Prevent default to cancel click events
  e.preventDefault();
  // Check mouse position
  if (this.mouseIsAboveSubmit(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop)) {
    // Submit (create) booking
    if (this.selectedHours.hasSelection()) {
      // Remove event listeners
      this.clearListeners();
      // Hide time selector
      this.discardTo(this.thumbnailX, this.thumbnailY);
      // Envoke callback to submit booking
      this.submitBooking("create", this.selectedHours.from, this.selectedHours.to);
    } else {
      var ok = confirm("Nothing selected.\nPlease click (or drag) on the hours you want to book.\n\nPress cancel to close without making a booking.");
      if (!ok) {
        this.clearListeners();
        // Hide time selector
        this.discardTo(this.thumbnailX, this.thumbnailY);
        this.submitBooking("cancel");
      }
    }
  } else if (this.mouseIsAboveCancel(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop)) {
    // Cancel booking
    // Remove event listeners
    this.clearListeners();
    // Hide time selector
    this.discardTo(this.thumbnailX, this.thumbnailY);
    // Cancel
    this.submitBooking("cancel");
  } else {
    // Select/Deselect hour(s)
    var hour = this.hourFromPoint(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop);
    this.dragStartHandle = hour == this.selectedHours.from && this.selectedHours.to > hour + 1;
    this.selectedHours.selectHour(hour);

    // Attach event listener to canvas
    this.dragSelectHoursRef = this.dragSelectHours.bind(this);
    this.hoursSelectedRef = this.hoursSelected.bind(this);
    e.target.addEventListener("mousemove", this.dragSelectHoursRef);
    e.target.addEventListener("mouseup", this.hoursSelectedRef);
    e.target.addEventListener("touchmove", this.dragSelectHoursRef);
    e.target.addEventListener("touchend", this.hoursSelectedRef);
  }
  this.draw();
}

/**
*   Handle mouse dragging over hours to select/book
*/
TimeSelector.prototype.dragSelectHours = function(e) {
  var hour = this.hourFromPoint(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop);
  if (this.dragStartHandle) {
    // User drags start point
    if (hour < this.selectedHours.from) {
      this.selectedHours.selectHour(hour);
    } else {
      this.selectedHours.selectFrom(hour);
    }
  } else {
    // User drags end point
    if (hour < this.selectedHours.to - 1) {
      this.selectedHours.selectTo(hour);
    } else {
      this.selectedHours.selectHour(hour);
    }
  }
  
  this.draw();
}

/**
*   User has finished selecting hours
*/
TimeSelector.prototype.hoursSelected = function(e) {
  e.target.removeEventListener("mousemove", this.dragSelectHoursRef);
  e.target.removeEventListener("mouseup", this.hoursSelectedRef);
  e.target.removeEventListener("touchmove", this.dragSelectHoursRef);
  e.target.removeEventListener("touchend", this.hoursSelectedRef);
}

/**
*   Handle mouse hover over canvas
*/
TimeSelector.prototype.handleHover = function(e) {
  if (this.mouseIsAboveSubmit(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop)) {
    this.canvas.style.cursor = "pointer";
    this.highlightSubmit = true;
    this.highlightedHour = undefined;
    this.highlightCancel = false;
    this.highlightBooking = undefined;
  } else if (this.mouseIsAboveCancel(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop)) {
    this.canvas.style.cursor = "pointer";
    this.highlightSubmit = false;
    this.highlightedHour = undefined;
    this.highlightCancel = true;
    this.highlightBooking = undefined;
  } else {
    this.canvas.style.cursor = "default";
    var hour = this.hourFromPoint(e.pageX - this.canvas.offsetLeft, e.pageY - this.canvas.offsetTop - document.body.scrollTop);
    this.highlightSubmit = false;
    this.highlightedHour = hour;    
    this.highlightCancel = false;
    this.highlightBooking = this.selectedHours.bookingFor(hour);
  }
  this.draw();
}


