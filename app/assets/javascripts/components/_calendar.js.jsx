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
      "#3cd4bd",
      "#9ac9da"
    ];
    var members = {};
    // Prepare members
    this.props.members.forEach(function(member, i) {
      var newMember = member;
      newMember.color = colors.length > 0 ? colors.shift() : "#9b9b9b";
      newMember.bookings = [];
      members[member.id] = newMember;
    });
    // Check previous bookings and add to members
    this.props.bookings.forEach(function(booking, i) {
      var fromDate = new Date(booking.from);
      var toDate = new Date(booking.to);
      var dayKey = fromDate.getFullYear() + "_" + fromDate.getDate();
      var existingBooking = {
        id: booking.id,
        from: fromDate.getHours(),
        fromDate: fromDate,
        to: toDate.getHours(),
        toDate: toDate,
        bookedBy: {
          name: members[booking.member_id].name,
          id: booking.member_id
        },
        color: members[booking.member_id].color
      };
      members[booking.member_id].bookings.push(existingBooking);
    }, this);
    this.setState({
      members: members
    })
  },
  componentWillUnmount: function() {
    window.removeEventListener("resize", this.updateCalendarDaySize);
  },
  getInitialState: function() {
    var displayDate = this.props.displayDate;
    displayDate.date = new Date(this.props.displayDate.year, this.props.displayDate.month.nr, this.props.displayDate.day.nr);
    return ({
      shouldDisplayTimeSelector: false,
      displayDate: displayDate,
      members: {}
    });
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
  timeSelected: function(action, from, to, bookingId) {
    var members = this.state.members;
    switch (action) {
      case "cancel":
        // User cancelled booking
        console.log("User cancelled booking");
        this.setState({
          shouldDisplayTimeSelector: false
        });
      break;
      case "create":
        // User selected hours, store booking
        var booking = {
          from: from,
          fromDate: new Date(this.state.displayDate.year, this.state.displayDate.month.nr, this.state.displayDate.day.nr, from),
          to: to,
          toDate: new Date(this.state.displayDate.year, this.state.displayDate.month.nr, this.state.displayDate.day.nr, to),
          bookedBy: {
            name: this.props.currentMember.name,
            id: this.props.currentMember.id
          },
          color: this.state.members[this.props.currentMember.id].color
        };
        members[this.props.currentMember.id].bookings.push(booking);
        this.setState({
          shouldDisplayTimeSelector: false,
          members: members
        }, function() {
          var thumbnail = document.querySelector("a[data-datenr='" + this.state.displayDate.day.nr + "'] svg.booking");
          thumbnail.style.transform = thumbnail.style.transform == "rotateZ(360deg)" ? "rotateZ(0deg)" : "rotateZ(360deg)";
          // Talk to server
          $.post('/calendar_events', {
            calendar_event: {
              from: new Date(this.state.displayDate.year, this.state.displayDate.month.nr, this.state.displayDate.day.nr, booking.from),
              to: new Date(this.state.displayDate.year, this.state.displayDate.month.nr, this.state.displayDate.day.nr, booking.to),
              project_id: this.props.projectId,
              member_id: this.props.currentMember.id
            },
            authenticity_token: this.props.authenticity_token
          }, function(response) {
            console.log(response);
          })
        }.bind(this))
      break;
      case "edit":
        console.log("Edit: ", from, to, bookingId);
      break;
    }
  },
  showTimeSelector: function(e) {
    e.preventDefault();
    if (e.currentTarget.parentNode.className.indexOf('past') !== -1) return false;
    var thumbnailRect = e.currentTarget.getBoundingClientRect();
    var displayDate = this.state.displayDate;
    displayDate.day = {
      nr: e.currentTarget.dataset.datenr,
      name: e.currentTarget.dataset.dayname
    };
    displayDate.date = new Date(this.state.displayDate.year, this.state.displayDate.month.nr, e.currentTarget.dataset.datenr);

    this.setState({
      shouldDisplayTimeSelector: true,
      displayDate: displayDate
    }, function() {
      var clickedDate = new Date(this.state.displayDate.year, this.state.displayDate.month.nr, this.state.displayDate.day.nr);
      var timeSelector = new TimeSelector(
        'timeSelector',
        this.state.displayDate.day.nr,
        this.state.displayDate.day.name,
        this.state.displayDate.month.name,
        this.getBookingsFor(clickedDate),
        this.timeSelected
      );
      timeSelector.enterFrom(thumbnailRect.left, thumbnailRect.top);
    });
  },
  getBookingsFor: function(date) {
    var bookings = [];
    for (var memberId in this.state.members) {
      if (!this.state.members.hasOwnProperty(memberId)) continue;
      var member = this.state.members[memberId];
      if (member.bookings.length > 0) {
        member.bookings.forEach(function(booking) {
          if (booking.fromDate.toDateString() === date.toDateString()) {
            bookings.push(booking);
          }
        })
      }
    }
    return bookings;
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
        future={weekDay > today || weekDay.toLocaleDateString() == today.toLocaleDateString()}
        sunday={(1 + i) % 7 === 0}
        bookings={this.getBookingsFor(weekDay)}
        members={this.state.members}
        handleClick={this.showTimeSelector}
      />;
    }, this);
  },
  render: function() {
    var days = this.daysFor(this.state.displayDate);
    var now = new Date();
    var todaysDate = now.getDate();
    return (
      <div className="calendar">
        <h1>{this.state.displayDate.month.name}</h1>
        <ul className="calendarDays">
          {days}
        </ul>
        <MemberLegend
          members={this.state.members}
        />
        <Schedule bookings={this.getBookingsFor(now)} />
        <div className={this.state.shouldDisplayTimeSelector ? "timeSelectorContainer visible" : "timeSelectorContainer invisible"} >
          <canvas id="timeSelector" width="600" height="600"/>
          <MemberLegend
            members={this.state.members}
            bookings={this.getBookingsFor(this.state.displayDate.date)}
          />
        </div>
      </div>
    )
  }
});

