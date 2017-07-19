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
      var h = this.from;
      while (this.isFreeToBook(h++)) {
        this.to = h;
      }
      console.error("Already booked!");
    }
  }
  this.sanityCheck();
}

HourSelection.prototype.selectFrom = function(hour) {
  if (hour == this.to) {
    this.removeSelection();
  } else {
    this.from = hour;
  }
  this.sanityCheck();
}

HourSelection.prototype.selectTo = function(hour) {
  if (hour == this.from) {
    this.removeSelection();
  } else {
    this.to = hour;
  }
  this.sanityCheck();
}

HourSelection.prototype.removeSelection = function() {
  this.from = undefined;
}

HourSelection.prototype.deselectHour = function(hour) {
  if (this.from !== undefined) {
    // Selection exists
    if (hour == this.from && hour < this.to - 1) {
      this.from++;
    } else if (this.from == this.to - 1) {
      this.from = undefined;
      this.to = undefined;
    } else {
      this.to = hour;
    }
  }
  this.sanityCheck();
}

HourSelection.prototype.sanityCheck = function() {
  // Make sure this.from is less than this.to
  if (this.from > this.to) {
    // Swap values
    var from = this.from;
    var to = this.to;
    this.to = from;
    this.from = to;
    return;
  }
  if (this.from == this.to) {
    this.removeSelection();
    return;
  }
  if (this.from < 0) this.from += 24;
  if (this.from > 23) this.from -= 24;
  if (this.to < 1) this.to += 24;
  if (this.to > 24) this.to -= 24;
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

