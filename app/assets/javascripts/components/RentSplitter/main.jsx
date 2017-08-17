// Address namespace issue
window.RentSplitter = React.createClass({
  getInitialState: function(){
    return ({
      rents: [],
      rentDiscounts: [],
      members: []
    });
  },
  componentDidMount: function() {
    $.get('/projects/' + this.props.project.id + '/transfers.json', function(projectInfo){
      this.setState({
        rents: projectInfo.rentAndDiscounts.rents,
        rentDiscounts: projectInfo.rentAndDiscounts.discounts,
        members: projectInfo.memberTransfers.sort(this.sortMembers)
      });
    }.bind(this), 'json');
  },
  sortMembers: function(a, b) {
    if (a.name == this.props.currentMember.first_name + " " + this.props.currentMember.last_name) {
      return -1;
    }else if (b.name == this.props.currentMember.first_name + " " + this.props.currentMember.last_name) {
      return 1;
    }
    return a.name < b.name ? -1 : 1;
  },
  render: function() {
    var today = new Date();
    var thisMonth = today.getMonthName();
    var dueMonth = today.getDate() < 10 ? (new Date(today.getFullYear(), today.getMonth() - 1, 1)).getMonthName() : thisMonth;
    var members = this.state.members.length === 0 ? <Loader /> : this.state.members.map(function(member, m) {
      return (
        <MemberInfo
          key={m}
          order={m}
          member={member}
          projectName={this.props.project.name}
          currentMember={this.props.currentMember.first_name + " " + this.props.currentMember.last_name == member.name}
          dueMonth={dueMonth}
          transfers={member.transfers}
          rents={this.state.rents}
          rentDiscounts={this.state.rentDiscounts}
        />
      )
    }, this);
    var projectInfo = this.props.project.info !== null ? this.props.project.info.split("\n").map(function(line, i){
      var pattern = /\*([^\*]*)\*/gi;
      if (pattern.test(line)) {
        var html = {
          __html: line.replace(pattern, "<b>$1</b>") + "<br/>"
        }
        return <span key={i}><span dangerouslySetInnerHTML={html}></span></span>        
      }else{
        return <span key={i}>{line}<br /></span>
      }
    }) : null;
    return (
      <section className="centered">
        <article>
          <h2><a href="/projects">{this.props.project.name}</a></h2>
          <p>{projectInfo}</p>
        </article>
        <article>
          <ul>
            {members}
          </ul>
        </article>
      </section>
    )
  }
});

function easeInQuad(t, b, c, d) {
  return c * (t /= d) * t + b;
}

function counter(element, startNr, endNr, delay) {
  var time = 0;
  var diff = endNr;
  var minTime = 0;
  var maxTime = 1000 + delay;
  element.innerHTML = "0:-";

  for (var i = 0; i <= endNr; i++) {
    (function(s) {
      setTimeout(function() {
        element.innerHTML = s + ":-";
      }, time);
    })(i);
    time = easeInQuad(i, minTime, maxTime, diff);
  }
}

var MemberInfo = React.createClass({
  componentDidMount: function() {
    var counters = [].slice.call(ReactDOM.findDOMNode(this).getElementsByClassName('counter'));
    counters.forEach(function(element) {
      counter(element, 0, element.dataset['amount'], this.props.order * 1000);
    }, this);
  },
  render: function() {
    var isMember = this.props.member.isMember;
    var isInvited = this.props.member.isInvited;
    var isActivated = this.props.member.isActivated;
    /* transactionHistory is a list of all transactions that concerns this member.
    It is sorted on dates. */
    var transactionHistory = [];
    var totalAmountToPay = 0;
    // Add rent amount to be paid.
    this.props.rents.forEach(function(rent, i) {
      if (rent.from >= this.props.member.joinedAt && rent.to <= this.props.member.leftAt) {
        // Member had membership when this rent is due
        totalAmountToPay += parseFloat(rent.sharedAmount || 0);
        transactionHistory.push(
          <Transaction
            key={"rent" + i}
            type="rent"
            date={Date.parse(rent.longDate)}
            transaction={rent}
          />
        )
      }
    }, this);
    // Add rentDiscounts (a discount is transferred the month after, so discounts
    // added in March should be applied to member rent if member was participating
    // in Feburary)
    this.props.rentDiscounts.forEach(function(discount, i) {
      if (discount.from >= this.props.member.joinedAt && discount.to <= this.props.member.leftAt) {
        totalAmountToPay -= parseFloat(discount.sharedAmount || 0);
        transactionHistory.push(
          <Transaction
            key={"discount" + i}
            type="discount"
            date={Date.parse(discount.longDate)}
            transaction={discount}
          />
        )
      }else{
        console.log("Ignored discount " + discount.message + ": " + discount.from + "-" + discount.to + " since member joined " + this.props.member.joinedAt);
      }
    }, this);
    // Add transfers (every payment this member has ever made)
    this.props.transfers.forEach(function(transfer, i) {
      totalAmountToPay -= parseFloat(transfer.amount);
      transactionHistory.push(
        <Transaction
          key={"transfer" + i}
          type="transfer"
          date={Date.parse(transfer.longDate)}
          transaction={transfer}
        />
      )
    }, this);
    // Round total amount up
    totalAmountToPay = Math.ceil(totalAmountToPay);
    // Sort transactionHistory on dates.
    transactionHistory = transactionHistory.sort(function(a,b){ return b.props.date - a.props.date; })
    return (
      <div className={(isMember ? "memberInfo" : "memberInfo noLongerMember") + (this.props.currentMember ? " currentMember" : "")} style={{animationDelay: (this.props.order * 200) + "ms"}}>
        <h3>{this.props.member.name}
          <span>{isActivated ? "Member since " + this.props.member.joinedAt : isInvited ? "Invitation sent" : "Not invited yet" }</span>
        </h3>
        {!isMember ? <p className="noLongerMember">{this.props.member.name} är inte medlem i<br/>{this.props.projectName}.<br/><br/>{totalAmountToPay > 0 ? "KVARSTÅENDE SKULD: " + (totalAmountToPay * -1) + ":-" : "Alla skulder betalda."}</p> : null }
        {totalAmountToPay > 0 ?
        <span className="red" style={{background: "#d05959", color: "#FFF"}}>Att betala senast sista {this.props.dueMonth}:
          <span className="displayNumbers right counter" data-amount={totalAmountToPay}>{totalAmountToPay}:-</span>
        </span>
          :
        <span className="green" style={{background: "#499260", color: "#FFF"}}>Till godo:
          <span className="displayNumbers right counter" data-amount={totalAmountToPay * -1}>{totalAmountToPay * -1}:-</span>
        </span>
        }
        <table className="paddedTopBottom paddedLeftRight">
          <thead>
            <tr>
              <th colSpan="3" style={{paddingBottom: "0.7em", fontSize: "1.2em"}}>Alla transaktioner</th>
            </tr>
            <tr>
              <th>Datum</th>
              <th>Meddelande</th>
              <th>Belopp</th>
            </tr>
          </thead>
          <tbody>
            {/* transfers */}
            {transactionHistory}
          </tbody>
        </table>
      </div>
    )
  }
});

