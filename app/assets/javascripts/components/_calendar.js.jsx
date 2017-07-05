var Calendar = React.createClass({
  componentDidMount: function() {
    window.addEventListener("resize", this.updateCalendarDaySize);
    this.updateCalendarDaySize();
  },
  componentWillUnmount: function() {
    window.removeEventListener("resize", this.updateCalendarDaySize);
  },
  updateCalendarDaySize: function() {
    var calendarWidth = document.querySelector('.calendarDays').offsetWidth;
    if (calendarWidth < 700) {
      var size = calendarWidth / 7;
      var days = document.getElementsByClassName('calendarDay');
      Array.prototype.forEach.call(days, function(day) {
        day.style.width = size + "px";
        day.style.height = size + "px";
      });
      document.getElementById('timeSelector').width = calendarWidth;
      document.getElementById('timeSelector').height = calendarWidth;
    }
  },
  getInitialState: function() {
    return ({
      shouldDisplayTimeSelector: false,
      displayDate: this.props.displayDate,
      bookings: {
        "2017_5": [
          {
            from: 12,
            to: 13,
            bookedBy: {
              firstName: "Tony",
              id: 5
            },
            color: "#50d99a"
          }
        ],
        "2017_6": [
          {
            from: 9,
            to: 17,
            bookedBy: {
              firstName: "Johannes",
              id: 4
            },
            color: "#d9507b"
          },
          {
            from: 20,
            to: 24,
            bookedBy: {
              firstName: "Bertil",
              id: 6
            },
            color: "#e3a927"
          }
        ]
//        "20176": [
//          {
//            from: new Date(Date.UTC(2017, 6, 1, 13, 0, 0)),
//            to: new Date(Date.UTC(2017, 6, 1, 17, 30, 0)),
//            bookedBy: {
//              firstName: "Johannes",
//              id: 3
//            }
//          }
//        ]
      }
    });
  },
  showTimeSelector: function(e) {
    e.preventDefault();
    var displayDate = this.state.displayDate;
    displayDate.day = {
      nr: e.currentTarget.dataset.datenr,
      name: e.currentTarget.dataset.dayname
    };
    this.setState({
      shouldDisplayTimeSelector: true,
      displayDate: displayDate
    }, function() {
      var timeSelector = new TimeSelector(
        'timeSelector',
        this.state.displayDate.day.nr,
        this.state.displayDate.day.name,
        this.state.displayDate.month.name,
        this.state.bookings[this.state.displayDate.year + "_" + this.state.displayDate.day.nr],
        function(from, to) {
          if (from === false) {
            // User cancelled booking
            console.log("User cancelled booking");
          } else {
            console.log("Please, make a booking from " + from + ":00 to " + to + ":00 on " + this.state.displayDate.day.nr + "/" + this.state.displayDate.month.nr);
          }
          this.setState({
            shouldDisplayTimeSelector: false
          })
        }.bind(this)
      );
      timeSelector.enterFrom(100, 200);
    });
  },
  daysInMonth: function(date) {
    var firstOfPrevMonth = new Date(date); 
    firstOfPrevMonth.setDate(0);
    return firstOfPrevMonth.getDate();
  },
  daysFor: function(displayDate) {
    // Today's date
    var today = new Date();
    // Create Date object from displayDate
    var aDate = new Date(displayDate.year, displayDate.month.nr, displayDate.day.nr);
    // Calculate number of days in displayDate's month
    var nrOfDays = this.daysInMonth(aDate);
    var firstWeekDay = new Date(aDate);
    firstWeekDay.setDate(1);
    var offset = firstWeekDay.getDay() === 0 ? 6 : firstWeekDay.getDay() - 1;
    var days = new Array(offset);
    days.fill(0, 0, offset);
    for (var i = 1; i <= nrOfDays; i++) {
      days.push(i);
    }
    return days.map(function(day, i) {
      var weekDay = new Date(displayDate.year, displayDate.month.nr, day);
      return <Day
        key={i}
        day={day}
        dayName={this.props.dayNames[weekDay.getDay()]}
        today={day == today.getDate()}
        sunday={(1 + i) % 7 === 0}
        bookings={this.state.bookings[displayDate.year + "_" + day] || []}
        handleClick={this.showTimeSelector}
      />;
    }, this);
  },
  render: function() {
    var days = this.daysFor(this.state.displayDate);
    var todaysDate = new Date().getDate();
    var todaysBookings = [];
    if (this.state.bookings[this.state.displayDate.year + "_" + todaysDate] !== undefined) {
      todaysBookings = this.state.bookings[this.state.displayDate.year + "_" + todaysDate].map(function(event, i) {
        return <p key={i}>{event.from.toLocaleString()}-{event.to.toLocaleString()}<br />{event.bookedBy.firstName}</p>
      })
    }
    return (
      <div className="calendar">
        <h1>{this.state.displayDate.month.name}</h1>
        <ul className="calendarDays">
          {days}
        </ul>
        <div className="todaysBookings">
          {todaysBookings.length > 0 ? <h2>Today</h2> : null }
          {todaysBookings.length > 0 ? todaysBookings : null}
        </div>
        <div className={this.state.shouldDisplayTimeSelector ? "timeSelectorContainer visible" : "timeSelectorContainer invisible"} >
          <canvas id="timeSelector" width="600" height="600"/>
        </div>
      </div>
    )
  }
});

var Day = React.createClass({
  render: function() {
    var classNames = [];
    if (this.props.sunday) classNames.push("sunday");
    if (this.props.today) classNames.push("today");

    return this.props.day > 0 ? (
      <li className="calendarDay">
        <a
          onClick={this.props.handleClick}
          href="#"
          data-datenr={this.props.day}
          data-dayname={this.props.dayName}
          className={classNames.join(" ")}>
          <CalendarDayThumbnail
            day={this.props.day}
            bookings={this.props.bookings}
          />
          <span className="number">{this.props.day}</span>
        </a>
      </li>
    ) : (
      <li className="calendarDay"></li>
    )
  }
});

var CalendarDayThumbnail = React.createClass({
  render: function() {
    var circles = this.props.bookings.map(function(booking, i) {
      var hour = 190 / 24;
      var range = booking.to - booking.from;
      return <circle
          key={i}
          cx="50%"
          cy="50%"
          r="30%"
          style={
            {
              strokeDasharray: (range * hour) + "," + (190 - (range * hour)),
              strokeDashoffset: (-6 * hour) + (-booking.from * hour),
              stroke: booking.color,
              fill: "none",
              strokeWidth: "8"
            }
          }
        />
    })
    return (
      <svg
        className="booking"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
        style={{enableBackground:"new 0 0 100 100"}}
        xmlSpace="preserve"
      >
        {circles}        
      </svg>
    )
  }
})



