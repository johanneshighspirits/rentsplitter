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
        to: toDate.getHours() == 0 ? 24 : toDate.getHours(),
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
    var displayDate = new Date(this.props.displayDate);
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
        this.setState({
          shouldDisplayTimeSelector: false
        });
      break;
      case "create":
        // User selected hours, store booking
        var fromDate = new Date(this.state.displayDate);
        fromDate.setHours(from);
        var toDate = new Date(this.state.displayDate);
        toDate.setHours(to);
        var booking = {
          from: from,
          fromDate: fromDate,
          to: to,
          toDate: toDate,
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
          this.thumbnailUpdated(this.state.displayDate.getDate());
          
          var fromDate = new Date(this.state.displayDate);
          fromDate.setHours(booking.from);
          var toDate = new Date(this.state.displayDate);
          toDate.setHours(booking.to);
          // Talk to server
          $.post('/calendar_events', {
            calendar_event: {
              from: fromDate,
              to: toDate,
              project_id: this.props.projectId,
              member_id: this.props.currentMember.id
            },
            authenticity_token: this.props.authenticity_token
          }, function(response) {
            // TODO: Catch errors here
            // Set id on booking so we can retrieve it from database later
            var members = this.state.members;
            var membersBookings = members[this.props.currentMember.id].bookings;
            for (var i = membersBookings.length - 1; i >= 0; i--) {
              if (membersBookings[i].id === undefined && membersBookings[i].fromDate == booking.fromDate) {
                membersBookings[i].id = response.bookingId;
                break;
              }
            }
          }.bind(this))
        }.bind(this))
      break;
      case "edit":
        console.log("Edit: ", from, to, bookingId);
      break;
      case "destroy":
        var members = this.state.members;
        var membersBookings = members[this.props.currentMember.id].bookings.filter(function(booking) {
          return booking.id !== bookingId;
        });
        members[this.props.currentMember.id].bookings = membersBookings;
        this.setState({
          shouldDisplayTimeSelector: false,
          members: members
        }, function() {
          this.thumbnailUpdated(this.state.displayDate.getDate());
          $.post('/calendar_events/' + bookingId, {
            _method: "delete",
            authenticity_token: this.props.authenticity_token
          }, function(response) {
          // TODO: Catch errors here
//            console.log(response);
          });
        });
      break;
    }
  },
  thumbnailUpdated: function(id) {
    var thumbnail = document.querySelector("a[data-datenr='" + id + "'] svg.booking");
    thumbnail.style.transform = "rotateZ(360deg)";
  },
  showTimeSelector: function(e) {
    e.preventDefault();
    e.currentTarget.getElementsByClassName('booking')[0].style.transform = "rotateZ(0deg)";

    if (e.currentTarget.parentNode.className.indexOf('past') !== -1) return false;
    var thumbnailRect = e.currentTarget.getBoundingClientRect();
    var displayDate = new Date(this.state.displayDate);
    displayDate.setDate(e.currentTarget.dataset.datenr);
    this.setState({
      shouldDisplayTimeSelector: true,
      displayDate: displayDate
    }, function() {
      var clickedDate = new Date(this.state.displayDate);
      var timeSelector = new TimeSelector(
        'timeSelector',
        this.state.displayDate.getDate(),
        this.props.dayNames[this.state.displayDate.getDay()],
        this.props.monthNames[this.state.displayDate.getMonth() + 1],
        this.getBookingsFor(clickedDate),
        this.props.currentMember,
        this.timeSelected
      );
      timeSelector.enterFrom(thumbnailRect.left, thumbnailRect.top);
    });
  },