var Schedule = React.createClass({
  render: function() {
    var todaysBookings = this.props.bookings.map(function(event, i) {
      console.log(event);
      return (
        <p key={i}>
          <span className="time" style={{ borderColor: event.color }}>{event.from.toLocaleString()}:00 - {event.to.toLocaleString()}:00</span>
          <span className="name">{event.bookedBy.name}</span>
        </p>
      )
    })
    return (
      <div className="todaysBookings">
        {todaysBookings.length > 0 ? <h2>Today</h2> : null }
        {todaysBookings.length > 0 ? todaysBookings : null}
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
      <li className={"calendarDay" + (this.props.future ? " future" : " past")}>
        <a
          onClick={this.props.handleClick}
          href="#"
          data-datenr={this.props.day}
          data-dayname={this.props.dayName}
          className={classNames.join(" ")}>
          <CalendarDayThumbnail
            day={this.props.day}
            bookings={this.props.bookings}
            members={this.props.members}
          />
          <span className="number">{this.props.day}</span>
        </a>
      </li>
    ) : (
      <li className={"calendarDay" + (this.props.future ? " future" : " past")}></li>
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
              stroke: this.props.members[booking.bookedBy.id].color,
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
        circle.parentNode.parentNode.className += " highlighted";
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
    var items = [];
    for (var memberId in this.props.members) {
      if (!this.props.members.hasOwnProperty(memberId)) continue;
      var member = this.props.members[memberId];
      if (member.bookings.length === 0) continue;
      if (this.props.bookings) {
        var hasBookings = false;
        this.props.bookings.forEach(function(booking, i) {
          if (booking.bookedBy.id == memberId) {
            hasBookings = true; 
          }
        }, this)
        if (!hasBookings) continue;
      }
      items.push(
        <li
          key={memberId}
          onMouseOver={this.handleMouseOver}
          onMouseOut={this.handleMouseOut}
          onTouchStart={this.handleMouseOver}
          onTouchEnd={this.handleMouseOut}
          data-id={"bookedBy" + member.id}
        >
          <span
            className="legendColorBox"
            style={{backgroundColor: member.color}}
          ></span>
          {member.name}
        </li>
      );
    }      
    return (
      <div className="memberLegend">
        <ul>
          {items}
        </ul>
      </div>
    )
  }
})



