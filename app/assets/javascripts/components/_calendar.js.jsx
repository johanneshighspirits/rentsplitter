var Calendar = React.createClass({
  getInitialState: function() {
    return ({
      displayDate: {
        year: 2017,
        month: {
          // Zero based, January = 0
          nr: 6,
          name: "July"
        },
        day: {
          nr: 1,
          name: "Lördag"
        }
      },
      events: {
        "201707": [
          {
            from: new Date(Date.UTC(2017, 6, 1, 13, 0, 0)),
            to: new Date(Date.UTC(2017, 6, 1, 17, 30, 0)),
            bookedBy: {
              firstName: "Johannes",
              id: 3
            }
          }
        ]
      }
    });
  },
  daysInMonth: function(date) {
    var firstOfPrevMonth = new Date(date); 
    firstOfPrevMonth.setDate(0);
    return firstOfPrevMonth.getDate();
  },
  daysFor: function(displayDate) {
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
      return <Day
        key={i}
        day={day}
        today={day == aDate.getDate()}
        sunday={(1 + i) % 7 === 0}
      />;
    });
  },
  render: function() {
    var days = this.daysFor(this.state.displayDate);
    var todaysEvents = this.state.events[this.state.displayDate]
    return (
      <div className="calendar">
        <h1>{this.state.displayDate.month.name}</h1>
        <ul className="calendarDays">
          {days}
        </ul>
        <h2>Today</h2>
        {todaysEvents}
      </div>
    )
  }
})

var Day = React.createClass({
  render: function() {
    var classNames = [];
    if (this.props.sunday) classNames.push("sunday");
    if (this.props.today) classNames.push("today");

    return this.props.day > 0 ? (
      <li>
        <a className={classNames.join(" ")}>
          <p className="number">{this.props.day}</p>
        </a>
      </li>
    ) : (
      <li></li>
    )
  }
})