var Transaction = React.createClass({
  render: function() {
    return (
      <tr className={this.props.transaction.isNotViewedYet ? this.props.type + " newTransaction" : this.props.type}>
        <td width="33%" className="lined shortDate">{this.props.transaction.shortDate}</td>
        <td width="33%" className="lined longDate">{this.props.transaction.longDate}</td>
        <td width="50%" className="lined"><i>{this.props.transaction.message}</i></td>
        <td width="17%" className="lined right">{this.props.type == "rent" ? "-" : null}{this.props.transaction.sharedAmount || this.props.transaction.amount}:-</td>
      </tr>
    )
  }
})

var ExcelParser = React.createClass({
    parseExcelFile: function(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        // Array to hold transactions
        var transactions = [];
//        var displayDates = {};
        var lastUpdated;
        var rents = this.state.rents;

        var rawHtml = e.target.result;
        rawHtml = rawHtml.replace(/ BGCOLOR="#[A-F0-9]*"/gi, "");
        var rows = rawHtml.split('<TR>');
        for (var i = 0; i < rows.length; i++){
          var row = rows[i];
          if(row.indexOf("<TD height") != -1){
            row = row.replace(/<[^<>]*>/gi, "#");
            var elements = row.split('#');
            for (var k = 0; k < elements.length; k++){
              var element = elements[k];
              if(/(&nbsp;|\n|^$)/.test(element) == false){
                transactions.push(element);
              }
            }
          }else{
            var period = /Period: (\d{4}-\d{2}-\d{2}) till (\d{4}-\d{2}-\d{2})/.exec(row);
            if(period != null){
              lastUpdated = new Date(period[2]);
              // displayDates = {
              //   from: new Date(period[1]),
              //   to: new Date(period[2]),
              // }
              // for (var month = displayDates.from.getMonth(); month <= displayDates.to.getMonth(); month++) {
              //   var d = new Date();
              //   d.setFullYear(2016, (month + 1), 0);
              //   rents.push({
              //     due: d,
              //     amount: 9000,
              //   });
              // }
            }
          }
        }

        var abfs = this.state.abfs;
        var amountsPaid = this.state.amountsPaid;
        for (var m = 0; m < transactions.length; m+=5){
          var message = transactions[m + 2];
          if(/\d{3}:\d{4}:\d/gi.test(message)){
            // 123:1234:1 tyu
            // This is a abf bidrag
            var md5 = this.md5(transactions[m] + message);
            var abf = {
              "date": new Date(transactions[m]),
              "name": "ABF-bidrag",
              "message": message,
              "amount": parseFloat(transactions[m + 3].replace(" ", "")),
              "md5": md5
            };
            if (!hashedObjectIsInArray(abf, abfs)){
              abfs.push(abf);
              nrOfAbfsAdded++;
              console.log("ABF: " + abf.amount);
            }
          }else{
            // This is a rent transaction
            var name = this.guessPayer(message).name;
            var md5 = this.md5(transactions[m] + name + message + transactions[m + 3]);
            var amountPaid = {
              "date": new Date(transactions[m]),
              "paidBy": name,
              "message": message,
              "amount": parseFloat(transactions[m + 3].replace(" ", "")),
              "md5": md5
          };
            if(name == "UNKNOWN"){
              if(!this.ignore(message)){
                this.state.unknownTransactions.push(amountPaid);
              }
            }else if(!hashedObjectIsInArray(amountPaid, amountsPaid)){
              amountsPaid.push(amountPaid);
              console.log(name + ": " + amountPaid.amount);
            }
          }
        }
        console.log(rents);
        console.log("Ignored " + nrOfIgnores + " transactions");
        console.log("Added " + nrOfAbfsAdded + " abf's");
        console.log("Subtract " + (nrOfAbfsAdded + nrOfIgnores) + " from number of transactions");
        this.setState({
//          displayDates: displayDates,
          lastUpdated: lastUpdated,
          amountsPaid: amountsPaid,
          rents: rents,
          abfs: abfs,
          dataLoaded: true
        }, function(){
          this.saveToBackend();
        });
      };
    })(file).bind(this);

    // Read in the excel file as text.
    reader.readAsText(file);
  },
  render: function() {
    return <div>ExcelParser</div>
  }
})

var Loader = React.createClass({
  render: function(){
    return <p>Loading transactions...</p>
  }
})