/**
*   Returns all bookings for specified date or date range.
*   If optional second parameter is present, return bookings from
*   startDate to endDate
*   @param {date} startDate - Return all bookings for this date
*   @param {date} [endDate] - If provided, this is the last date to
*                             return bookings for. 
*/
  getBookingsFor: function(startDate, endDate) {
    var bookings = [];
    for (var memberId in this.state.members) {
      if (!this.state.members.hasOwnProperty(memberId)) continue;
      var member = this.state.members[memberId];
      if (member.bookings.length > 0) {
        member.bookings.forEach(function(booking) {
          if (endDate !== undefined) {
            // Date range. Collect all bookings from startDate
            // to endDate (inclusive)
            if (booking.fromDate >= startDate && booking.fromDate <= endDate || booking.fromDate.toDateString() === startDate.toDateString() || booking.fromDate.toDateString() === endDate.toDateString()) {
              bookings.push(booking);
            }
          } else {
            // Single day. Collect all bookings from startDate only
            if (booking.fromDate.toDateString() === startDate.toDateString()) {
              bookings.push(booking);
            }
          }
        })
      }
    }
    return bookings;
  },
  changeMonth: function(e) {
    e.preventDefault();
    var displayDate = new Date(this.state.displayDate);
    if (e.target.className == "next") {
      displayDate.setMonth(displayDate.getMonth() + 1);
    } else {
      displayDate.setMonth(displayDate.getMonth() - 1);
    }
    this.setState({
      displayDate: displayDate
    })
  },
  daysInPrevMonth: function(date) {
    var firstOfPrevMonth = new Date(date); 
    firstOfPrevMonth.setDate(0);
    return firstOfPrevMonth.getDate();
  },
  daysInMonth: function(date) {
    var firstOfNextMonth = new Date(date);
    firstOfNextMonth.setMonth(date.getMonth() + 1);
    firstOfNextMonth.setDate(0);
    return firstOfNextMonth.getDate();
  },
  daysFor: function(date) {
    var displayDate = new Date(date);
    // Today's date
    var today = new Date();
    // Calculate number of days in displayDate's month
    var nrOfDays = this.daysInMonth(date);
    var nrOfDaysInPrevMonth = this.daysInPrevMonth(date);
    var firstWeekDay = new Date(date);
    firstWeekDay.setDate(1);
    var offset = firstWeekDay.getDay() === 0 ? 6 : firstWeekDay.getDay() - 1;
    var days = new Array(offset);
    // Init array with last month's last days so the first week
    // is filled with empty spaces if month doesn't start on a
    // Monday
    days.fill(0, 0, offset);
    for (var i = 1; i <= nrOfDays; i++) {
      days.push(i);
    }
    // Fill array with remaining days of the last week to make
    // sure it displays correctly
    while (days.length % 7 != 0) {
      days.push(0);
    }
    return days.map(function(day, i) {
      var weekDay = new Date(displayDate);
      weekDay.setDate(day);
      return <Day
        key={i}
        day={day}
        dayName={this.props.dayNames[weekDay.getDay()]}
        today={weekDay.toLocaleDateString() == today.toLocaleDateString()}
        future={weekDay > today || weekDay.toLocaleDateString() == today.toLocaleDateString()}
        sunday={(1 + i) % 7 === 0}
        bookings={this.getBookingsFor(weekDay)}
        members={this.state.members}
        handleClick={this.showTimeSelector}
      />;
    }, this);
  },
  render: function() {
    var dayNames = this.props.dayNames.slice();
    // Move Sunday to last position
    dayNames.push(dayNames.shift(0));
    dayNames = dayNames.map(function(dayName, i) {
      return <li key={"d" + i} className={"calendarDay legend" + (i == 6 ? " sunday" : "")}>{dayName.substr(0, 3).toUpperCase()}</li>
    })
    var days = this.daysFor(this.state.displayDate);
    var now = new Date();
    var todaysDate = now.getDate();
    var firstOfMonth = new Date(this.state.displayDate);
    firstOfMonth.setDate(1);
    var lastOfMonth = new Date(this.state.displayDate);
    lastOfMonth.setDate(this.daysInMonth(lastOfMonth));
    var isCurrentMonth = now.getFullYear() == this.state.displayDate.getFullYear() && now.getMonth() == this.state.displayDate.getMonth();
    return (
      <div className="calendar">
        <div className="monthDisplay">
          <h1>
            {isCurrentMonth ? <div className="prev"></div> : <a className="prev" href="#prev" onClick={this.changeMonth}>&lt;</a>}{this.props.monthNames[this.state.displayDate.getMonth() + 1]}
            <a className="next" href="#next" onClick={this.changeMonth}>&gt;</a>
          </h1>
          <p className="year">{this.state.displayDate.getFullYear()}</p>
        </div>
        <ul className="calendarDays">
          {dayNames}
          {days}
        </ul>
        <MemberLegend
          members={this.state.members}
          bookings={this.getBookingsFor(firstOfMonth, lastOfMonth)}
        />
        <Schedule bookings={this.getBookingsFor(now)} />
        <div className={this.state.shouldDisplayTimeSelector ? "timeSelectorContainer visible" : "timeSelectorContainer invisible"} >
          <canvas id="timeSelector" width="600" height="600"/>
          <MemberLegend
            members={this.state.members}
            bookings={this.getBookingsFor(this.state.displayDate)}
          />
        </div>
      </div>
    )
  }
});

var Schedule = React.createClass({
  render: function() {
    // Sort bookings by start time, so early bookings appear first.
    var todaysBookings = this.props.bookings.sort(function(a, b) { return a.from > b.from });
    todaysBookings = this.props.bookings.map(function(event, i) {
      return (
        <p key={i}>
          <span className="time" style={{ borderColor: event.color }}>{event.from.toLocaleString()}:00 - {event.to.toLocaleString()}:00</span>
          <span className="name">{event.bookedBy.name}</span>
        </p>
      )
    })
    
    return (todaysBookings.length > 0 ? 
      <div className="todaysBookings">
        <h2>Today</h2>
        {todaysBookings}
      </div>
      : null
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



