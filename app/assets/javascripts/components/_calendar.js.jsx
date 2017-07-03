var Calendar = React.createClass({
  getInitialState: function() {
    return ({
      shouldDisplayTimeSelector: false,
      displayDate: this.props.displayDate,
      events: {
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
        handleClick={this.showTimeSelector}
      />;
    }, this);
  },
  render: function() {
    var days = this.daysFor(this.state.displayDate);
    var todaysEvents = [];
    if (this.state.events[this.state.displayDate.year + "" + this.state.displayDate.month.nr] !== undefined) {
      todaysEvents = this.state.events[this.state.displayDate.year + "" + this.state.displayDate.month.nr].map(function(event, i) {
        return <p key={i}>{event.from.toLocaleString()}-{event.to.toLocaleString()}<br />{event.bookedBy.firstName}</p>
      })
    }
    return (
      <div className="calendar">
        <h1>{this.state.displayDate.month.name}</h1>
        <ul className="calendarDays">
          {days}
        </ul>
        {todaysEvents.length > 0 ? <h2>Today</h2> : null }
        {todaysEvents.length > 0 ? todaysEvents : null}
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
      <li>
        <a
          onClick={this.props.handleClick}
          href="#"
          data-datenr={this.props.day}
          data-dayname={this.props.dayName}
          className={classNames.join(" ")}>
          <span className="number">{this.props.day}</span>
        </a>
      </li>
    ) : (
      <li></li>
    )
  }
});




