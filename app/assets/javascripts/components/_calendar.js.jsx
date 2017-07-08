var Calendar = React.createClass({
  componentDidMount: function() {
    window.addEventListener("resize", this.updateCalendarDaySize);
    this.updateCalendarDaySize();
    // Assign color to every member
    // Predefined colors to choose from
    var colors = [
      "#50d99a",
      "#e3a927",
      "#d9507b",
      "#2daee8",
      "#985ae0",
      "#e86e2d",
      "#3cd4bd"
    ];
    var assignedColors = {};
    // Assign colors to members
    this.props.members.forEach(function(member, i) {
      assignedColors[member.id] = colors.length > 0 ? colors.shift() : "#9b9b9b";
    });
    // Prepare previous bookings
    var bookings = {};
    // Store only member id's that has previous bookings
    this.memberIdsWithBookings = [];
    this.props.bookings.forEach(function(booking, i) {
      if (!this.memberIdsWithBookings.includes(booking.member_id)) {
        this.memberIdsWithBookings.push(booking.member_id);
      }
      var fromDate = new Date(booking.from);
      var dayKey = fromDate.getFullYear() + "_" + fromDate.getDate();
      var oldBooking = {
          from: fromDate.getHours(),
          to: new Date(booking.to).getHours(),
          bookedBy: {
            name: "Name for id: " + booking.member_id,
            id: booking.member_id
          },
          color: assignedColors[booking.member_id]
        };
      if (bookings[dayKey] === undefined) {
        bookings[dayKey] = [];
      }
      bookings[dayKey].push(oldBooking);
    }, this);
    this.setState({
      bookings: bookings,
      assignedColors: assignedColors
    })
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
      assignedColors: {},
      bookings: {},
      membersWithBookings: []
    });
  },
  showTimeSelector: function(e) {
    e.preventDefault();
    var thumbnailRect = e.currentTarget.getBoundingClientRect();
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
          var bookings = this.state.bookings;
          if (from === false) {
            // User cancelled booking
            console.log("User cancelled booking");
            this.setState({
              shouldDisplayTimeSelector: false
            });
          } else {
            // User selected hours, store booking
            var booking = {
              from: from,
              to: to,
              bookedBy: {
                name: this.props.currentMember.name,
                id: this.props.currentMember.id
              },
              color: this.state.assignedColors[44]
            };
            var dayKey = this.state.displayDate.year + "_" + this.state.displayDate.day.nr;
            if (bookings[dayKey] === undefined) {
              bookings[dayKey] = [booking];
            } else {
              bookings[dayKey].push(booking);
            }
            this.setState({
              shouldDisplayTimeSelector: false,
              bookings: bookings
            }, function() {
              var thumbnail = document.querySelector("a[data-datenr='" + this.state.displayDate.day.nr + "'] svg.booking");
              thumbnail.style.transform = thumbnail.style.transform == "rotateZ(360deg)" ? "rotateZ(0deg)" : "rotateZ(360deg)";
              // Talk to server
              $.post('/calendar_events', {
                calendar_event: {
                  from: new Date(displayDate.year, displayDate.month.nr, displayDate.day.nr, booking.from),
                  to: new Date(displayDate.year, displayDate.month.nr, displayDate.day.nr, booking.to),
                  project_id: this.props.projectId,
                  member_id: this.props.currentMember.id
                },
                authenticity_token: this.props.authenticity_token
              }, function(response) {
                console.log(response);
              })
            }.bind(this))
          }
        }.bind(this)
      );
      timeSelector.enterFrom(thumbnailRect.left, thumbnailRect.top);
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
        assignedColors={this.state.assignedColors}
        handleClick={this.showTimeSelector}
      />;
    }, this);
  },
  assignedColorFor: function(id) {
    return this.state.assignedColors[id];
  },
  render: function() {
    var days = this.daysFor(this.state.displayDate);
    var todaysDate = new Date().getDate();
    var todaysBookings = [];
    if (this.state.bookings[this.state.displayDate.year + "_" + todaysDate] !== undefined) {
      todaysBookings = this.state.bookings[this.state.displayDate.year + "_" + todaysDate].map(function(event, i) {
        return <p key={i}>{event.from.toLocaleString()}-{event.to.toLocaleString()}<br />{event.bookedBy.name}</p>
      })
    }
    
    var membersWithBookings = [];
    if (this.memberIdsWithBookings !== undefined) {
      this.props.members.forEach(function(member, i) {
        if (this.memberIdsWithBookings.includes(member.id)) {
          return membersWithBookings.push(member);
        }
      }, this);
    }
    return (
      <div className="calendar">
        <h1>{this.state.displayDate.month.name}</h1>
        <ul className="calendarDays">
          {days}
        </ul>
        {this.memberIdsWithBookings !== undefined ?
          <MemberLegend
            membersWithBookings={membersWithBookings}
            assignedColors={this.state.assignedColors}
          /> : null }
        <div className="todaysBookings">
          {todaysBookings.length > 0 ? <h2>Today</h2> : null }
          {todaysBookings.length > 0 ? todaysBookings : null}
        </div>
        <div className={this.state.shouldDisplayTimeSelector ? "timeSelectorContainer visible" : "timeSelectorContainer invisible"} >
          <canvas id="timeSelector" width="600" height="600"/>
          {this.memberIdsWithBookings !== undefined ?
            <MemberLegend
              membersWithBookings={membersWithBookings}
              assignedColors={this.state.assignedColors}
            /> : null }
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
            assignedColors={this.props.assignedColors}
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
          className={"circle bookedBy" + booking.bookedBy.id}
          style={
            {
              strokeDasharray: (range * hour) + "," + (190 - (range * hour)),
              strokeDashoffset: (-6 * hour) + (-booking.from * hour),
              stroke: this.props.assignedColors[booking.bookedBy.id],
              fill: "none",
              strokeWidth: "8"
            }
          }
        />
    }, this)
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

var MemberLegend = React.createClass({
  handleMouseOver: function(e) {
    e.preventDefault();
    var membersBookings = document.getElementsByClassName(e.target.dataset.id);
    Array.prototype.forEach.call(membersBookings, function(circle) {
      circle.style.opacity = 1;
      if (circle.parentNode.parentNode.className.indexOf("highlighted") == -1) {
        circle.parentNode.parentNode.className += "highlighted";
      }
    })
  },
  handleMouseOut: function(e) {
    var membersBookings = document.getElementsByClassName(e.target.dataset.id);
    Array.prototype.forEach.call(membersBookings, function(circle) {
      circle.style.opacity = null;
      circle.parentNode.parentNode.className = circle.parentNode.parentNode.className.replace("highlighted", "");
    })
  },
  render: function() {
    var membersWithBookings = this.props.membersWithBookings.map(function(member, i) {
      return (
        <li
          key={i}
          onMouseOver={this.handleMouseOver}
          onMouseOut={this.handleMouseOut}
          onTouchStart={this.handleMouseOver}
          onTouchEnd={this.handleMouseOut}
          data-id={"bookedBy" + member.id}
        >
          <span
            className="legendColorBox"
            style={{backgroundColor: this.props.assignedColors[member.id]}}
          ></span>
          {member.name}
        </li>
      )
    }, this)
    return (
      <div className="memberLegend">
        <ul>
          {membersWithBookings}
        </ul>
      </div>
    )
  }
})



